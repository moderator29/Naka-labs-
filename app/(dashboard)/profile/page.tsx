'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import {
  User, Wallet, Bell, Shield, ChevronRight, Copy, CheckCircle, BarChart2,
  BadgeCheck, Settings, LogOut, ExternalLink, FileText, Eye, Sliders,
  Headphones, HelpCircle
} from 'lucide-react';
import { formatAddress } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';
import Link from 'next/link';

type Section = 'profile' | 'verify' | 'alerts' | 'security';

const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Nigeria', 'South Africa', 'Kenya', 'UAE', 'Singapore', 'Japan', 'Other'];

export default function ProfilePage() {
  const { user, authenticated, login, logout, linkWallet, getAccessToken } = usePrivy();
  const [section, setSection] = useState<Section>('profile');
  const [copied, setCopied] = useState(false);
  const [alerts, setAlerts] = useState({ whale: true, price: true, security: true, newsletter: true });
  const [verifyForm, setVerifyForm] = useState({ fullName: '', country: '', idType: 'PASSPORT', telegram: '', twitter: '', reason: '' });
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');

  const wallet = user?.wallet?.address;
  const email = user?.email?.address ?? user?.google?.email ?? null;

  function copyAddress() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied!');
  }

  async function submitVerification() {
    if (!verifyForm.fullName || !verifyForm.country) {
      toast.error('Please fill all required fields');
      return;
    }
    setVerifyStatus('submitting');
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify(verifyForm),
      });
      const data = await res.json();
      if (data.success) {
        setVerifyStatus('submitted');
        toast.success('Verification submitted!');
      } else {
        toast.error(data.error ?? 'Submission failed');
        setVerifyStatus('idle');
      }
    } catch {
      toast.error('Failed to submit');
      setVerifyStatus('idle');
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-[#0d0d1a] border border-white/10 flex items-center justify-center mb-6">
          <User size={36} className="text-[#4a5568]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Sign In</h1>
        <p className="text-[#8892a4] mb-6">Connect your wallet to access your profile</p>
        <button onClick={login} className="bg-gradient-to-r from-[#0066ff] to-[#0044cc] text-white px-8 py-3.5 rounded-2xl font-bold hover:opacity-90 transition-all">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,102,255,0.06) 0%, transparent 50%)' }}>
      {/* Profile Hero */}
      <div className="px-5 pt-8 pb-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0066ff]/30 to-[#00ccff]/10 border-2 border-[#0066ff]/30 flex items-center justify-center mb-4 shadow-lg shadow-[#0066ff]/10">
            <User size={36} className="text-[#00aaff]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-0.5">
            {user?.email?.address?.split('@')[0] ?? formatAddress(wallet ?? '0x000') ?? 'Trader'}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0d0d1a] border border-white/[0.06] text-[#8892a4] text-xs mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4a5568]" />
            Free Tier
          </div>
          <button
            onClick={() => setSection('verify')}
            className="bg-gradient-to-r from-[#f6c90e] to-[#e5a00d] text-black px-6 py-2.5 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-yellow-500/20"
          >
            ✦ Upgrade to Pro
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: 'Predictions', value: '0' },
            { label: 'Win Rate', value: '0%' },
            { label: 'Points', value: '0' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0d0d1a]/80 border border-white/[0.06] rounded-2xl py-4 text-center">
              <div className="text-2xl font-black text-white mb-0.5">{value}</div>
              <div className="text-[11px] text-[#4a5568]">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="px-5 space-y-2.5 mb-6">
        {email && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-[#0d0d1a]/80 border border-white/[0.06] rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-[#0066ff]/10 flex items-center justify-center flex-shrink-0">
              <User size={15} className="text-[#0066ff]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-[#4a5568] mb-0.5">Email</div>
              <div className="text-sm text-white">{email}</div>
            </div>
            <CheckCircle size={16} className="text-[#00cc88]" />
          </div>
        )}

        {wallet && (
          <button onClick={copyAddress} className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#0d0d1a]/80 border border-white/[0.06] rounded-2xl hover:border-[#0066ff]/30 transition-all group">
            <div className="w-8 h-8 rounded-xl bg-[#0066ff]/10 flex items-center justify-center flex-shrink-0">
              <Wallet size={15} className="text-[#0066ff]" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[10px] text-[#4a5568] mb-0.5">Wallet</div>
              <div className="text-sm text-white font-mono">{formatAddress(wallet)}</div>
            </div>
            {copied ? <CheckCircle size={16} className="text-[#00cc88]" /> : <Copy size={15} className="text-[#4a5568] group-hover:text-white transition-colors" />}
          </button>
        )}

        <div className="flex items-center gap-3 px-4 py-3.5 bg-[#0d0d1a]/80 border border-white/[0.06] rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-[#0066ff]/10 flex items-center justify-center flex-shrink-0">
            <BadgeCheck size={15} className="text-[#0066ff]" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-[#4a5568] mb-0.5">Member Since</div>
            <div className="text-sm text-white">March 2026</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mb-6">
        <div className="text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest mb-3 px-1">Quick Actions</div>
        <div className="space-y-2">
          {[
            { icon: User, label: 'Portfolio', desc: 'View your holdings & P&L', href: '/portfolio' },
            { icon: Settings, label: 'Trading DNA', desc: 'AI analysis of your trading', href: '/dna-analyzer' },
            { icon: BarChart2, label: 'Analytics', desc: 'View your stats', href: '/dashboard' },
          ].map(({ icon: Icon, label, desc, href }) => (
            <Link key={label} href={href} className="flex items-center gap-3 px-4 py-3.5 bg-[#0d0d1a]/80 border border-white/[0.06] rounded-2xl hover:border-[#0066ff]/20 transition-all group">
              <div className="w-8 h-8 rounded-xl bg-[#0066ff]/10 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-[#0066ff]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-[11px] text-[#4a5568]">{desc}</div>
              </div>
              <ChevronRight size={15} className="text-[#4a5568] group-hover:text-[#0066ff] transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="px-5 mb-6">
        <div className="text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest mb-3 px-1">Settings</div>
        <div className="bg-[#0d0d1a]/80 border border-white/[0.06] rounded-2xl overflow-hidden">
          {(Object.keys(alerts) as (keyof typeof alerts)[]).map((key, i, arr) => (
            <div key={key} className={`flex items-center justify-between px-4 py-4 ${i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
              <div>
                <div className="text-sm text-white capitalize">{key === 'newsletter' ? 'Newsletter' : key === 'whale' ? 'Whale Alerts' : key === 'price' ? 'Price Alerts' : 'Security Alerts'}</div>
                <div className="text-[11px] text-[#4a5568]">{key === 'whale' ? 'Get notified on large transfers' : key === 'price' ? 'Price movement notifications' : key === 'security' ? 'Rug pull & scam warnings' : 'Weekly market digest'}</div>
              </div>
              <button
                onClick={() => setAlerts(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`w-12 h-6 rounded-full transition-all relative ${alerts[key] ? 'bg-[#0066ff]' : 'bg-[#1a2035]'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${alerts[key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* More Options */}
      <div className="px-5 mb-6">
        <div className="bg-[#0d0d1a]/80 border border-white/[0.06] rounded-2xl overflow-hidden">
          {[
            { icon: Shield, label: 'Security', desc: 'Protect your account' },
            { icon: Eye, label: 'Privacy', desc: 'Manage data & visibility' },
            { icon: Sliders, label: 'Preferences', desc: 'Customize your experience' },
          ].map(({ icon: Icon, label, desc }, i) => (
            <button key={label} className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-white/[0.02] transition-all ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-[#0066ff]/10 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-[#0066ff]" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm text-white">{label}</div>
                <div className="text-[11px] text-[#4a5568]">{desc}</div>
              </div>
              <ChevronRight size={15} className="text-[#4a5568]" />
            </button>
          ))}
        </div>
      </div>

      {/* Verification Section */}
      {section === 'verify' && (
        <div className="px-5 mb-6">
          <div className="bg-[#0d0d1a]/80 border border-[#0066ff]/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BadgeCheck size={18} className="text-[#0066ff]" />
              <h3 className="font-bold text-white">Get Verified</h3>
            </div>

            {verifyStatus === 'submitted' ? (
              <div className="text-center py-6">
                <CheckCircle size={40} className="text-[#00cc88] mx-auto mb-3" />
                <p className="font-semibold text-white mb-1">Submitted!</p>
                <p className="text-[#8892a4] text-sm">We&apos;ll review your request within 24-48 hours and verify your account.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#4a5568] mb-1 block">Full Legal Name *</label>
                  <input
                    value={verifyForm.fullName}
                    onChange={e => setVerifyForm(p => ({ ...p, fullName: e.target.value }))}
                    placeholder="As it appears on ID"
                    className="w-full bg-[#080812] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0066ff]/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#4a5568] mb-1 block">Country *</label>
                  <select
                    value={verifyForm.country}
                    onChange={e => setVerifyForm(p => ({ ...p, country: e.target.value }))}
                    className="w-full bg-[#080812] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0066ff]/50"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#4a5568] mb-1 block">ID Type *</label>
                  <select
                    value={verifyForm.idType}
                    onChange={e => setVerifyForm(p => ({ ...p, idType: e.target.value }))}
                    className="w-full bg-[#080812] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0066ff]/50"
                  >
                    <option value="PASSPORT">Passport</option>
                    <option value="NATIONAL_ID">National ID</option>
                    <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#4a5568] mb-1 block">Telegram (optional)</label>
                    <input
                      value={verifyForm.telegram}
                      onChange={e => setVerifyForm(p => ({ ...p, telegram: e.target.value }))}
                      placeholder="@username"
                      className="w-full bg-[#080812] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0066ff]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#4a5568] mb-1 block">Twitter (optional)</label>
                    <input
                      value={verifyForm.twitter}
                      onChange={e => setVerifyForm(p => ({ ...p, twitter: e.target.value }))}
                      placeholder="@handle"
                      className="w-full bg-[#080812] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0066ff]/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#4a5568] mb-1 block">Why do you want to be verified?</label>
                  <textarea
                    value={verifyForm.reason}
                    onChange={e => setVerifyForm(p => ({ ...p, reason: e.target.value }))}
                    placeholder="Brief description..."
                    rows={3}
                    className="w-full bg-[#080812] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#0066ff]/50 resize-none"
                  />
                </div>
                <button
                  onClick={submitVerification}
                  disabled={verifyStatus === 'submitting'}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0044cc] text-white font-bold hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {verifyStatus === 'submitting' ? 'Submitting...' : 'Submit for Verification'}
                </button>
                <p className="text-[11px] text-[#4a5568] text-center">Your information is encrypted and only used for identity verification.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Support */}
      <div className="px-5 mb-6">
        <div className="text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest mb-3 px-1">Support</div>
        <div className="bg-[#0d0d1a]/80 border border-white/[0.06] rounded-2xl overflow-hidden">
          {[
            { icon: Headphones, label: 'AI Customer Service', desc: 'Chat with our AI support', href: '/vtx' },
            { icon: HelpCircle, label: 'Help Center', desc: 'FAQs & support', href: '#' },
            { icon: FileText, label: 'Terms of Service', desc: 'Legal information', href: '#' },
            { icon: ExternalLink, label: 'View on Etherscan', desc: wallet ? `${formatAddress(wallet)}` : 'Connect wallet', href: wallet ? `https://etherscan.io/address/${wallet}` : '#' },
          ].map(({ icon: Icon, label, desc, href }, i) => (
            <Link key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} className={`flex items-center gap-3 px-4 py-4 hover:bg-white/[0.02] transition-all ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-[#0066ff]/10 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-[#0066ff]" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-white">{label}</div>
                <div className="text-[11px] text-[#4a5568]">{desc}</div>
              </div>
              <ChevronRight size={15} className="text-[#4a5568]" />
            </Link>
          ))}
        </div>
      </div>

      {/* Link additional wallet */}
      {!wallet && (
        <div className="px-5 mb-6">
          <button onClick={() => linkWallet()} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-[#0066ff]/30 text-[#0066ff] text-sm font-semibold hover:bg-[#0066ff]/5 transition-all">
            <Wallet size={16} />
            Link a wallet
          </button>
        </div>
      )}

      {/* Sign Out */}
      <div className="px-5 pb-6">
        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/5 transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

