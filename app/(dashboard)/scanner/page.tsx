'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Shield, Search, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { formatUSD, formatAddress, formatPercent } from '@/lib/utils/formatters';
import { RISK_COLORS } from '@/lib/constants';

interface ScanResult {
  contractAddress: string;
  chain: string;
  symbol: string;
  name: string;
  logo?: string;
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isHoneypot: boolean;
  ownershipRenounced: boolean;
  liquidityLocked: boolean;
  isProxy: boolean;
  hasMintFunction: boolean;
  hasBlacklist: boolean;
  tradingEnabled: boolean;
  buyTax: number;
  sellTax: number;
  totalLiquidity: number;
  holderCount: number;
  top10Concentration: number;
  compiler?: string;
  verified: boolean;
  marketCap: number;
  price: number;
  flags: { severity: string; message: string }[];
}

type CheckItem = { label: string; value: boolean | string | number; good?: boolean; warning?: boolean };

function ScannerPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [address, setAddress] = useState(searchParams.get('address') ?? '');
  const [chain, setChain] = useState('ETHEREUM');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-scan if address provided in URL
  useEffect(() => {
    const addr = searchParams.get('address');
    if (addr) {
      setAddress(addr);
      handleScan(addr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleScan(scanAddress?: string) {
    const addr = (scanAddress ?? address).trim();
    if (!addr) {
      toast.error('Enter a contract address');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Scanning contract...');

    try {
      const res = await fetch('/api/scanner/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, chain }),
      });

      const data = await res.json();

      if (data.error) {
        if (data.isWallet) {
          toast.error('This is a wallet, not a contract! Redirecting to DNA Analyzer...', { id: toastId });
          setTimeout(() => router.push(`/dna-analyzer?address=${addr}`), 2000);
          return;
        }
        toast.error(data.error, { id: toastId });
        return;
      }

      setResult(data.scan);
      toast.success('Scan complete!', { id: toastId });
    } catch {
      toast.error('Scan failed. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  const riskColor = result ? RISK_COLORS[result.riskLevel] : '#8B91A0';

  const SECURITY_CHECKS: CheckItem[] = result ? [
    { label: 'Honeypot', value: result.isHoneypot ? 'DETECTED' : 'Safe', good: !result.isHoneypot },
    { label: 'Ownership Renounced', value: result.ownershipRenounced ? 'Yes' : 'No', good: result.ownershipRenounced },
    { label: 'Liquidity Locked', value: result.liquidityLocked ? 'Yes' : 'No', good: result.liquidityLocked },
    { label: 'Trading Enabled', value: result.tradingEnabled ? 'Yes' : 'No', good: result.tradingEnabled },
    { label: 'Proxy Contract', value: result.isProxy ? 'Yes' : 'No', warning: result.isProxy },
    { label: 'Mint Function', value: result.hasMintFunction ? 'Present' : 'None', good: !result.hasMintFunction },
    { label: 'Blacklist', value: result.hasBlacklist ? 'Present' : 'None', warning: result.hasBlacklist },
    { label: 'Contract Verified', value: result.verified ? 'Yes' : 'No', good: result.verified },
  ] : [];

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
            <Shield size={32} className="text-bingo-orange" />
            Token Security Scanner
          </h1>
          <p className="text-text-secondary">
            Comprehensive smart contract security analysis. Contracts only — wallets redirect to DNA Analyzer.
          </p>
        </div>

        {/* Input */}
        <div className="bg-bg-secondary border border-border-default rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="bg-bg-tertiary border border-border-default rounded-lg px-3 py-3 text-white text-sm focus:outline-none focus:border-neon-blue sm:w-36 flex-shrink-0"
            >
              <option value="ETHEREUM">Ethereum</option>
              <option value="BASE">Base</option>
              <option value="ARBITRUM">Arbitrum</option>
              <option value="POLYGON">Polygon</option>
              <option value="BSC">BSC</option>
              <option value="SOLANA">Solana</option>
            </select>
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                placeholder="Enter contract address (0x... or SPL mint)"
                className="w-full bg-bg-tertiary border border-border-default rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-neon-blue"
              />
            </div>
            <button
              onClick={() => handleScan()}
              disabled={loading}
              className="bg-bingo-orange text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-500 disabled:opacity-50 transition-all active:scale-95 flex-shrink-0"
            >
              {loading ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Risk Overview */}
            <div className="bg-bg-secondary border rounded-2xl p-6" style={{ borderColor: `${riskColor}40` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm text-text-tertiary mb-1">Contract</div>
                    <h2 className="text-2xl font-black text-white">{result.name}</h2>
                    <div className="text-text-tertiary text-sm font-mono">{formatAddress(result.contractAddress, 10)} · {result.chain}</div>
                  </div>
                </div>
                <div className="text-center flex-shrink-0">
                  <div
                    className="text-4xl font-black mb-1"
                    style={{ color: riskColor }}
                  >
                    {result.overallScore}
                  </div>
                  <div className="text-xs text-text-tertiary">Safety Score</div>
                  <div
                    className="mt-2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: `${riskColor}20`, color: riskColor, border: `1px solid ${riskColor}40` }}
                  >
                    {result.riskLevel} RISK
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-bg-tertiary rounded-xl p-3">
                  <div className="text-xs text-text-tertiary mb-1">Buy Tax</div>
                  <div className={`text-lg font-bold font-mono ${result.buyTax > 5 ? 'text-bingo-orange' : 'text-white'}`}>
                    {result.buyTax}%
                  </div>
                </div>
                <div className="bg-bg-tertiary rounded-xl p-3">
                  <div className="text-xs text-text-tertiary mb-1">Sell Tax</div>
                  <div className={`text-lg font-bold font-mono ${result.sellTax > 5 ? 'text-bingo-orange' : 'text-white'}`}>
                    {result.sellTax}%
                  </div>
                </div>
                <div className="bg-bg-tertiary rounded-xl p-3">
                  <div className="text-xs text-text-tertiary mb-1">Liquidity</div>
                  <div className="text-lg font-bold text-white">{formatUSD(result.totalLiquidity)}</div>
                </div>
                <div className="bg-bg-tertiary rounded-xl p-3">
                  <div className="text-xs text-text-tertiary mb-1">Holders</div>
                  <div className="text-lg font-bold text-white">{result.holderCount.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Security Checks */}
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Security Checks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SECURITY_CHECKS.map(({ label, value, good, warning }) => (
                  <div key={label} className="flex items-center justify-between bg-bg-tertiary rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      {good ? (
                        <CheckCircle size={14} className="text-electric-blue" />
                      ) : warning ? (
                        <AlertTriangle size={14} className="text-bingo-yellow" />
                      ) : (
                        <XCircle size={14} className="text-bingo-orange" />
                      )}
                      {label}
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: good ? '#00E5FF' : warning ? '#FFD23F' : '#FF6B35',
                      }}
                    >
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Holder Distribution */}
            <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Holder Distribution</h3>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Top 10 holders concentration</span>
                  <span className={`font-mono font-bold ${result.top10Concentration > 50 ? 'text-bingo-orange' : 'text-electric-blue'}`}>
                    {formatPercent(result.top10Concentration, false)}
                  </span>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(result.top10Concentration, 100)}%`,
                      backgroundColor: result.top10Concentration > 50 ? '#FF6B35' : '#00E5FF',
                    }}
                  />
                </div>
              </div>
              {result.top10Concentration > 50 && (
                <div className="flex items-start gap-2 text-xs text-bingo-yellow bg-bingo-yellow/10 rounded-lg p-3">
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                  High concentration risk — top 10 wallets control {formatPercent(result.top10Concentration, false)} of supply.
                </div>
              )}
            </div>

            {/* Flags */}
            {result.flags && result.flags.length > 0 && (
              <div className="bg-bg-secondary border border-border-default rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Info size={18} />
                  Detailed Flags
                </h3>
                <div className="space-y-2">
                  {result.flags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 mt-0.5"
                        style={{
                          color: flag.severity === 'critical' ? '#FF0420' : flag.severity === 'high' ? '#FF6B35' : '#FFD23F',
                          backgroundColor: flag.severity === 'critical' ? '#FF042010' : flag.severity === 'high' ? '#FF6B3510' : '#FFD23F10',
                        }}
                      >
                        {flag.severity.toUpperCase()}
                      </span>
                      <span className="text-text-secondary">{flag.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScannerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-primary flex items-center justify-center"><div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <ScannerPageInner />
    </Suspense>
  );
}
