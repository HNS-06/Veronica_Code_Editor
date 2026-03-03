const ModelRouter = require('../services/modelRouter');
const { buildContext } = require('../utils/contextBuilder');

class Agents {
    static async complete(req, res) {
        const { code, language, model, geminiKey, openaiKey } = req.body;
        if (!code) return res.json({ completion: '' });

        const prompt = `Complete the following ${language || ''} code. Return ONLY the completion (no markdown, no fences, no explanation). Insert directly after the last character.\n\nCode up to cursor:\n${code.slice(-1500)}`;

        try {
            const result = await ModelRouter.routeRest(model, prompt, { gemini: geminiKey, openai: openaiKey });
            const clean = result.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
            res.json({ completion: clean.split('\n')[0] });
        } catch (e) {
            console.error('Completion Error:', e);
            res.json({ completion: '' });
        }
    }

    static async executeAgent(req, res) {
        const { agent, code, fileName, language, userMessage, model, geminiKey, openaiKey } = req.body;
        if (!agent) return res.status(400).json({ error: 'agent required' });

        const lang = language || '';
        const file = fileName ? `File: ${fileName}\n` : '';
        const codeBlock = code ? `\`\`\`${lang}\n${code.slice(0, 8000)}\n\`\`\`` : '';

        const prompts = {
            debug: `You are Veronica Debug Agent. Analyze for bugs, runtime errors, and logical issues.\n${file}${codeBlock}\nProvide: 1) Root cause 2) Fixed code 3) Prevention tips. Use markdown.`,
            refactor: `You are Veronica Refactor Agent. Refactor for clarity, performance, maintainability.\n${file}${codeBlock}\n${userMessage ? `Instruction: ${userMessage}\n` : ''}Keep functionality identical. Return full refactored code in a code block.`,
            security: `You are Veronica Security Agent. Audit for vulnerabilities.\n${file}${codeBlock}\nFind: injection, XSS, auth issues, exposed secrets. Rate severity. Suggest fixes.`,
            testgen: `You are Veronica Test Generator. Write comprehensive unit tests for this code.\n${file}${codeBlock}\nUse Jest/Vitest for JS/TS, pytest for Python. Cover happy paths + edge cases. Return a complete test file.`,
            docgen: `You are Veronica Doc Agent. Add complete JSDoc/docstrings to every function and class.\n${file}${codeBlock}\nReturn the full file with docs added, no logic changes.`,
            explain: `You are Veronica Explain Agent. Explain this code clearly for an intermediate dev.\n${file}${codeBlock}\nCover: what it does, how it works, any gotchas. Use bullet points.`,
        };

        const prompt = prompts[agent] || `You are Veronica AI. ${userMessage || ''}`;

        try {
            const result = await ModelRouter.routeRest(model, prompt, { gemini: geminiKey, openai: openaiKey });
            res.json({ result });
        } catch (err) {
            console.error(`Agent (${agent}) error:`, err.message);
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = Agents;
