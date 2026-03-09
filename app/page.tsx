'use client';

import { useActiveAccount, useConnectModal } from 'thirdweb/react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Zap, Shield, BarChart2, TrendingUp, Users, ArrowRight,
  CheckCircle, Star, Activity, Dna, Layers, Bell,
  ChevronRight, Globe, Lock, Eye, Cpu, Wallet,
} from 'lucide-react';
import { thirdwebClient, wallets } from '@/lib/thirdweb';

// ─── Data ─────────────────────────────────────────────────────
const FEATURES = [
  { icon: TrendingUp, title: 'Trading Terminal',    desc: 'Professional CEX-like speed with MEV protection. Trade any token across 11 chains with real-time candlestick charts, order book depth, and one-click execution.', color: '#00E5FF', tag: 'Live' },
  { icon: Dna,        title: 'Trading DNA Analyzer',desc: 'AI behavioral analysis of any wallet — profile type (Whale, Degen, Smart Money), win rate, hold time, top tokens, red flags, and 90-day P&L.', color: '#9945FF', tag: 'AI' },
  { icon: Zap,        title: 'VTX AI Assistant',    desc: 'Claude Opus 4.6-powered intelligence engine. Ask anything about market conditions, whale movements, token analysis, or trading strategies in real time.', color: '#A855F7', tag: 'AI' },
  { icon: Activity,   title: 'Context Feed',         desc: 'AI signal intelligence: whale movements, dev activity, rug warnings, liquidity events, and smart money tracking across all supported chains.', color: '#00C874', tag: 'Live' },
  { icon: Shield,     title: 'Security Scanner',     desc: 'Comprehensive token contract analysis — honeypot detection, tax analysis, liquidity lock verification, ownership renouncement, and holder risk scoring.', color: '#FF6B35', tag: 'Security' },
  { icon: Layers,     title: 'Bubble Map',           desc: 'Visualize token swap flow across DEXes and wallets in real time. Track liquidity, DEX routing, whale cluster behavior, and market maker activity.', color: '#FFD23F', tag: 'Visual' },
  { icon: BarChart2,  title: 'Portfolio Tracker',    desc: 'Multi-wallet, multi-chain portfolio tracking with real-time P&L, transaction history, cost basis calculation, and unrealized gains breakdown.', color: '#00E5FF', tag: 'Portfolio' },
  { icon: Bell,       title: 'Smart Alerts',         desc: 'Configurable alerts for price movements, whale transfers, new liquidity pools, rug warnings, and social sentiment spikes.', color: '#FF3A80', tag: 'Alerts' },
  { icon: Users,      title: 'Social Intelligence',  desc: 'Follow top traders, see their positions and moves in real time, copy-trade strategies, and leverage LunarCrush social sentiment data.', color: '#8C8DFC', tag: 'Social' },
];

const CHAINS = [
  { name: 'Solana',   color: '#9945FF' },
  { name: 'Ethereum', color: '#627EEA' },
  { name: 'Base',     color: '#0052FF' },
  { name: 'Arbitrum', color: '#12AAFF' },
  { name: 'Polygon',  color: '#8247E5' },
  { name: 'BSC',      color: '#F0B90B' },
  { name: 'Avalanche',color: '#E84142' },
  { name: 'Optimism', color: '#FF0420' },
  { name: 'Blast',    color: '#FCFC03' },
  { name: 'ZKsync',   color: '#8C8DFC' },
  { name: 'Scroll',   color: '#FFDBB0' },
];

const TIERS = [
  {
    name: 'FREE', price: '$0', naka: null,
    color: '#8B91A0',
    features: ['Basic market data', '5 watchlist tokens', 'Limited context signals', 'DNA analysis (5/day)', 'Community access'],
  },
  {
    name: 'BRONZE', price: '$4/mo', naka: '500K NAKA',
    color: '#CD7F32',
    features: ['All FREE features', '25 watchlist tokens', 'Full context feed', 'DNA analysis (50/day)', 'Price alerts (10)'],
  },
  {
    name: 'SILVER', price: '$7/mo', naka: '1M NAKA',
    color: '#C0C0C0',
    features: ['All BRONZE features', 'Unlimited watchlists', 'Whale alerts', 'API access (beta)', 'Priority signals'],
    popular: true,
  },
  {
    name: 'GOLD', price: '$13/mo', naka: '2M NAKA',
    color: '#FFD23F',
    features: ['All SILVER features', 'VTX AI Assistant', '0.4% trading fee', 'Admin analytics', 'Custom alert rules'],
  },
];

const STATS = [
  { label: 'Chains Supported', value: '11' },
  { label: 'Tokens Tracked',   value: '500K+' },
  { label: 'Signals per Day',  value: '1,200+' },
  { label: 'Trading Volume',   value: '$2.4M+' },
];

// ─── Animated orbit logo ───────────────────────────────────────
function OrbitLogo({ size = 40 }: { size?: number }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Outer ring */}
      <svg width={size} height={size} viewBox="0 0 40 40" className="animate-spin" style={{ animationDuration: '8s' }}>
        <ellipse cx="20" cy="20" rx="17" ry="8" fill="none" stroke="rgba(153,69,255,0.4)" strokeWidth="1" transform="rotate(-30 20 20)" />
        <circle cx="20" cy="12" r="2" fill="#9945FF" transform="rotate(-30 20 20)" />
      </svg>
      {/* Center eye */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full flex items-center justify-center font-black text-white"
          style={{
            width: size * 0.5,
            height: size * 0.5,
            background: 'radial-gradient(circle at 40% 40%, #7B3FE4, #4A1D8A)',
            boxShadow: '0 0 12px rgba(153,69,255,0.6)',
            fontSize: size * 0.18,
          }}
        >
          S
        </div>
      </div>
    </div>
  );
}

// ─── Floating particles background ────────────────────────────
function ParticleBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '#9945FF' : '#00E5FF',
    }));

    let raf: number;
    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ─── Live price ticker ─────────────────────────────────────────
const TICKER_ITEMS = [
  { sym: 'SOL',  price: '$84.06',   chg: '+0.88%', up: true  },
  { sym: 'BTC',  price: '$66,294',  chg: '-1.14%', up: false },
  { sym: 'ETH',  price: '$1,954',   chg: '-2.38%', up: false },
  { sym: 'HYPE', price: '$31.71',   chg: '+2.97%', up: true  },
  { sym: 'NEAR', price: '$1.35',    chg: '+20.5%', up: true  },
  { sym: 'WIF',  price: '$1.24',    chg: '-5.2%',  up: false },
  { sym: 'BONK', price: '$0.0000142',chg: '+3.1%', up: true  },
  { sym: 'BNB',  price: '$627.28',  chg: '+0.5%',  up: true  },
];

// ─── Main landing page ─────────────────────────────────────────
export default function LandingPage() {
  const account       = useActiveAccount();
  const { connect }   = useConnectModal();
  const [activeChain, setActiveChain] = useState(0);

  function login() { connect({ client: thirdwebClient, wallets, theme: 'dark' }); }

  useEffect(() => {
    const t = setInterval(() => setActiveChain(p => (p + 1) % CHAINS.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#08091A] text-white overflow-x-hidden relative">
      <ParticleBg />

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-white/6 backdrop-blur-xl bg-[#08091A]/85">
        <div className="max-w-7xl mx-auto px-5 h-[60px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <OrbitLogo size={36} />
            <span className="text-[20px] font-black tracking-tight text-white">STEINZ</span>
            <span className="text-[20px] font-black tracking-tight text-white/30">LABS</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-7 text-[13px] text-white/50">
            {['Features', 'Pricing', 'Chains', 'Docs'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {/* Theme pills (decorative, matching profile page) */}
            <div className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/8 rounded-full px-2 py-1">
              {[
                { label: '🌙 Dark',  active: true },
                { label: '☀️ Light', active: false },
                { label: '✨ Bingo', active: false, highlight: true },
              ].map(({ label, active, highlight }) => (
                <span
                  key={label}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-all ${
                    highlight ? 'bg-[#A855F7] text-white' : active ? 'bg-white/15 text-white' : 'text-white/35 hover:text-white/60'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>

            {account ? (
              <Link href="/dashboard" className="flex items-center gap-2 bg-[#9945FF] hover:bg-[#A855F7] text-white px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95">
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <button onClick={login} className="text-[13px] text-white/45 hover:text-white transition-colors hidden sm:block">Sign In</button>
                <button onClick={login} className="flex items-center gap-1.5 bg-[#9945FF] hover:bg-[#A855F7] text-white px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 shadow-lg shadow-purple-900/40">
                  <Wallet size={13} /> Connect Wallet
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Ticker bar ── */}
      <div className="border-b border-white/5 bg-[#060710]/70 backdrop-blur py-2 overflow-hidden relative z-10">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-2 mx-6 text-[12px]">
              <span className="font-bold text-white/70">{item.sym}</span>
              <span className="font-mono text-white/55">{item.price}</span>
              <span className={`font-semibold ${item.up ? 'text-[#00C874]' : 'text-[#FF4444]'}`}>{item.chg}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-28 px-5 text-center overflow-hidden z-10">
        {/* Glow blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px] opacity-20" style={{ background: 'radial-gradient(circle, #9945FF, transparent 70%)' }} />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px] opacity-10" style={{ background: '#00E5FF' }} />
          <div className="absolute top-1/4 left-1/4 w-[200px] h-[200px] rounded-full blur-[80px] opacity-8" style={{ background: '#A855F7' }} />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#9945FF]/15 border border-[#9945FF]/30 rounded-full px-4 py-1.5 mb-8 text-[12px] text-[#C084FC] font-semibold">
          <Zap size={11} fill="currentColor" /> Next-Generation Web3 Intelligence Platform
        </div>

        {/* Main headline */}
        <h1 className="text-[48px] sm:text-[64px] md:text-[80px] font-black leading-[1.05] mb-5">
          <span className="text-white">Trade Smarter.</span>
          <br />
          <span
            className="inline-block"
            style={{ background: 'linear-gradient(135deg, #9945FF 0%, #00E5FF 50%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            Analyze Deeper.
          </span>
        </h1>

        <p className="text-[16px] sm:text-[18px] text-white/45 max-w-xl mx-auto mb-10 leading-relaxed">
          CEX-like trading speed with DeFi freedom. AI-powered intelligence, whale tracking, token security, and wallet DNA — all on one platform across 11 chains.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <button
            onClick={login}
            className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-bold text-white transition-all active:scale-[0.98] shadow-xl shadow-purple-900/40 hover:shadow-purple-800/50"
            style={{ background: 'linear-gradient(135deg, #9945FF, #6D28D9)' }}
          >
            <Wallet size={16} />
            Connect Wallet — It&apos;s Free
            <ArrowRight size={16} />
          </button>
          <Link
            href="/market"
            className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-[15px] font-semibold text-white/80 bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/8 transition-all"
          >
            <TrendingUp size={16} />
            Live Trading Terminal
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-[12px] text-white/30">
          {[
            { icon: CheckCircle, label: 'No KYC Required' },
            { icon: Lock,        label: 'Non-Custodial' },
            { icon: Globe,       label: '11 Blockchains' },
            { icon: Shield,      label: 'MEV Protected' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon size={12} className="text-[#00C874]" /> {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Live stats bar ── */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-5 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-[28px] sm:text-[36px] font-black text-white mb-1">{value}</div>
              <div className="text-[12px] text-white/35 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Chain showcase ── */}
      <section id="chains" className="relative z-10 py-16 px-5">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-[11px] uppercase tracking-[3px] text-white/25 mb-6 font-semibold">Supported Blockchains</div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {CHAINS.map((chain, i) => (
              <button
                key={chain.name}
                onClick={() => setActiveChain(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all border ${
                  activeChain === i
                    ? 'border-opacity-60 text-white scale-105'
                    : 'border-white/8 text-white/40 hover:text-white/70 hover:border-white/15'
                }`}
                style={{
                  borderColor: activeChain === i ? `${chain.color}60` : undefined,
                  background:  activeChain === i ? `${chain.color}12` : undefined,
                  color:       activeChain === i ? chain.color : undefined,
                }}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: chain.color }} />
                {chain.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section id="features" className="relative z-10 py-20 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[36px] sm:text-[48px] font-black text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-[15px] text-white/40 max-w-xl mx-auto">
              From a professional trading terminal to deep-dive AI intelligence — Steinz Labs is your complete Web3 command center.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, tag }) => (
              <div
                key={title}
                className="group relative bg-white/[0.03] border border-white/6 rounded-2xl p-6 hover:border-opacity-40 hover:bg-white/[0.05] transition-all duration-300 overflow-hidden cursor-pointer"
                style={{ '--hover-color': color } as React.CSSProperties}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
                  style={{ background: `radial-gradient(circle at 20% 20%, ${color}08, transparent 60%)` }}
                />
                {/* Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}40`, background: `${color}10` }}>
                    {tag}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-white mb-2 group-hover:text-white transition-colors">{title}</h3>
                <p className="text-[12px] text-white/38 leading-relaxed">{desc}</p>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>
                  Explore <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 py-20 px-5 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[36px] sm:text-[48px] font-black text-white mb-4">Simple to Start</h2>
            <p className="text-[15px] text-white/40">From zero to trading in under 60 seconds.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', icon: Wallet,    title: 'Connect Wallet',   desc: 'Link your existing wallet via MetaMask, WalletConnect, Coinbase, or use social login (Google, X, email) with embedded wallet.' },
              { n: '02', icon: Eye,       title: 'Explore Markets',  desc: 'Search any token by ticker or contract address. View live charts, whale signals, and security scores across 11 chains.' },
              { n: '03', icon: TrendingUp,title: 'Trade & Analyze',  desc: 'Execute trades with CEX-like speed and MEV protection. Use Trading DNA, VTX AI, and alerts to stay ahead of the market.' },
            ].map(({ n, icon: Icon, title, desc }) => (
              <div key={n} className="relative">
                <div className="text-[52px] font-black text-white/5 leading-none mb-3">{n}</div>
                <div className="w-10 h-10 rounded-xl bg-[#9945FF]/15 border border-[#9945FF]/30 flex items-center justify-center mb-4">
                  <Icon size={18} className="text-[#9945FF]" />
                </div>
                <h3 className="text-[16px] font-bold text-white mb-2">{title}</h3>
                <p className="text-[13px] text-white/38 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[36px] sm:text-[48px] font-black text-white mb-4">NAKA-Powered Tiers</h2>
            <p className="text-[15px] text-white/40 max-w-xl mx-auto">Hold NAKA tokens to unlock premium features. No monthly subscriptions — just hold and access.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIERS.map(({ name, price, naka, color, features, popular }) => (
              <div
                key={name}
                className={`relative rounded-2xl p-6 border transition-all ${
                  popular
                    ? 'border-[#C0C0C0]/40 bg-[#C0C0C0]/5 scale-[1.02]'
                    : 'border-white/8 bg-white/[0.025] hover:border-white/18'
                }`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C0C0C0] text-black text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="mb-5">
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color }}>{name}</div>
                  <div className="text-[28px] font-black text-white leading-tight">{price}</div>
                  {naka && <div className="text-[11px] text-white/30 mt-1 font-medium">Hold {naka}</div>}
                </div>
                <ul className="space-y-2.5 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-white/50">
                      <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={login}
                  className="w-full py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-[0.98] border"
                  style={{ color, borderColor: `${color}40`, background: `${color}10` }}
                >
                  {name === 'FREE' ? 'Start Free' : `Get ${name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Profile / Settings preview (from Steinz images) ── */}
      <section className="relative z-10 py-20 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[11px] uppercase tracking-[3px] text-[#9945FF] font-bold mb-4">Full Command Center</div>
              <h2 className="text-[36px] sm:text-[44px] font-black text-white mb-5 leading-tight">
                Your Trading DNA.<br />
                <span style={{ color: '#9945FF' }}>Your Intelligence Hub.</span>
              </h2>
              <p className="text-[14px] text-white/40 mb-6 leading-relaxed">
                Manage alerts, explore analytics, configure privacy settings, and access your personalized Trading DNA analysis — all from one unified profile.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Dna,      label: 'Trading DNA',     desc: 'AI analysis of your trading patterns & behavior', color: '#9945FF' },
                  { icon: BarChart2, label: 'Analytics',      desc: 'Deep dive into your performance stats', color: '#00E5FF' },
                  { icon: Bell,     label: 'Smart Alerts',    desc: 'Whale alerts, price movements, rug warnings', color: '#00C874' },
                  { icon: Cpu,      label: 'VTX AI Engine',   desc: 'Claude Opus 4.6-powered market intelligence', color: '#A855F7' },
                ].map(({ icon: Icon, label, desc, color }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-white">{label}</div>
                      <div className="text-[11px] text-white/35">{desc}</div>
                    </div>
                    <ChevronRight size={14} className="text-white/20 ml-auto flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Mock profile card */}
            <div className="relative">
              <div className="rounded-3xl bg-[#0C0E1F] border border-white/8 overflow-hidden shadow-2xl shadow-purple-950/50">
                {/* Profile header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/6" style={{ background: 'linear-gradient(135deg, rgba(153,69,255,0.15), rgba(10,14,26,0.8))' }}>
                  <div className="flex items-center gap-2.5">
                    <OrbitLogo size={32} />
                    <span className="font-black text-white text-[16px] tracking-tight">STEINZ</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white/8 rounded-full px-2 py-1">
                    <span className="text-[10px] font-semibold text-white/60 px-1.5">🌙 Dark</span>
                    <span className="text-[10px] font-semibold text-white/40 px-1.5">☀️ Light</span>
                    <span className="text-[10px] font-bold bg-[#A855F7] text-white rounded-full px-2 py-0.5">✨ Bingo</span>
                  </div>
                </div>

                {/* Menu items */}
                {[
                  { icon: Dna,      label: 'Trading DNA',  sub: 'AI analysis of your trading',  color: '#9945FF', hasArrow: true },
                  { icon: BarChart2, label: 'Analytics',   sub: 'View your stats',               color: '#00E5FF', hasArrow: true },
                ].map(({ icon: Icon, label, sub, color, hasArrow }) => (
                  <div key={label} className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-white">{label}</div>
                      <div className="text-[11px] text-white/35">{sub}</div>
                    </div>
                    {hasArrow && <ChevronRight size={14} className="text-white/20" />}
                  </div>
                ))}

                {/* Settings section */}
                <div className="px-5 py-2 text-[9px] uppercase tracking-[2px] text-white/20 font-bold mt-1">Settings</div>
                {[
                  { label: 'Whale Alerts',    sub: 'Get notified on large transfers' },
                  { label: 'Price Alerts',    sub: 'Price movement notifications'    },
                  { label: 'Security Alerts', sub: 'Rug pull & scam warnings'        },
                  { label: 'Newsletter',      sub: 'Weekly market digest'            },
                ].map(({ label, sub }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3 border-b border-white/4">
                    <div>
                      <div className="text-[12px] font-semibold text-white">{label}</div>
                      <div className="text-[10px] text-white/30">{sub}</div>
                    </div>
                    {/* Toggle */}
                    <div className="w-10 h-5 bg-[#00E5FF] rounded-full relative cursor-pointer flex-shrink-0">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </div>
                ))}

                {/* Bottom nav mock */}
                <div className="flex items-center justify-around px-3 py-3 border-t border-white/6 bg-[#090B1A]">
                  {[
                    { label: 'Home',     icon: '⌂' },
                    { label: 'Social',   icon: '👥' },
                    { label: 'VTX AI',   icon: '🤖' },
                    { label: 'Discover', icon: '🔭' },
                    { label: 'Wallet',   icon: '💳' },
                    { label: 'Profile',  icon: '👤', active: true },
                  ].map(({ label, icon, active }) => (
                    <div key={label} className={`flex flex-col items-center gap-0.5 ${active ? 'text-[#9945FF]' : 'text-white/25'}`}>
                      <span className="text-[14px]">{icon}</span>
                      <span className="text-[8px] font-semibold">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Glow behind card */}
              <div className="absolute -inset-4 -z-10 rounded-3xl blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #9945FF, transparent 60%)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 py-28 px-5">
        <div className="max-w-3xl mx-auto text-center">
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] blur-[100px] opacity-20 rounded-full" style={{ background: '#9945FF' }} />
          </div>

          <div className="inline-flex items-center gap-2 bg-[#9945FF]/15 border border-[#9945FF]/25 rounded-full px-4 py-1.5 mb-8 text-[12px] text-[#C084FC] font-semibold">
            <Star size={11} fill="currentColor" /> Join thousands of traders
          </div>

          <h2 className="text-[40px] sm:text-[56px] font-black text-white mb-5 leading-tight">
            Start Trading Smarter<br />
            <span style={{ color: '#9945FF' }}>Today.</span>
          </h2>
          <p className="text-[15px] text-white/40 mb-10">
            Connect your wallet and access professional-grade Web3 intelligence. Free forever.
          </p>
          <button
            onClick={login}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-[16px] font-bold text-white transition-all active:scale-[0.98] shadow-2xl shadow-purple-900/50"
            style={{ background: 'linear-gradient(135deg, #9945FF, #6D28D9)' }}
          >
            <Wallet size={18} /> Launch App <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/6 py-10 px-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <OrbitLogo size={28} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-[14px]">STEINZ</span>
                <span className="font-black text-white/30 text-[14px]">LABS</span>
              </div>
              <div className="text-[11px] text-white/25">© 2025 Steinz Labs. All rights reserved.</div>
            </div>
          </div>

          <div className="text-[11px] text-white/25 font-medium tracking-widest uppercase">steinzlabs.com</div>

          <div className="flex gap-6 text-[12px] text-white/30">
            {['Terms', 'Privacy', 'Docs', 'X / Twitter'].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
