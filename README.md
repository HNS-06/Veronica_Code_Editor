<<<<<<< HEAD
# Veronica_Code_Editor
=======
# Veronica Code Editor

![Veronica](https://grainy-gradients.vercel.app/noise.svg)

Veronica is a production-ready, AI-powered desktop code editor built for the next generation of software development. It combines the power of VS Code's engine (Monaco Editor) with a beautiful, glowing glassmorphism design and real-time context-aware AI agents.

## Features

- ⚛️ **React + Electron**: Built on a modern, fast tech stack.
- 🎨 **Glassmorphism UI**: Stunning true-dark theme with blurred backgrounds, neon glows, and custom scrollbars.
- 📝 **Monaco Engine**: Powered by the same robust code editor engine that drives VS Code.
- 🧠 **Context-Aware AI Assistants**: Real-time websocket-powered AI streaming. It knows the context of your file.
- 🗂 **Multi-Panel Layout**: Resizable sidebars, File Explorer, and floating/dockable AI Chat window.

## Installation & Setup

Ensure you have Node.js v18+ installed on your machine.

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/your-username/veronica.git
   cd veronica
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Run in Development Mode:**
   To start the frontend UI, the AI backend server, and the Electron wrapper concurrently:
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Build for Production:**
   To package the application into a standalone desktop executable:
   \`\`\`bash
   npm run build
   \`\`\`

## Architecture

- **Renderer (Frontend)**: React, Vite, TailwindCSS (for glass UI), framer-motion (for micro-animations), and `lucide-react` (for icons). It connects to the AI backend via `socket.io-client`.
- **Main (Electron)**: A secure `preload.js` bridge context-isolates the native system APIs from the renderer.
- **Backend (AI Server)**: An Express app running on port 4000. It uses `socket.io` for streaming AI chunks back to the renderer in real-time, simulating a true multi-agent workflow.

## Future Roadmap

1. **Voice-to-Code**: Integrate the Web Speech API so developers can dictate logic and have it immediately inserted.
2. **Context Aggregation Agent**: Automatically summarize the entire \`src/\` folder and pass it as RAG (Retrieval-Augmented Generation) context to the LLM.
3. **Command Palette**: (Ctrl+Shift+P) for executing fast, plugin-ready commands.
4. **Git UI**: Implement the visual Git branching and commit UI.

---

*Designed and engineered by Veronica AI.*
>>>>>>> 9bf668d (new code editor)
