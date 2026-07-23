const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { message, faqList } = req.body;
    if (!message) {
      res.status(400).json({ error: 'messageが必要です' });
      return;
    }

    const faqText = faqList && faqList.length > 0 
      ? 'FAQ：' + faqList.map(f => `Q:${f.Q} A:${f.A}`).join(' ')
      : '';

    const systemPrompt = `スイミングスクール受付です。以下のFAQを基に回答してください。${faqText}`;

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'APIキーなし' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'API error' });
    }

    res.status(200).json({ reply: data.content[0].text });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
