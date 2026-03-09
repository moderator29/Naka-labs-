'use client';

import { useActiveAccount, useConnectModal } from 'thirdweb/react';
import Link from 'next/link';
import {
  Zap, Shield, BarChart2, Dna, TrendingUp, Users,
  ArrowRight, CheckCircle, Star
} from 'lucide-react';
import { thirdwebClient, wallets } from '@/lib/thirdweb';

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Professional Trading',
    description: 'CheckPrice-style 70/30 layout with lightweight-charts candlesticks, one-click execution, and real-time P&L tracking.',
    color: '#00E5FF',
  },
  {
    icon: Zap,
    title: 'Context Feed',
    description: 'AI-powered signal intelligence: whale movements, dev activity, rug warnings, and smart money tracking across 11 chains.',
    color: '#0A1EFF',
  },
  {
    icon: Dna,
    title: 'Wallet DNA Analyzer',
    description: 'Deep behavioral analysis of any wallet: profile type, win rate, top tokens, red flags, and trading patterns.',
    color: '#8C8DFC',
  },
  {
    icon: Shield,
    title: 'Token Security Scanner',
    description: 'Comprehensive smart contract analysis: honeypot detection, tax analysis, liquidity locks, and holder distribution.',
    color: '#FF6B35',
  },
  {
    icon: BarChart2,
    title: 'Portfolio Tracking',
    description: 'Multi-wallet, multi-chain portfolio with real-time P&L, transaction history, and Exodus-style visualization.',
    color: '#FFD23F',
  },
  {
    icon: Users,
    title: 'Social Intelligence',
    description: 'Follow top traders, see their moves in real-time, and leverage LunarCrush social sentiment data.',
    color: '#00E5FF',
  },
];

const CHAINS = ['Ethereum', 'Solana', 'Base', 'Arbitrum', 'Polygon', 'BSC', 'Avalanche', 'Optimism', 'Blast', 'ZKsync', 'Scroll'];

const TIERS = [
  { name: 'FREE', price: '$0', color: '#8B91A0', features: ['Basic market data', '5 watchlist tokens', 'Limited signals', 'DNA analysis (5/day)'] },
  { name: 'BRONZE', price: '$4/mo', naka: '500K NAKA', color: '#CD7F32', features: ['All FREE features', '25 watchlist tokens', 'Full context feed', 'DNA analysis (50/day)', 'Price alerts (10)'] },
  { name: 'SILVER', price: '$7/mo', naka: '1M NAKA', color: '#C0C0C0', features: ['All BRONZE features', 'Unlimited watchlists', 'Whale alerts', 'API access', 'Priority signals'] },
  { name: 'GOLD', price: '$13/mo', naka: '2M NAKA', color: '#FFD23F', features: ['All SILVER features', 'VTX AI Assistant', '0.4% trading fee', 'Admin analytics', 'Custom alerts'] },
];

export default function LandingPage() {
  const account = useActiveAccount();
  const { connect } = useConnectModal();
  const authenticated = !!account;

  function login() {
    connect({ client: thirdwebClient, wallets, theme: 'dark' });
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navbar */}
      <nav className="border-b border-border-default sticky top-0 z-50 backdrop-blur-sm bg-bg-primary/95">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neon-blue flex items-center justify-center text-white font-bold text-sm">
              SL
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Steinz Labs</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#chains" className="hover:text-white transition-colors">Chains</a>
          </div>

          <div className="flex items-center gap-3">
            {authenticated ? (
              <Link
                href="/dashboard"
                className="bg-neon-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <button onClick={login} className="text-text-secondary hover:text-white text-sm transition-colors">
                  Sign In
                </button>
                <button
                  onClick={login}
                  className="bg-neon-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 active:scale-95 transition-all"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-neon-blue/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-electric-blue/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-neon-blue/10 border border-neon-blue/30 rounded-full px-4 py-1.5 mb-8 text-sm text-neon-blue">
            <Zap size={12} />
            Next-Generation Web3 Intelligence
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Trade Smarter.
            <br />
            <span className="gradient-text">Analyze Deeper.</span>
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Professional trading infrastructure meets AI-powered intelligence.
            Track whales, scan tokens, analyze wallets — all in one platform across 11 chains.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={login}
              className="bg-neon-blue text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-neon-blue/30"
            >
              Connect Wallet — It&apos;s Free
              <ArrowRight size={20} />
            </button>
            <Link
              href="/market"
              className="border border-border-default text-white px-8 py-4 rounded-xl text-lg font-semibold hover:border-neon-blue hover:shadow-[0_0_20px_rgba(10,30,255,0.2)] transition-all flex items-center justify-center gap-2"
            >
              <TrendingUp size={20} />
              Live Market
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-text-tertiary">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-electric-blue" />
              No KYC
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-electric-blue" />
              11 Chains
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-electric-blue" />
              Non-custodial
            </div>
          </div>
        </div>
      </section>

      {/* Chain Ticker */}
      <section id="chains" className="border-y border-border-default py-4 overflow-hidden bg-bg-secondary">
        <div className="flex animate-ticker whitespace-nowrap">
          {[...CHAINS, ...CHAINS].map((chain, i) => (
            <span key={i} className="mx-8 text-sm text-text-secondary font-medium">
              {chain}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Everything You Need</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              From professional trading tools to deep-dive intelligence — Steinz Labs is your complete Web3 command center.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="bg-bg-secondary border border-border-default rounded-2xl p-6 hover:border-neon-blue hover:shadow-[0_0_30px_rgba(10,30,255,0.2)] transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
                >
                  <Icon size={24} style={{ color }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-bg-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Simple, NAKA-Powered Pricing</h2>
            <p className="text-text-secondary">Hold NAKA tokens to unlock premium features. No subscriptions required.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIERS.map(({ name, price, naka, color, features }) => (
              <div
                key={name}
                className={`bg-bg-primary border rounded-2xl p-6 transition-all ${
                  name === 'GOLD' ? 'border-bingo-yellow shadow-[0_0_30px_rgba(255,210,63,0.2)] scale-105' : 'border-border-default hover:border-neon-blue'
                }`}
              >
                {name === 'GOLD' && (
                  <div className="flex items-center gap-1 mb-3">
                    <Star size={12} className="text-bingo-yellow fill-bingo-yellow" />
                    <span className="text-xs text-bingo-yellow font-semibold">BEST VALUE</span>
                  </div>
                )}
                <div className="mb-4">
                  <div className="text-sm font-semibold mb-1" style={{ color }}>{name}</div>
                  <div className="text-2xl font-black text-white">{price}</div>
                  {naka && <div className="text-xs text-text-tertiary mt-1">Hold {naka}</div>}
                </div>
                <ul className="space-y-2 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={login}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: name === 'FREE' ? 'transparent' : `${color}20`,
                    border: `1px solid ${color}50`,
                    color,
                  }}
                >
                  {name === 'FREE' ? 'Start Free' : `Get ${name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black text-white mb-6">Start Trading Smarter Today</h2>
          <p className="text-text-secondary mb-10 text-lg">
            Connect your wallet and access professional-grade Web3 intelligence. Free forever.
          </p>
          <button
            onClick={login}
            className="bg-neon-blue text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-neon-blue/30 inline-flex items-center gap-3"
          >
            Launch App <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-default py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-neon-blue flex items-center justify-center text-white font-bold text-xs">SL</div>
            <span className="text-text-secondary text-sm">© 2025 Steinz Labs. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-text-tertiary">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
