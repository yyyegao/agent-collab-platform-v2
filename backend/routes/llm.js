const express = require('express');
const router = express.Router();

// LLM 代理路由 - 解决SSL问题
router.post('/chat', async (req, res) => {
  const { provider, model, messages, temperature, maxTokens } = req.body;
  const apiKey = req.headers['x-api-key'];
  
  let baseUrl = 'https://api.openai.com/v1';
  
  if (provider === 'minimax') {
    baseUrl = 'https://api.minimax.chat/v1';
  } else if (provider === 'longcat') {
    baseUrl = 'https://api.longcat.chat/openai/v1';
  }
  
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 4096,
      }),
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
