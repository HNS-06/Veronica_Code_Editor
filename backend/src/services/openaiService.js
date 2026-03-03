const https = require('https');

class OpenAIService {
    static async generateStream(modelName, prompt, apiKey, onChunk) {
        const targetModel = modelName || 'gpt-4o-mini';
        const targetKey = apiKey || process.env.OPENAI_API_KEY;

        if (!targetKey) throw new Error("OpenAI API Key is missing");

        const body = JSON.stringify({
            model: targetModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            stream: true
        });

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${targetKey}`,
                'Content-Length': Buffer.byteLength(body)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                if (res.statusCode !== 200) {
                    let errData = '';
                    res.on('data', d => errData += d);
                    res.on('end', () => reject({ statusCode: res.statusCode, body: errData }));
                    return;
                }

                let buffer = '';
                res.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // keep remainder

                    for (const line of lines) {
                        if (line.trim() === 'data: [DONE]') continue;
                        if (line.startsWith('data: ')) {
                            try {
                                const parsed = JSON.parse(line.slice(6));
                                const text = parsed.choices[0]?.delta?.content;
                                if (text) onChunk(text);
                            } catch (_) { }
                        }
                    }
                });

                res.on('end', () => resolve(true));
                res.on('error', reject);
            });

            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    static async generateRest(modelName, prompt, apiKey) {
        const targetModel = modelName || 'gpt-4o-mini';
        const targetKey = apiKey || process.env.OPENAI_API_KEY;

        if (!targetKey) throw new Error("OpenAI API Key is missing");

        const body = JSON.stringify({
            model: targetModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4
        });

        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'api.openai.com',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${targetKey}`,
                    'Content-Length': Buffer.byteLength(body)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) throw new Error(data);
                        const parsed = JSON.parse(data);
                        const text = parsed.choices?.[0]?.message?.content || '';
                        resolve(text);
                    } catch (e) { reject(e); }
                });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }
}

module.exports = OpenAIService;
