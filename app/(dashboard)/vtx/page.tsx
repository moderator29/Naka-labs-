'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, TrendingUp, BarChart2, Search, Shield, Cpu, Zap, ChevronRight } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
}

const STARTER_PROMPTS = [
  { icon: TrendingUp, label: 'Market Analysis', prompt: 'What are the top bullish signals across all chains right now?' },
  { icon: BarChart2, label: 'Whale Activity', prompt: 'Show me the biggest whale movements in the last 4 hours' },
  { icon: Search, label: 'Token Scan', prompt: 'How do I scan a token for rug pull risk?' },
  { icon: Shield, label: 'Portfolio Risk', prompt: 'What are the main risks to watch in the current market?' },
  { icon: Cpu, label: 'Smart Money', prompt: 'Which smart money wallets are accumulating right now?' },
  { icon: Zap, label: 'Quick Alpha', prompt: 'Give me 3 under-the-radar alpha opportunities this week' },
];

function MsgBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#0066ff]/30 to-[#00ccff]/20 border border-[#0066ff]/30 flex items-center justify-center mt-1">
          <span className="text-[9px] font-black text-[#00aaff] tracking-widest">VTX</span>
        </div>
      )}
      <div className={`${isUser ? 'max-w-[70%]' : 'max-w-[82%]'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-[#0066ff] to-[#0044cc] text-white rounded-tr-sm shadow-lg shadow-[#0066ff]/20'
            : 'bg-[#0d0d1a]/80 border border-white/[0.06] text-[#e2e8f0] rounded-tl-sm'
        }`}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-[#00aaff] prose-strong:text-white prose-code:text-[#00ccff] prose-code:bg-[#0066ff]/10 prose-code:px-1 prose-code:rounded">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              {msg.streaming && msg.content && (
                <span className="inline-block w-2 h-4 bg-[#00aaff] ml-0.5 animate-pulse rounded-sm" />
              )}
            </div>
          )}
        </div>
        <div className={`text-[10px] mt-1 px-1 text-[#4a5568] ${isUser ? 'text-right' : 'text-left'}`}>
          {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#0066ff]/20 border border-[#0066ff]/30 flex items-center justify-center mt-1">
          <div className="w-3 h-3 rounded-full bg-[#0066ff]/60" />
        </div>
      )}
    </div>
  );
}

export default function VTXPage() {
  const { authenticated, login } = usePrivy();
  const [messages, setMessages] = useState<Message[]>([{
    id: '0', role: 'assistant',
    content: `## Welcome to VTX Intelligence\n\nI\'m VTX — your real-time Web3 intelligence layer. I can help you:\n\n- **Analyze** tokens, wallets, and market conditions across 11 chains\n- **Track** whale movements and smart money flows  \n- **Scan** contracts for honeypots, rugs, and hidden risks\n- **Identify** alpha opportunities before they trend\n\nWhat would you like to explore?`,
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = useCallback(async (content?: string) => {
    const text = (content ?? input).trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/vtx/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages.slice(-8) }),
      });

      if (!res.ok || !res.body) throw new Error('Stream error');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              acc += parsed.token;
              setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: acc } : m));
            }
          } catch { /* skip */ }
        }
      }
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: 'Intelligence module temporarily unavailable. Please try again.', streaming: false } : m));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages]);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,102,255,0.08) 0%, transparent 60%)' }}>
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0066ff]/30 to-[#00ccff]/10 border border-[#0066ff]/30 flex items-center justify-center mb-6 shadow-lg shadow-[#0066ff]/10">
          <span className="text-2xl font-black text-[#00aaff] tracking-widest">VTX</span>
        </div>
        <h1 className="text-3xl font-black text-white mb-3 tracking-tight">VTX Intelligence</h1>
        <p className="text-[#8892a4] max-w-sm mb-8 leading-relaxed">Real-time AI intelligence across 11 blockchains. Connect your wallet to get started.</p>
        <button onClick={login} className="bg-gradient-to-r from-[#0066ff] to-[#0044cc] text-white px-8 py-3.5 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#0066ff]/30">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,102,255,0.04) 0%, transparent 50%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-[#080812]/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0066ff]/30 to-[#00ccff]/10 border border-[#0066ff]/30 flex items-center justify-center">
            <span className="text-[11px] font-black text-[#00aaff] tracking-widest">VTX</span>
          </div>
          <div>
            <div className="font-bold text-white text-sm">VTX Intelligence</div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#00aaff]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00aaff] animate-pulse" />
              Online — All chains active
            </div>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-[#0066ff]/10 border border-[#0066ff]/20 text-[#0066ff] text-[10px] font-bold">LIVE</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {messages.map((msg) => <MsgBubble key={msg.id} msg={msg} />)}
        {loading && messages[messages.length - 1]?.content === '' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0066ff]/30 to-[#00ccff]/20 border border-[#0066ff]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-black text-[#00aaff]">VTX</span>
            </div>
            <div className="bg-[#0d0d1a]/80 border border-white/[0.06] rounded-2xl rounded-tl-sm px-5 py-4">
              <div className="flex gap-1.5 items-center">
                {[0, 120, 240].map(delay => (
                  <div key={delay} className="w-1.5 h-1.5 rounded-full bg-[#0066ff] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
                <span className="text-[11px] text-[#4a5568] ml-1">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-[#4a5568] mb-2 px-1">Quick actions</p>
          <div className="grid grid-cols-2 gap-2">
            {STARTER_PROMPTS.map(({ icon: Icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => sendMessage(prompt)}
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-[#0d0d1a]/80 border border-white/[0.06] hover:border-[#0066ff]/30 hover:bg-[#0066ff]/5 transition-all group text-left"
              >
                <Icon size={14} className="text-[#0066ff]/70 group-hover:text-[#00aaff] flex-shrink-0 transition-colors" />
                <div className="text-[11px] font-semibold text-[#8892a4] group-hover:text-white transition-colors">{label}</div>
                <ChevronRight size={11} className="text-[#4a5568] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-4 border-t border-white/[0.05] bg-[#080812]/60 backdrop-blur-sm">
        <div className="flex gap-3 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask VTX anything about crypto markets..."
            disabled={loading}
            className="flex-1 bg-[#0d0d1a]/80 border border-white/[0.08] rounded-2xl px-5 py-3.5 text-white text-sm placeholder-[#4a5568] focus:outline-none focus:border-[#0066ff]/50 transition-all disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0066ff] to-[#0044cc] flex items-center justify-center hover:opacity-90 disabled:opacity-30 transition-all shadow-lg shadow-[#0066ff]/20 active:scale-95 flex-shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
        <p className="text-[10px] text-[#2a3040] text-center mt-2">VTX provides market intelligence — not financial advice. Always DYOR.</p>
      </div>
    </div>
  );
}
