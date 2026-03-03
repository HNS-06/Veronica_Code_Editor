function buildContext(prompt, currentFile, selectedCode, projectStructure, userMessage, isAgentMode = false, modePrompt = null, projectMeta = null) {
    let contextPrompt = '';

    // Prepend the active Intent Mode system directive
    if (modePrompt) {
        contextPrompt += `${modePrompt}\n\n`;
    }

    // Prepend project intelligence if available
    if (projectMeta) {
        contextPrompt += `PROJECT CONTEXT: Framework=${projectMeta.framework}, Language=${projectMeta.language}, Architecture=${projectMeta.architecture}.\n\n`;
    }

    if (isAgentMode && currentFile) {
        contextPrompt += `You are an expert AI coding assistant embedded in a code editor.\n`;
        contextPrompt += `Agent Mode is ON. The user is currently viewing/editing the file: '${currentFile.fileName}'.\n`;
        if (projectStructure) {
            contextPrompt += `Project Structure Context:\n${projectStructure}\n\n`;
        }
        if (currentFile.code) {
            contextPrompt += `File content:\n\`\`\`${currentFile.language || ''}\n${currentFile.code.slice(0, 10000)}\n\`\`\`\n\n`;
        }
        if (selectedCode) {
            contextPrompt += `The user has highlighted the following code:\n\`\`\`\n${selectedCode}\n\`\`\`\n\n`;
        }
        contextPrompt += `User request: "${prompt || userMessage}"\n`;
        contextPrompt += `Give a comprehensive, accurate response using markdown code blocks.`;
    } else {
        contextPrompt += `You are an expert AI coding assistant embedded in a code editor.\n`;
        contextPrompt += `User request: "${prompt || userMessage}"\n`;
        contextPrompt += `Be concise, helpful, and use markdown when writing code.`;
    }

    return contextPrompt;
}

module.exports = {
    buildContext
};
