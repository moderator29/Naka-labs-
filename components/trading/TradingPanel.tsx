'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import toast from 'react-hot-toast';
import { Settings, Info, RefreshCw } from 'lucide-react';
import { TokenInfo } from '@/stores/tradingStore';
import { formatUSD, formatNumber } from '@/lib/utils/formatters';
import { TREASURY_WALLET_EVM, TREASURY_WALLET_SOLANA } from '@/lib/constants';

interface TradingPanelProps {
  token: TokenInfo | null;
  limitPrice: number | null;
  onLimitPriceChange: (price: number | null) => void;
}

type Side = 'buy' | 'sell';
type OrderType = 'market' | 'limit';

const QUICK_AMOUNTS = [25, 50, 100, 500];
const SLIPPAGE_OPTIONS = [0.5, 1, 3, 5];

export default function TradingPanel({ token, limitPrice, onLimitPriceChange }: TradingPanelProps) {
  const account = useActiveAccount();
  const authenticated = !!account;
  const [side, setSide] = useState<Side>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState(limitPrice?.toString() ?? '');
  const [slippage, setSlippage] = useState(0.5);
  const [isExecuting, setIsExecuting] = useState(false);
  const [quote, setQuote] = useState<{ outputAmount: number; priceImpact: number; fee: number } | null>(null);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [recentTrades, setRecentTrades] = useState<{ type: string; amount: number; price: number; time: string }[]>([]);

  // Sync limit price from chart click
  useEffect(() => {
    if (limitPrice !== null) {
      setPrice(limitPrice.toFixed(6));
      setOrderType('limit');
    }
  }, [limitPrice]);

  // Fetch quote when amount changes
  useEffect(() => {
    if (!amount || !token || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }
    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [amount, token, side, slippage]);

  async function fetchQuote() {
    if (!amount || !token) return;
    setFetchingQuote(true);
    try {
      const res = await fetch('/api/trade/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: side === 'buy' ? 'USDC' : token.address,
          toToken: side === 'buy' ? token.address : 'USDC',
          amount: parseFloat(amount),
          chain: token.chain,
          slippage,
        }),
      });
      const data = await res.json();
      if (data.outputAmount) setQuote(data);
    } catch {
      // ignore quote errors
    } finally {
      setFetchingQuote(false);
    }
  }

  async function handleExecute() {
    if (!authenticated) {
      toast.error('Connect wallet to trade');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!token) {
      toast.error('Select a token');
      return;
    }

    setIsExecuting(true);
    const toastId = toast.loading(`Executing ${side.toUpperCase()} order...`);

    try {
      const treasury = token.chain === 'SOLANA' ? TREASURY_WALLET_SOLANA : TREASURY_WALLET_EVM;

      const res = await fetch('/api/trade/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side,
          orderType,
          fromToken: side === 'buy' ? 'USDC' : token.address,
          toToken: side === 'buy' ? token.address : 'USDC',
          amount: parseFloat(amount),
          limitPrice: orderType === 'limit' ? parseFloat(price) : undefined,
          chain: token.chain,
          slippage,
          userAddress: account?.address,
          treasuryWallet: treasury,
        }),
      });

      const result = await res.json();

      // For Solana: Jupiter built the transaction — user signs via their external wallet
      if (result.success && result.requiresSignature && result.transaction && token.chain === 'SOLANA') {
        toast.success('Swap route found via Jupiter! Open your Solana wallet to sign.', { id: toastId });
        // Store transaction for external signing (Phantom, Solflare, etc.)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const phantom = typeof window !== 'undefined' ? (window as any).solana : null;
        if (phantom?.signAndSendTransaction) {
          try {
            const { VersionedTransaction } = await import('@solana/web3.js');
            const txBytes = Buffer.from(result.transaction, 'base64');
            const vtx = VersionedTransaction.deserialize(txBytes);
            const { signature } = await phantom.signAndSendTransaction(vtx);
            toast.success(`Swap executed! TX: ${String(signature).slice(0, 12)}...`);
          } catch (sigErr) {
            console.error('Phantom sign error:', sigErr);
          }
        }
        setAmount('');
        setQuote(null);
        setRecentTrades(prev => [{ type: side.toUpperCase(), amount: parseFloat(amount), price: token.price, time: 'just now' }, ...prev.slice(0, 4)]);
        return;
      }

      if (result.success) {
        toast.success(`${side.toUpperCase()} order executed! TX: ${result.txHash?.slice(0, 12)}...`, { id: toastId });
        setAmount('');
        setQuote(null);
        setRecentTrades((prev) => [
          { type: side.toUpperCase(), amount: parseFloat(amount), price: token.price, time: 'just now' },
          ...prev.slice(0, 4),
        ]);
      } else {
        toast.error(result.error ?? 'Trade failed', { id: toastId });
      }
    } catch {
      toast.error('Execution failed. Please try again.', { id: toastId });
    } finally {
      setIsExecuting(false);
    }
  }

  const estimatedOutput = quote?.outputAmount ?? (parseFloat(amount) || 0) * (side === 'buy' ? (token?.price ?? 1) : 1 / (token?.price ?? 1));
  const fee = parseFloat(amount || '0') * 0.005;

  return (
    <div className="h-full flex flex-col bg-bg-secondary border-l border-border-default overflow-y-auto">
      {/* Token Header */}
      {token && (
        <div className="p-4 border-b border-border-default">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white">{token.symbol}</div>
              <div className="text-xs text-text-tertiary">{token.name}</div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-white">{formatUSD(token.price)}</div>
              <div className={`text-xs ${token.change24h >= 0 ? 'text-electric-blue' : 'text-bingo-orange'}`}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-text-tertiary">
            <div>Vol 24h: <span className="text-text-secondary">{formatUSD(token.volume24h)}</span></div>
            <div>Liq: <span className="text-text-secondary">{formatUSD(token.liquidity)}</span></div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Buy/Sell Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-border-default">
          <button
            onClick={() => setSide('buy')}
            className={`flex-1 py-3 font-bold text-sm transition-colors ${
              side === 'buy'
                ? 'bg-electric-blue text-black'
                : 'bg-bg-tertiary text-text-secondary hover:text-white'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`flex-1 py-3 font-bold text-sm transition-colors ${
              side === 'sell'
                ? 'bg-bingo-orange text-white'
                : 'bg-bg-tertiary text-text-secondary hover:text-white'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Market/Limit Toggle */}
        <div className="flex gap-2">
          {(['market', 'limit'] as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                orderType === type
                  ? 'bg-bg-elevated text-white border border-border-strong'
                  : 'bg-bg-tertiary text-text-tertiary hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Limit Price */}
        {orderType === 'limit' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-text-secondary font-medium">Limit Price</label>
              <button
                onClick={() => { onLimitPriceChange(null); setPrice(''); }}
                className="text-xs text-text-tertiary hover:text-white"
              >
                Clear
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
              <input
                type="number"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  onLimitPriceChange(parseFloat(e.target.value));
                }}
                className="w-full bg-bg-tertiary border border-border-default rounded-lg pl-7 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neon-blue"
                placeholder="Click chart to set price"
              />
            </div>
            {limitPrice && (
              <div className="text-xs text-text-tertiary mt-1">Click the chart to update price</div>
            )}
          </div>
        )}

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-text-secondary font-medium">
              Amount ({side === 'buy' ? 'USDC' : token?.symbol ?? 'Token'})
            </label>
            {fetchingQuote && <RefreshCw size={10} className="text-text-tertiary animate-spin" />}
          </div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-default rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neon-blue"
              placeholder="0.00"
            />
            <button
              onClick={() => setAmount('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-tertiary hover:text-white"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Quick Amounts */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => setAmount(amt.toString())}
              className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                amount === amt.toString()
                  ? 'bg-neon-blue/20 border border-neon-blue/40 text-neon-blue'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated hover:text-white'
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>

        {/* Slippage */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <label className="text-xs text-text-secondary font-medium">Slippage</label>
            <Info size={10} className="text-text-tertiary" />
          </div>
          <div className="flex gap-2">
            {SLIPPAGE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  slippage === s
                    ? 'bg-neon-blue text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:text-white'
                }`}
              >
                {s}%
              </button>
            ))}
          </div>
        </div>

        {/* Quote Summary */}
        {amount && parseFloat(amount) > 0 && (
          <div className="bg-bg-tertiary rounded-lg p-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-tertiary">You receive</span>
              <span className="text-white font-mono">
                ≈ {formatNumber(estimatedOutput)} {side === 'buy' ? (token?.symbol ?? '???') : 'USDC'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-tertiary">Platform fee (0.5%)</span>
              <span className="text-text-secondary font-mono">${fee.toFixed(4)}</span>
            </div>
            {quote?.priceImpact && (
              <div className="flex justify-between">
                <span className="text-text-tertiary">Price impact</span>
                <span className={quote.priceImpact > 3 ? 'text-bingo-orange' : 'text-text-secondary'}>
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={!amount || isExecuting || !authenticated}
          className={`w-full py-4 rounded-xl font-bold text-base transition-all active:scale-95 ${
            side === 'buy'
              ? 'bg-electric-blue text-black hover:bg-cyan-400'
              : 'bg-bingo-orange text-white hover:bg-orange-500'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isExecuting
            ? 'Executing...'
            : !authenticated
            ? 'Connect Wallet to Trade'
            : `${side === 'buy' ? 'Buy' : 'Sell'} ${token?.symbol ?? 'Token'}`}
        </button>

        {/* Fee Notice */}
        <div className="flex items-center gap-2 text-xs text-text-tertiary text-center justify-center">
          <Settings size={10} />
          <span>0.5% fee → Treasury · MEV protected via simulation</span>
        </div>

        {/* Recent Trades */}
        {recentTrades.length > 0 && (
          <div className="border-t border-border-subtle pt-4">
            <div className="text-xs font-medium text-text-secondary mb-2">Recent Orders</div>
            <div className="space-y-2">
              {recentTrades.map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className={t.type === 'BUY' ? 'text-electric-blue' : 'text-bingo-orange'}>
                    {t.type}
                  </span>
                  <span className="text-white font-mono">${t.amount}</span>
                  <span className="text-text-tertiary">{t.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
