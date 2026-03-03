const express = require('express');
const Agents = require('../agents');

const router = express.Router();

/**
 * REST Endpoint for Ghost Text / Autocomplete
 * POST /api/ai/complete
 */
router.post('/complete', async (req, res) => {
    await Agents.complete(req, res);
});

/**
 * REST Endpoint for Multi-Agent Tasks (Refactor, Debug, Docs, etc.)
 * POST /api/ai/agent
 */
router.post('/agent', async (req, res) => {
    await Agents.executeAgent(req, res);
});

module.exports = router;
