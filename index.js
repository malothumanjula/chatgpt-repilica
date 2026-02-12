const express = require('express');
const cors = require;
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());



let conversations = []; // In-memory conversation history

console.log('🔑 OpenAI:', process.env.OPENAI_API_KEY ? 'LOADED ✅' : 'MISSING ❌');

app.get('/', (req, res) => {
  res.json({ message: 'AI Chat Backend Ready 🚀' });
});

// Get conversation history
app.get('/conversations', (req, res) => {
  res.json(conversations.slice(0, 10));
});

// Main chat endpoint
app.post('/chat', async (req, res) => {
  console.log('🧠 AI Request:', req.body.message);
  
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Find or create conversation
    let convo = conversations.find(c => c.id === req.body.conversationId) || {
      id: Date.now().toString(),
      title: req.body.message.slice(0, 50),
      messages: []
    };

    // Add user message
    convo.messages.push({
      role: 'user',
      content: req.body.message,
      timestamp: new Date().toISOString()
    });

    // Get AI response with conversation context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant like ChatGPT. Answer any question clearly, accurately, and conversationally. Use code blocks for code examples.'
        },
        ...convo.messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        }))
      ],
      temperature: 0.7,
    });

    const aiReply = completion.choices[0].message.content;

    // Add AI response
    convo.messages.push({
      role: 'assistant',
      content: aiReply,
      timestamp: new Date().toISOString()
    });

    // Update conversations
    const convoIndex = conversations.findIndex(c => c.id === convo.id);
    if (convoIndex >= 0) {
      conversations[convoIndex] = convo;
    } else {
      conversations.unshift(convo);
    }

    console.log(`🤖 Replied to convo ${convo.id.slice(-6)}`);
    
    res.json({
      conversationId: convo.id,
      messages: convo.messages,
      conversations: conversations.slice(0, 10)
    });
    
  } catch (error) {
    console.error('💥 ERROR:', error.message);
    res.status(500).json({ 
      error: 'AI service unavailable',
      messages: [{ role: 'user', content: req.body.message }]
    });
  }
});

app.listen(5000, () => {
  console.log('🚀 AI CHAT SERVER: http://localhost:5000');
});
