import { useEffect, useRef, useState } from 'react';
import './App.css';

const API = 'http://localhost:5000';

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConvoId, setCurrentConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    fetch(`${API}/conversations`)
      .then(res => res.json())
      .then(data => {
        setConversations(data);
        if (data.length > 0) {
          setCurrentConvoId(data[0].id);
          setMessages(data[0].messages || []);
        }
      })
      .catch(err => console.error('Load error:', err));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConvoId
        }),
      });

      const data = await response.json();
      
      // Update with full conversation from backend
      setMessages(data.messages);
      setConversations(data.conversations || conversations);
      setCurrentConvoId(data.conversationId);
      
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again!'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = (convoId) => {
    const convo = conversations.find(c => c.id === convoId);
    if (convo) {
      setMessages(convo.messages);
      setCurrentConvoId(convoId);
    }
  };

  const newChat = () => {
    setMessages([]);
    setCurrentConvoId(null);
    setConversations([]);
  };

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>💬 Chats</h3>
          <button onClick={newChat} className="new-chat-btn">+ New</button>
        </div>
        <div className="chat-list">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={`chat-item ${convo.id === currentConvoId ? 'active' : ''}`}
              onClick={() => loadConversation(convo.id)}
            >
              <div className="chat-preview">{convo.title}</div>
              <div className="chat-time">
                {new Date(convo.messages?.[0]?.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div className="chat-main">
        <div className="chat-header">
          <h1>🤖 AI Assistant</h1>
          <p>Persistent conversations • Mobile responsive</p>
        </div>
        
        <div className="messages">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-icon">✨</div>
              <h2>Hello! Ask me anything</h2>
              <p>Your conversations are automatically saved</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`message ${msg.role}`}>
                <div className="message-content">
                  <pre>{msg.content}</pre>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="message assistant">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything... (Ctrl+Enter to send)"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
