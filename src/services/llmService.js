const { GoogleGenerativeAI } = require("@google/generative-ai");

class LLMService {
    constructor() {
        this.genAI = null;
    }

    _init() {
        if (!this.genAI && process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }
    }

    async generate({ model, systemPrompt, userPrompt, temperature, recency, citations, schema, outputMode }) {
        this._init();
        console.log(`[LLMService] Generating with model: ${model}, schema: ${schema ? 'YES' : 'NO'}`);

        if (model.includes('gemini')) {
            return this._callGemini({ model, systemPrompt, userPrompt, temperature, schema, outputMode });
        } else if (model.includes('sonar') || model.includes('r1')) {
            return this._callPerplexity({ model, systemPrompt, userPrompt, temperature, recency, citations, schema, outputMode });
        }

        throw new Error(`Unsupported model: ${model}`);
    }

    async _callPerplexity({ model, systemPrompt, userPrompt, temperature, recency, citations, schema, outputMode }) {
        console.log(`[LLMService] Calling Perplexity API (model: ${model}, recency: ${recency})`);

        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            console.warn("PERPLEXITY_API_KEY not found. Returning mock response.");
            return `[MOCK] Perplexity (${model}) response. \nRecency: ${recency}\nCitations: ${citations}\nPrompt: ${userPrompt.substring(0, 50)}...`;
        }

        // Parse schema if provided
        let parsedSchema = null;
        if (schema) {
            try {
                parsedSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;
                console.log('[LLMService] Schema provided for Perplexity');
            } catch (e) {
                console.warn('[LLMService] Failed to parse schema, ignoring:', e.message);
            }
        }

        const isReasoning = model.includes('reasoning') || model.includes('r1');
        const messages = [];

        // Perplexity Reasoning models do NOT support system prompts.
        // We must merge system instructions into the user prompt.
        let finalUserPrompt = userPrompt;
        let finalSystemPrompt = systemPrompt || '';

        // STRATEGY: 
        // 1. For Reasoning models: Use Prompt Engineering for JSON (response_format often not supported)
        // 2. For Standard models (sonar-pro, etc): Use native response_format
        if (parsedSchema && isReasoning) {
            const schemaInstruction = `\n\nIMPORTANT: You MUST respond with valid JSON matching this exact schema:\n${JSON.stringify(parsedSchema, null, 2)}\n\nDo not include any text outside the JSON object.`;
            finalUserPrompt += schemaInstruction;
        } else if (outputMode === 'free') {
            const jsonInstruction = `\n\nIMPORTANT: You MUST respond with valid JSON. The structure is flexible, but it must be valid JSON syntax.\n\nDo not include any text outside the JSON object.`;
            finalUserPrompt += jsonInstruction;
        }

        if (isReasoning) {
            // For reasoning models, prepend system prompt to user prompt
            if (finalSystemPrompt) {
                finalUserPrompt = `System Instructions:\n${finalSystemPrompt}\n\nUser Request:\n${finalUserPrompt}`;
            }
            messages.push({ role: 'user', content: finalUserPrompt });
        } else {
            // Standard models support system prompt
            if (finalSystemPrompt) messages.push({ role: 'system', content: finalSystemPrompt });
            messages.push({ role: 'user', content: finalUserPrompt });
        }

        const body = {
            model,
            messages,
            return_citations: !!citations
        };

        // Apply native JSON schema for non-reasoning models
        if (parsedSchema && !isReasoning) {
            body.response_format = {
                type: 'json_schema',
                json_schema: {
                    schema: parsedSchema
                }
            };
        }

        // Reasoning models do not support temperature (or it should be 1, but omitting is safer)
        if (!isReasoning) {
            body.temperature = temperature || 0.2;
        }

        if (recency) {
            body.search_recency_filter = recency;
        }

        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Perplexity API Error: ${response.status} - ${error}`);
            }

            const data = await response.json();
            let content = data.choices[0].message.content;

            // Validate JSON if schema was provided
            if (parsedSchema) {
                try {
                    JSON.parse(content); // Verify it's valid JSON
                    console.log('[LLMService] Validated JSON response from Perplexity');
                } catch (e) {
                    console.error('[LLMService] Perplexity response is not valid JSON:', content);
                    throw new Error('Model did not return valid JSON');
                }
            }

            if (citations && data.citations && !parsedSchema) {
                content += "\n\nCitations:\n" + data.citations.map((c, i) => `[${i + 1}] ${c}`).join('\n');
            }

            return content;
        } catch (error) {
            console.error("Perplexity API Error:", error);
            throw new Error(`Perplexity API Error: ${error.message}`);
        }
    }

    async _callGemini({ model, systemPrompt, userPrompt, temperature, schema, outputMode }) {
        console.log(`[LLMService] Calling Gemini API (model: ${model}, temp: ${temperature})`);
        if (!this.genAI) {
            throw new Error("GEMINI_API_KEY not found in environment variables.");
        }

        // Use the model selected in the UI
        const apiModelName = model;

        // Parse schema if it's a string
        let parsedSchema = null;
        if (schema) {
            try {
                parsedSchema = typeof schema === 'string' ? JSON.parse(schema) : schema;
                console.log('[LLMService] Using structured output schema. Keys:', Object.keys(parsedSchema));

                // Helper to recursively normalize schema for Gemini
                const normalizeSchema = (s) => {
                    if (s === undefined || s === null) return { type: "string" }; // Default to string for missing/null

                    // Case 1: The "schema" is actually a primitive value (string, boolean, number)
                    // This happens when data is injected into the schema field.
                    // We must convert it to a valid Type Definition.
                    const validTypes = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'];

                    if (typeof s === 'string') {
                        if (validTypes.includes(s)) return { type: s }; // It was just "string" -> { type: "string" }

                        // MAGIC FEATURE: Treat the string value as a DESCRIPTION/INSTRUCTION for the field.
                        // This allows users to define schemas using an "Example JSON" where values explain what to generate.
                        // e.g. "intent_sentence": "Write a punchy hook here" -> { type: "string", description: "Write a punchy hook here" }
                        console.log(`[LLMService] Transforming value "${s.substring(0, 30)}..." into schema description.`);
                        return { type: "string", description: s };
                    }

                    if (typeof s === 'boolean') {
                        console.warn(`[LLMService] invalid schema boolean value "${s}". Replacing with { type: "boolean" }`);
                        return { type: "boolean" };
                    }

                    if (typeof s === 'number') {
                        console.warn(`[LLMService] invalid schema number value "${s}". Replacing with { type: "number" }`);
                        return { type: "number" };
                    }

                    // Case 2: It is an object
                    if (typeof s === 'object') {
                        // Check if it looks like a schema definition
                        const isSchemaObject = s.type || s.properties || s.items || s.enum;

                        // If it's an array, it's not a valid schema root (unless it's an enum, but usually schema is object)
                        if (Array.isArray(s)) {
                            console.warn(`[LLMService] invalid schema array found. Defaulting to { type: "array", items: { type: "string" } }`);
                            return { type: "array", items: { type: "string" } };
                        }

                        // If it has NO schema keywords, assume it is a nested properties map
                        if (!isSchemaObject) {
                            const keys = Object.keys(s);
                            return {
                                type: "object",
                                properties: keys.reduce((acc, key) => {
                                    acc[key] = normalizeSchema(s[key]);
                                    return acc;
                                }, {}),
                                required: keys // FORCE all fields to be generated
                            };
                        }

                        // If it HAS schema keywords, validate them recursively
                        if (s.properties) {
                            Object.keys(s.properties).forEach(key => {
                                s.properties[key] = normalizeSchema(s.properties[key]);
                            });
                        }

                        if (s.items) {
                            s.items = normalizeSchema(s.items);
                        } else if (s.type === 'array') {
                            // Fix: Arrays MUST have items. If missing, default to string items.
                            console.warn(`[LLMService] Array schema missing 'items'. Defaulting to string items.`);
                            s.items = { type: "string" };
                        }

                        // Fix invalid 'type' values inside the object
                        if (s.type && !validTypes.includes(s.type)) {
                            console.warn(`[LLMService] Invalid type "${s.type}" in object. Resetting to "string".`);
                            s.type = "string";
                            delete s.properties;
                            delete s.items;
                        }

                        // Ensure type is present
                        if (!s.type) {
                            if (s.properties) s.type = "object";
                            else if (s.items) s.type = "array";
                            else s.type = "string"; // Fallback
                        }

                        return s;
                    }

                    return { type: "string" }; // Catch-all
                };

                // Auto-fix: If schema is just a list of properties without "type": "object", wrap it.
                // Gemini STRICTLY requires the root to be a Schema object.
                if (parsedSchema && !parsedSchema.type && !parsedSchema.properties) {
                    console.log('[LLMService] Detected simplified schema root. Wrapping in standard JSON Schema format.');
                    const rootKeys = Object.keys(parsedSchema);
                    parsedSchema = {
                        type: "object",
                        properties: rootKeys.reduce((acc, key) => {
                            acc[key] = normalizeSchema(parsedSchema[key]);
                            return acc;
                        }, {}),
                        required: rootKeys // CRITICAL FIX: Force generation of all root fields
                    };
                } else {
                    // Even if root is fine, traverse down to fix nested objects
                    parsedSchema = normalizeSchema(parsedSchema);
                }

                if (parsedSchema.type) console.log('[LLMService] Schema type:', parsedSchema.type);
            } catch (e) {
                console.warn('[LLMService] Failed to parse schema, ignoring:', e.message);
            }
        }

        const genModel = this.genAI.getGenerativeModel({
            model: apiModelName,
            systemInstruction: systemPrompt ? {
                role: "system",
                parts: [{ text: systemPrompt }]
            } : undefined
        });

        const generationConfig = {
            temperature: temperature || 0.7,
        };

        // Add JSON mode if schema is provided
        if (parsedSchema) {
            generationConfig.responseMimeType = 'application/json';
            generationConfig.responseSchema = parsedSchema;
        } else if (outputMode === 'free') {
            // Free JSON Mode: Force JSON output but without a strict schema
            console.log('[LLMService] Using Free JSON Mode (responseMimeType: application/json)');
            generationConfig.responseMimeType = 'application/json';
        }

        try {
            const result = await genModel.generateContent({
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                generationConfig
            });
            const response = await result.response;
            const text = response.text();

            // Validate JSON if schema was used
            if (parsedSchema) {
                try {
                    JSON.parse(text); // Verify it's valid JSON
                    console.log('[LLMService] Validated JSON response');
                } catch (e) {
                    console.error('[LLMService] Response is not valid JSON:', text);
                    throw new Error('Model did not return valid JSON');
                }
            }

            return text;
        } catch (error) {
            console.error("Gemini API Error:", error);
            throw new Error(`Gemini API Error: ${error.message}`);
        }
    }
}

module.exports = new LLMService();