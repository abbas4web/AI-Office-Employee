import { useState, useRef, useEffect } from 'react'
import { API_URL, authHeader } from '../api'

export default function AiChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m your AI assistant. Ask me anything about your tasks, clients, or workload.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const sendMessage = async () => {
    const prompt = input.trim()
    if (!prompt || loading) return

    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', text: prompt }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()

      setMessages(prev => [
        ...prev,
        { role: 'ai', text: data.reply || 'Sorry, I could not get a response.' }
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'ai', text: '⚠️ Failed to reach the AI. Please try again.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        className={`ai-chat-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(prev => !prev)}
        title="AI Assistant"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="ai-chat-window">
          <div className="ai-chat-header">
            <span>🤖 AI Assistant</span>
            <small>Powered by Groq · llama3</small>
          </div>

          <div className="ai-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-chat-bubble ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="ai-chat-bubble ai typing">
                <span></span><span></span><span></span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="ai-chat-input-row">
            <textarea
              className="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something... (Enter to send)"
              rows={2}
              disabled={loading}
            />
            <button
              className="ai-chat-send"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  )
}
