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

    async generate({ model, systemPrompt, userPrompt, temperature, recency, citations }) {
        this._init();
        console.log(`[LLMService] Generating with model: ${model}`);

        if (model.includes('gemini')) {
            return this._callGemini({ model, systemPrompt, userPrompt, temperature });
        } else if (model.includes('sonar') || model.includes('r1')) {
            return this._callPerplexity({ model, systemPrompt, userPrompt, temperature, recency, citations });
        }

        throw new Error(`Unsupported model: ${model}`);
    }

    async _callPerplexity({ model, systemPrompt, userPrompt, temperature, recency, citations }) {
        console.log(`[LLMService] Calling Perplexity API (model: ${model}, recency: ${recency})`);
        
        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
             console.warn("PERPLEXITY_API_KEY not found. Returning mock response.");
             return `[MOCK] Perplexity (${model}) response. \nRecency: ${recency}\nCitations: ${citations}\nPrompt: ${userPrompt.substring(0, 50)}...`;
        }

        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: userPrompt });

        const body = {
            model,
            messages,
            temperature: temperature || 0.2,
            return_citations: !!citations
        };
        
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
            
            if (citations && data.citations) {
                content += "\n\nCitations:\n" + data.citations.map((c, i) => `[${i+1}] ${c}`).join('\n');
            }
            
            return content;
        } catch (error) {
             console.error("Perplexity API Error:", error);
             throw new Error(`Perplexity API Error: ${error.message}`);
        }
    }

    async _callGemini({ model, systemPrompt, userPrompt, temperature }) {
        console.log(`[LLMService] Calling Gemini API (model: ${model}, temp: ${temperature})`);
        if (!this.genAI) {
            throw new Error("GEMINI_API_KEY not found in environment variables.");
        }

        // Use the model selected in the UI
        const apiModelName = model; 

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

        try {
            const result = await genModel.generateContent({
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                generationConfig
            });
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini API Error:", error);
            throw new Error(`Gemini API Error: ${error.message}`);
        }
    }
}

module.exports = new LLMService();