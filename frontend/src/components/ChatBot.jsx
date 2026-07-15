import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, AlertCircle } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "How do I navigate to my seat?",
  "Where is the nearest first aid?",
  "Tell me about the USA roster",
  "Are there any open taco shops?",
  "How can I get green points?"
];

export default function ChatBot({ isOpen, onClose, userContext }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      text: "Hi! I'm your FIFA World Cup Generative AI Assistant. I can help you find stadium gates, player rosters, concession menus, or accessibility resources. How can I help you today?",
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (text) => {
    if (!text.trim()) return;
    setError('');
    const userMsg = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          ticket_context: userContext
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to generate response.');
      }

      const data = await response.json();
      const botMsg = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        sender: 'bot',
        sources: data.sources || []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-full max-w-md h-[550px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden text-white animate-scaleUp">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          <div>
            <h3 className="font-extrabold text-sm tracking-tight text-white">FIFA GenAI Co-Pilot</h3>
            <p className="text-[10px] text-blue-200 font-mono">100% Cloud-Grounded RAG</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md text-white/80 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages list */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3 flex flex-col bg-slate-950/80">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
              m.sender === 'user'
                ? 'bg-blue-600 text-white rounded-br-none align-self-end self-end ml-auto'
                : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none'
            }`}
          >
            <p className="whitespace-pre-line font-sans">{m.text}</p>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-2 pt-1 border-t border-slate-700 flex flex-wrap gap-1">
                <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider block w-full">Grounded Sources:</span>
                {m.sources.map((s, idx) => (
                  <span key={idx} className="text-[9px] bg-slate-900 text-blue-400 border border-blue-900/50 rounded px-1.5 py-0.5">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="bg-slate-800 border border-slate-700 text-slate-100 rounded-2xl rounded-bl-none p-3 max-w-[80%] flex items-center gap-2 text-xs">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-100"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce delay-200"></span>
            </div>
            <span className="text-zinc-400 font-mono text-[10px]">Cloud AI generating answer...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-500/30 text-red-300 rounded-lg p-3 text-xs flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length === 1 && (
        <div className="p-3 bg-slate-900/50 border-t border-slate-800 flex gap-2 overflow-x-auto shrink-0 select-none">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 shrink-0 whitespace-nowrap transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input panel */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          placeholder="Ask about gates, players, menus..."
          className="flex-grow bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 text-white placeholder-slate-500"
        />
        <button
          onClick={() => handleSend(input)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
