import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../lib/api'

export default function ChatPanel({ metadata }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setError(null)
    setInput('')

    // Add user message
    const userMessage = { role: 'user', content: text, timestamp: Date.now() }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await sendChatMessage(text, metadata, sessionId)
      if (response.session_id && !sessionId) {
        setSessionId(response.session_id)
      }
      const aiMessage = { role: 'assistant', content: response.response, timestamp: Date.now() }
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      setError(err.message)
      const errorMessage = { role: 'error', content: err.message, timestamp: Date.now() }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestions = [
    'Which columns contain personal information?',
    'Is this dataset safe to share publicly?',
    'How many high sensitivity columns are there?',
    'Summarize this dataset for me.',
  ]

  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden" id="chat-panel">
      {/* Header */}
      <div className="px-5 py-4 border-b border-surface-100 bg-gradient-to-r from-primary-50 to-surface-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-surface-800">Chat with your Data</h3>
            <p className="text-xs text-surface-400">Ask questions about your dataset metadata</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-[360px] overflow-y-auto px-5 py-4 space-y-4 bg-surface-50/50" id="chat-messages">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-surface-600 mb-1">Start a conversation</p>
            <p className="text-xs text-surface-400 mb-5">Ask anything about your dataset</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  className="text-xs px-3 py-1.5 bg-white border border-surface-200 rounded-full text-surface-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-md shadow-md shadow-primary-500/20'
                  : msg.role === 'error'
                    ? 'bg-danger-100 text-danger-500 border border-red-200 rounded-bl-md'
                    : 'bg-white text-surface-700 border border-surface-200 rounded-bl-md shadow-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-surface-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-surface-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-5 py-4 border-t border-surface-200 bg-white">
        {error && (
          <p className="text-xs text-danger-500 mb-2">{error}</p>
        )}
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your dataset..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-surface-200 px-4 py-2.5 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all duration-200"
          />
          <button
            id="btn-send-chat"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 bg-primary-500 hover:bg-primary-600 disabled:bg-surface-200 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-md shadow-primary-500/20 disabled:shadow-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
