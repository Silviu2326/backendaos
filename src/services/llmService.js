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

    async generate({ model, systemPrompt, userPrompt, temperature, recency, citations, schema }) {
        this._init();
        console.log(`[LLMService] Generating with model: ${model}, schema: ${schema ? 'YES' : 'NO'}`);

        if (model.includes('gemini')) {
            return this._callGemini({ model, systemPrompt, userPrompt, temperature, schema });
        } else if (model.includes('sonar') || model.includes('r1')) {
            return this._callPerplexity({ model, systemPrompt, userPrompt, temperature, recency, citations, schema });
        }

        throw new Error(`Unsupported model: ${model}`);
    }

    async _callPerplexity({ model, systemPrompt, userPrompt, temperature, recency, citations, schema }) {
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
                content += "\n\nCitations:\n" + data.citations.map((c, i) => `[${i+1}] ${c}`).join('\n');
            }

            return content;
        } catch (error) {
             console.error("Perplexity API Error:", error);
             throw new Error(`Perplexity API Error: ${error.message}`);
        }
    }

    async _callGemini({ model, systemPrompt, userPrompt, temperature, schema }) {
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
                console.log('[LLMService] Using structured output schema');
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