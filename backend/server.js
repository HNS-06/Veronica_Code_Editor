const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const aiRoutes = require('./src/routes/aiRoutes');
const { rateLimit } = require('./src/middleware/authMiddleware');
const ModelRouter = require('./src/services/modelRouter');
const { buildContext } = require('./src/utils/contextBuilder');



const app = express();
app.use(cors());
app.use(express.json());
app.use(rateLimit);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});



// Simple delay helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(prompt, socket, modelName, apiKeys) {
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            await ModelRouter.routeStream(modelName, prompt, apiKeys, (chunk) => {
                socket.emit('ai-stream-chunk', chunk);
            });
            console.log(`✓ Success with ${modelName || 'gemini-2.0-flash'}`);
            return true;
        } catch (err) {
            const code = err?.statusCode;
            if (code === 429) {
                const waitTime = (attempt + 1) * 4000;
                console.warn(`Rate limit hit (attempt ${attempt + 1}/${MAX_RETRIES}), waiting ${waitTime / 1000}s...`);
                if (attempt === 0) socket.emit('ai-stream-chunk', '_Veronica is thinking..._\n\n');
                await sleep(waitTime);
                continue;
            }
            console.error(`Error (${code}):`, err?.body?.slice?.(0, 200) || err);
            throw err;
        }
    }
    return false;
}

io.on('connection', (socket) => {
    console.log('AI Core: Client connected', socket.id);

    socket.on('ask-ai', async ({ message, context, isAgentMode, model, geminiKey, openaiKey, modePrompt, projectMeta }) => {
        try {
            socket.emit('ai-stream-start');

            const prompt = buildContext(message, context, context?.selectedCode, context?.projectStructure, message, isAgentMode, modePrompt, projectMeta);

            const ok = await generateWithRetry(prompt, socket, model, { gemini: geminiKey, openai: openaiKey });
            if (!ok) {
                socket.emit('ai-stream-chunk', 'Veronica is rate-limited or the API key is invalid. Please try again.');
            }

            socket.emit('ai-stream-end');
        } catch (error) {
            console.error("AI Error:", error?.statusCode || error?.message || error);
            socket.emit('ai-stream-chunk', 'An error occurred. Check your API Keys and network connection.');
            socket.emit('ai-stream-end');
        }
    });

    socket.on('disconnect', () => {
        console.log('AI Core: Client disconnected', socket.id);
    });
});

// ─── REST Endpoints ─────────────────────────────────────────────────────────

app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', orchestratorLoaded: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`\n🚀 Veronica AI Modular API running on port ${PORT}`);
    console.log(`🛡️ Architecture: REST (Express) + WebSockets (Socket.IO/ws)\n`);
});
