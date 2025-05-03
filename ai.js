const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const auth = require('../middleware/auth');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Summarize text
router.post('/summarize', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Summarize the following text:\n\n${content}`
        }
      ],
      max_tokens: 150,
      temperature: 0.5,
    });

    res.json({ summary: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Error in summarization:', error);
    res.status(500).json({ 
      message: 'Error generating summary', 
      error: error.message 
    });
  }
});

// Generate tags
router.post('/tags', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Generate relevant tags for the following text (comma-separated):\n\n${content}`
        }
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    const tags = response.choices[0].message.content.trim().split(',').map(tag => tag.trim());
    res.json({ tags });
  } catch (error) {
    console.error('Error in tag generation:', error);
    res.status(500).json({ 
      message: 'Error generating tags', 
      error: error.message 
    });
  }
});

module.exports = router; 

