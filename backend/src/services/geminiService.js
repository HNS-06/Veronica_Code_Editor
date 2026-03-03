const https = require('https');

class GeminiService {
    static async generateStream(modelName, prompt, apiKey, onChunk) {
        const targetModel = modelName || 'gemini-2.0-flash';
        const targetKey = apiKey || process.env.GEMINI_API_KEY;

        const body = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${targetModel}:streamGenerateContent?key=${targetKey}&alt=sse`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
                    buffer = lines.pop();

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.slice(6).trim();
                            if (!jsonStr || jsonStr === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(jsonStr);
                                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
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
        const targetModel = modelName || 'gemini-2.0-flash';
        const targetKey = apiKey || process.env.GEMINI_API_KEY;

        const body = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 4096 }
        });

        return new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/${targetModel}:generateContent?key=${targetKey}`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) throw new Error(data);
                        const parsed = JSON.parse(data);
                        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

module.exports = GeminiService;
