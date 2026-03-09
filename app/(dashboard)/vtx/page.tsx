'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Zap, Lock } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  'Analyze the current ETH market conditions',
  'What are the most bullish signals right now?',
  'Scan this token for risks: 0x...',
  'Which wallets are accumulating SOL?',
  'Show me the top-performing traders today',
];

export default function VTXPage() {
  const { authenticated } = usePrivy();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hello! I\'m VTX, your Web3 intelligence assistant. I can analyze tokens, track whales, scan contracts, and give you real-time market intelligence across 11 chains. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(content?: string) {
    const text = content ?? input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/vtx/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.slice(-10) }),
      });

      const data = await res.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response ?? 'I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Connection error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neon-blue/20 border border-neon-blue/40 flex items-center justify-center mb-6">
          <Bot size={32} className="text-neon-blue" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">VTX AI Assistant</h1>
        <p className="text-text-secondary max-w-md mb-6">Connect your wallet to access the VTX intelligence assistant powered by real-time blockchain data.</p>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <Lock size={12} />
          Available on GOLD tier and above
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-primary">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-default bg-bg-secondary flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-neon-blue/20 border border-neon-blue/40 flex items-center justify-center">
          <Bot size={18} className="text-neon-blue" />
        </div>
        <div>
          <div className="font-bold text-white">VTX Intelligence</div>
          <div className="text-xs text-electric-blue flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse" />
            Online — Analyzing blockchain data
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center flex-shrink-0">
                <Bot size={14} className="text-neon-blue" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-neon-blue text-white rounded-tr-sm'
                  : 'bg-bg-secondary border border-border-default text-text-primary rounded-tl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-text-tertiary'}`}>
                {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-neon-blue" />
            </div>
            <div className="bg-bg-secondary border border-border-default rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-neon-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-neon-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-neon-blue animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starter Prompts */}
      {messages.length === 1 && (
        <div className="px-6 pb-4">
          <div className="text-xs text-text-tertiary mb-2 flex items-center gap-1">
            <Zap size={10} />
            Quick prompts
          </div>
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs bg-bg-secondary border border-border-default text-text-secondary hover:text-white hover:border-neon-blue rounded-lg px-3 py-1.5 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-border-default bg-bg-secondary">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask VTX anything about the market..."
            className="flex-1 bg-bg-tertiary border border-border-default rounded-xl px-4 py-3 text-white text-sm placeholder-text-tertiary focus:outline-none focus:border-neon-blue transition-colors"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="bg-neon-blue text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-blue-600 disabled:opacity-40 transition-all active:scale-95"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
