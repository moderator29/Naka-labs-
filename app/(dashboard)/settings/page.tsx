'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Settings, Wallet, Bell, Shield, User, Copy, CheckCircle } from 'lucide-react';
import { formatAddress } from '@/lib/utils/formatters';
import { TIER_REQUIREMENTS } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, authenticated, login, logout, linkWallet } = usePrivy();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallets' | 'notifications' | 'security'>('profile');

  const walletAddress = user?.wallet?.address;

  function copyAddress() {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied!');
  }

  const TIERS = [
    { name: 'FREE', naka: 0, price: '$0/mo', color: '#8B91A0' },
    { name: 'BRONZE', naka: TIER_REQUIREMENTS.BRONZE, price: '$4/mo', color: '#CD7F32' },
    { name: 'SILVER', naka: TIER_REQUIREMENTS.SILVER, price: '$7/mo', color: '#C0C0C0' },
    { name: 'GOLD', naka: TIER_REQUIREMENTS.GOLD, price: '$13/mo', color: '#FFD23F' },
  ];

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ] as const;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <Settings size={48} className="text-text-tertiary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
          <button onClick={login} className="bg-neon-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
          <Settings size={24} className="text-neon-blue" />
          Settings
        </h1>

        <div className="flex gap-6">
          {/* Tab Sidebar */}
          <div className="w-44 flex-shrink-0 space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === id
                    ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                    : 'text-text-secondary hover:text-white hover:bg-bg-secondary'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 space-y-4">
            {activeTab === 'profile' && (
              <>
                <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
                  <h2 className="font-bold text-white mb-4">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-text-secondary mb-1 block">Display Name</label>
                      <input
                        type="text"
                        defaultValue={user?.email?.address?.split('@')[0] ?? 'Anonymous'}
                        className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-neon-blue"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary mb-1 block">Email</label>
                      <input
                        type="email"
                        defaultValue={user?.email?.address ?? ''}
                        className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-neon-blue"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary mb-1 block">Twitter Handle</label>
                      <input
                        type="text"
                        placeholder="@handle"
                        className="w-full bg-bg-tertiary border border-border-default rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-neon-blue"
                      />
                    </div>
                    <button className="bg-neon-blue text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all">
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Tier Status */}
                <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
                  <h2 className="font-bold text-white mb-4">Membership Tier</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {TIERS.map(({ name, naka, price, color }) => (
                      <div
                        key={name}
                        className="bg-bg-tertiary rounded-xl p-4 border"
                        style={{ borderColor: `${color}30` }}
                      >
                        <div className="font-bold text-sm mb-0.5" style={{ color }}>{name}</div>
                        <div className="text-xs text-text-tertiary mb-1">{price}</div>
                        {naka > 0 && (
                          <div className="text-xs text-text-tertiary">Hold {(naka / 1e6).toFixed(1)}M NAKA</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-xs text-text-tertiary">
                    Current tier: <span className="text-white font-semibold">FREE</span> · Hold NAKA tokens to upgrade automatically
                  </div>
                </div>
              </>
            )}

            {activeTab === 'wallets' && (
              <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
                <h2 className="font-bold text-white mb-4">Connected Wallets</h2>

                {walletAddress && (
                  <div className="bg-bg-tertiary rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-text-tertiary mb-1">Primary Wallet</div>
                        <div className="font-mono text-sm text-white">{formatAddress(walletAddress, 10)}</div>
                      </div>
                      <button onClick={copyAddress} className="text-text-tertiary hover:text-white transition-colors">
                        {copied ? <CheckCircle size={16} className="text-electric-blue" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => linkWallet()}
                  className="w-full py-3 border border-border-default rounded-xl text-sm text-text-secondary hover:text-white hover:border-neon-blue transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet size={16} />
                  Link Another Wallet
                </button>

                <div className="mt-6 pt-4 border-t border-border-default">
                  <button
                    onClick={() => logout()}
                    className="text-bingo-orange hover:text-orange-400 text-sm transition-colors"
                  >
                    Disconnect All Wallets
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
                <h2 className="font-bold text-white mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Whale movements', desc: 'Large wallet transfers over $1M' },
                    { label: 'Price alerts', desc: 'When tokens hit your target prices' },
                    { label: 'New signals', desc: 'Fresh intelligence from the Context Feed' },
                    { label: 'Rug warnings', desc: 'Critical contract risk alerts' },
                    { label: 'Trade confirmations', desc: 'When your trades are executed' },
                  ].map(({ label, desc }) => (
                    <label key={label} className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white">{label}</div>
                        <div className="text-xs text-text-tertiary">{desc}</div>
                      </div>
                      <input type="checkbox" defaultChecked className="accent-neon-blue w-4 h-4" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
                <h2 className="font-bold text-white mb-4">Security Settings</h2>
                <div className="space-y-4">
                  <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield size={18} className="text-electric-blue flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-white text-sm">Non-custodial Security</div>
                        <div className="text-xs text-text-secondary mt-1">
                          Steinz Labs never holds your private keys. All transactions are signed in your wallet and executed on-chain.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white">MEV Protection</div>
                        <div className="text-xs text-text-tertiary">Simulate trades before execution</div>
                      </div>
                      <input type="checkbox" defaultChecked className="accent-neon-blue w-4 h-4" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white">Transaction Confirmation</div>
                        <div className="text-xs text-text-tertiary">Show confirmation modal before trades</div>
                      </div>
                      <input type="checkbox" className="accent-neon-blue w-4 h-4" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
