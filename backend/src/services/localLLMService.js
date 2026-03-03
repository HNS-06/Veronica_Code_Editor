const http = require('http');

class LocalLLMService {
    static async generateStream(modelName, prompt, apiKey, onChunk) {
        // Defaulting to ollama localhost port 11434
        const targetModel = modelName || 'llama3';

        const body = JSON.stringify({
            model: targetModel,
            prompt: prompt,
            stream: true
        });

        const options = {
            hostname: 'localhost',
            port: 11434,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                if (res.statusCode !== 200) {
                    let errData = '';
                    res.on('data', d => errData += d);
                    res.on('end', () => reject({ statusCode: res.statusCode, body: errData }));
                    return;
                }

                res.on('data', (chunk) => {
                    try {
                        const parsed = JSON.parse(chunk.toString());
                        if (parsed.response) onChunk(parsed.response);
                    } catch (_) { }
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
        const targetModel = modelName || 'llama3';

        const body = JSON.stringify({
            model: targetModel,
            prompt: prompt,
            stream: false
        });

        return new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 11434,
                path: '/api/generate',
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        if (res.statusCode !== 200) throw new Error(data);
                        const parsed = JSON.parse(data);
                        resolve(parsed.response || '');
                    } catch (e) { reject(e); }
                });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }
}

module.exports = LocalLLMService;
