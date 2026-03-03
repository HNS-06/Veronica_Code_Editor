const GeminiService = require('./geminiService');
const OpenAIService = require('./openaiService');
const LocalLLMService = require('./localLLMService');

class ModelRouter {
    /**
     * Determines which service to use based on the model string
     * @param {string} model 
     * @returns {Class} The service class
     */
    static getService(model) {
        const m = (model || '').toLowerCase();

        if (m.startsWith('gpt')) {
            return OpenAIService;
        }

        if (m.startsWith('gemini')) {
            return GeminiService;
        }

        // Fallback or explicit local
        if (m.startsWith('local') || process.env.AI_PROVIDER === 'local') {
            return LocalLLMService;
        }

        // Default
        return GeminiService;
    }

    /**
     * Route stream generation to the correct provider
     */
    static async routeStream(modelName, prompt, apiKeys, onChunk) {
        const service = this.getService(modelName);
        let keyToUse = apiKeys.gemini;
        if (service === OpenAIService) keyToUse = apiKeys.openai;

        return await service.generateStream(modelName, prompt, keyToUse, onChunk);
    }

    /**
     * Route REST generation to the correct provider
     */
    static async routeRest(modelName, prompt, apiKeys) {
        const service = this.getService(modelName);
        let keyToUse = apiKeys.gemini;
        if (service === OpenAIService) keyToUse = apiKeys.openai;

        return await service.generateRest(modelName, prompt, keyToUse);
    }
}

module.exports = ModelRouter;
