'use client';

import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { ConnectButton } from 'thirdweb/react';
import toast from 'react-hot-toast';
import { Info, RefreshCw, ChevronDown, Wallet, ArrowUpDown, Zap } from 'lucide-react';
import { TokenInfo } from '@/stores/tradingStore';
import { TREASURY_WALLET_EVM, TREASURY_WALLET_SOLANA } from '@/lib/constants';
import { thirdwebClient, wallets } from '@/lib/thirdweb';

interface TradingPanelProps {
  token: TokenInfo | null;
  limitPrice: number | null;
  onLimitPriceChange: (price: number | null) => void;
}

type Side      = 'buy' | 'sell';
type OrderType = 'market' | 'limit';

const SLIPPAGE_OPTS  = ['Auto', '0.5%', '1%', '3%'];
const ROUTING_OPTS   = ['Auto', 'Jupiter', 'Raydium', 'Orca'];
const PCT_SHORTCUTS  = [0, 25, 50, 75, 100] as const;

function fmt(n: number): string {
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(1)}K`;
  if (n < 0.001) return `$${n.toFixed(8)}`;
  if (n < 1)     return `$${n.toFixed(5)}`;
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export default function TradingPanel({ token, limitPrice, onLimitPriceChange }: TradingPanelProps) {
  const account       = useActiveAccount();
  const authenticated = !!account;

  const [side,       setSide]       = useState<Side>('buy');
  const [orderType,  setOrderType]  = useState<OrderType>('market');
  const [amount,     setAmount]     = useState('');
  const [pct,        setPct]        = useState(0);
  const [price,      setPrice]      = useState(limitPrice?.toString() ?? '');
  const [slippage,   setSlippage]   = useState('Auto');
  const [routing,    setRouting]    = useState('Auto');
  const [showSlippageMenu, setShowSlippageMenu] = useState(false);
  const [showRoutingMenu,  setShowRoutingMenu]  = useState(false);
  const [executing,  setExecuting]  = useState(false);
  const [quote,      setQuote]      = useState<{ outputAmount: number; priceImpact: number; fee: number } | null>(null);
  const [fetchingQ,  setFetchingQ]  = useState(false);

  // Available balance (mock)
  const availableUSD = 141.42;

  // Sync limit price from chart click
  useEffect(() => {
    if (limitPrice !== null) {
      setPrice(limitPrice.toFixed(6));
      setOrderType('limit');
    }
  }, [limitPrice]);

  // Debounce quote fetch
  useEffect(() => {
    if (!amount || !token || parseFloat(amount) <= 0) { setQuote(null); return; }
    const t = setTimeout(fetchQuote, 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, token, side, slippage]);

  async function fetchQuote() {
    if (!amount || !token) return;
    setFetchingQ(true);
    try {
      const slipNum = slippage === 'Auto' ? 0.5 : parseFloat(slippage);
      const res = await fetch('/api/trade/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromToken: side === 'buy' ? 'USDC' : token.address,
          toToken:   side === 'buy' ? token.address : 'USDC',
          amount:    parseFloat(amount),
          chain:     token.chain,
          slippage:  slipNum,
        }),
      });
      const data = await res.json();
      if (data.outputAmount) setQuote(data);
    } catch { /* ignore */ }
    finally { setFetchingQ(false); }
  }

  function applyPct(p: number) {
    setPct(p);
    if (p === 0) { setAmount(''); return; }
    const val = ((availableUSD * p) / 100).toFixed(2);
    setAmount(val);
  }

  async function handleExecute() {
    if (!authenticated) { toast.error('Connect wallet to trade'); return; }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (!token) { toast.error('Select a token first'); return; }

    setExecuting(true);
    const tid = toast.loading(`Executing ${side.toUpperCase()} order…`);
    try {
      const treasury = token.chain === 'SOLANA' ? TREASURY_WALLET_SOLANA : TREASURY_WALLET_EVM;
      const slipNum  = slippage === 'Auto' ? 0.5 : parseFloat(slippage);

      const res = await fetch('/api/trade/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side, orderType,
          fromToken: side === 'buy' ? 'USDC' : token.address,
          toToken:   side === 'buy' ? token.address : 'USDC',
          amount:    parseFloat(amount),
          limitPrice: orderType === 'limit' ? parseFloat(price) : undefined,
          chain:      token.chain,
          slippage:   slipNum,
          userAddress:    account?.address,
          treasuryWallet: treasury,
        }),
      });

      const result = await res.json();

      // Solana: user signs via Phantom
      if (result.success && result.requiresSignature && result.transaction && token.chain === 'SOLANA') {
        toast.success('Swap route found via Jupiter! Sign in your Solana wallet.', { id: tid });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const phantom = typeof window !== 'undefined' ? (window as any).solana : null;
        if (phantom?.signAndSendTransaction) {
          try {
            const { VersionedTransaction } = await import('@solana/web3.js');
            const bytes = Buffer.from(result.transaction, 'base64');
            const vtx   = VersionedTransaction.deserialize(bytes);
            const { signature } = await phantom.signAndSendTransaction(vtx);
            toast.success(`Swap executed! TX: ${String(signature).slice(0, 12)}…`);
          } catch (err) { console.error('Phantom sign error:', err); }
        }
        setAmount(''); setPct(0); setQuote(null);
        return;
      }

      if (result.success) {
        toast.success(`${side === 'buy' ? '🟢 Bought' : '🔴 Sold'} ${token.symbol} — TX: ${result.txHash?.slice(0, 12)}…`, { id: tid });
        setAmount(''); setPct(0); setQuote(null);
      } else {
        toast.error(result.error ?? 'Trade failed', { id: tid });
      }
    } catch {
      toast.error('Execution failed. Please try again.', { id: tid });
    } finally {
      setExecuting(false);
    }
  }

  const amtNum          = parseFloat(amount) || 0;
  const estimatedOutput = quote?.outputAmount ?? amtNum * (side === 'buy' ? (token?.price ?? 1) : 1 / (token?.price ?? 1));
  const fee             = amtNum * 0.001;
  const isBuy           = side === 'buy';

  return (
    <div className="flex flex-col bg-[#0D1117] border-l border-white/8 h-full overflow-y-auto">

      {/* Buy / Sell tabs */}
      <div className="flex flex-shrink-0">
        <button
          onClick={() => setSide('buy')}
          className={`flex-1 py-3 font-bold text-[13px] transition-all border-b-2 ${
            isBuy ? 'text-[#00C874] border-[#00C874] bg-[#00C874]/8' : 'text-white/30 border-transparent hover:text-white/60'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={`flex-1 py-3 font-bold text-[13px] transition-all border-b-2 ${
            !isBuy ? 'text-[#FF4444] border-[#FF4444] bg-[#FF4444]/8' : 'text-white/30 border-transparent hover:text-white/60'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3 flex-1">

        {/* Market / Limit order type */}
        <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl">
          {(['market', 'limit'] as OrderType[]).map(t => (
            <button
              key={t}
              onClick={() => setOrderType(t)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                orderType === t ? 'bg-white/12 text-white shadow-sm' : 'text-white/35 hover:text-white/60'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Limit price input */}
        {orderType === 'limit' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-white/40 font-medium">Limit Price</span>
              <button onClick={() => { onLimitPriceChange(null); setPrice(''); }} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Clear</button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[12px]">$</span>
              <input
                type="number" value={price}
                onChange={e => { setPrice(e.target.value); onLimitPriceChange(parseFloat(e.target.value)); }}
                placeholder="Click chart to set price"
                className="w-full bg-white/6 border border-white/10 rounded-xl pl-6 pr-3 py-2.5 text-white font-mono text-[12px] focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Amount input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-white/40 font-medium">Amount ({isBuy ? 'USD' : token?.symbol ?? 'Token'})</span>
            {fetchingQ && <RefreshCw size={10} className="text-white/30 animate-spin" />}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[12px]">$</span>
            <input
              type="number" value={amount}
              onChange={e => { setAmount(e.target.value); setPct(0); }}
              placeholder="0.00"
              className="w-full bg-white/6 border border-white/10 rounded-xl pl-6 pr-16 py-2.5 text-white font-mono text-[13px] focus:outline-none focus:border-[#00E5FF]/50 transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="text-[10px] text-white/30 font-medium">{isBuy ? 'USD' : token?.symbol}</span>
              <ArrowUpDown size={11} className="text-white/25" />
            </div>
          </div>
        </div>

        {/* Percentage slider + buttons */}
        <div>
          <input
            type="range" min={0} max={100} step={1} value={pct}
            onChange={e => applyPct(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer mb-1.5"
            style={{ accentColor: isBuy ? '#00C874' : '#FF4444' }}
          />
          <div className="flex justify-between">
            {PCT_SHORTCUTS.map((p, i) => (
              <button
                key={p}
                onClick={() => applyPct(p)}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-all ${
                  pct === p ? 'bg-white/12 text-white' : 'text-white/28 hover:text-white/55 hover:bg-white/6'
                }`}
              >
                {i === 4 ? 'MAX' : `${p}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Available */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/30">Available to Trade</span>
          <span className="text-white/60 font-mono">${availableUSD.toFixed(2)}</span>
        </div>

        {/* Slippage + Routing */}
        <div className="grid grid-cols-2 gap-2">
          {/* Slippage */}
          <div className="relative">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-white/30">Slippage</span>
              <Info size={9} className="text-white/20" />
            </div>
            <button
              onClick={() => setShowSlippageMenu(p => !p)}
              className="w-full flex items-center justify-between bg-white/5 border border-white/8 rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 hover:border-white/15 transition-colors"
            >
              {slippage} <ChevronDown size={11} className="text-white/30" />
            </button>
            {showSlippageMenu && (
              <div className="absolute top-full left-0 mt-1 w-full bg-[#1A2035] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                {SLIPPAGE_OPTS.map(o => (
                  <button key={o} onClick={() => { setSlippage(o); setShowSlippageMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-[11px] hover:bg-white/5 transition-colors ${slippage === o ? 'text-[#00C874] font-semibold' : 'text-white/60'}`}
                  >{o}</button>
                ))}
              </div>
            )}
          </div>

          {/* Routing */}
          <div className="relative">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-white/30">Routing</span>
            </div>
            <button
              onClick={() => setShowRoutingMenu(p => !p)}
              className="w-full flex items-center justify-between bg-white/5 border border-white/8 rounded-lg px-2.5 py-1.5 text-[11px] text-white/70 hover:border-white/15 transition-colors"
            >
              {routing} <ChevronDown size={11} className="text-white/30" />
            </button>
            {showRoutingMenu && (
              <div className="absolute top-full left-0 mt-1 w-full bg-[#1A2035] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                {ROUTING_OPTS.map(o => (
                  <button key={o} onClick={() => { setRouting(o); setShowRoutingMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-[11px] hover:bg-white/5 transition-colors ${routing === o ? 'text-[#00C874] font-semibold' : 'text-white/60'}`}
                  >{o}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quote summary */}
        {amtNum > 0 && (
          <div className="bg-white/4 rounded-xl p-3 space-y-2 border border-white/6">
            <div className="flex justify-between text-[11px]">
              <span className="text-white/35">You receive</span>
              <span className="text-white font-mono">≈ {estimatedOutput.toLocaleString('en-US', { maximumFractionDigits: 6 })} {isBuy ? (token?.symbol ?? '—') : 'USD'}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-white/35">Platform fee (0.1%)</span>
              <span className="text-white/55 font-mono">${fee.toFixed(4)}</span>
            </div>
            {quote?.priceImpact ? (
              <div className="flex justify-between text-[11px]">
                <span className="text-white/35">Price impact</span>
                <span className={quote.priceImpact > 3 ? 'text-[#FF6B35]' : 'text-white/55'}>
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
            ) : null}
          </div>
        )}

        {/* Execute button or Connect Wallet */}
        {authenticated ? (
          <button
            onClick={handleExecute}
            disabled={!amtNum || executing}
            className={`w-full py-3.5 rounded-xl font-bold text-[14px] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isBuy
                ? 'bg-[#00C874] hover:bg-[#00E882] text-black'
                : 'bg-[#FF4444] hover:bg-[#FF6666] text-white'
            }`}
          >
            {executing ? (
              <><RefreshCw size={14} className="animate-spin" /> Executing…</>
            ) : (
              <><Zap size={14} /> {isBuy ? 'Buy' : 'Sell'} {token?.symbol ?? 'Token'}</>
            )}
          </button>
        ) : (
          <ConnectButton
            client={thirdwebClient}
            wallets={wallets}
            connectButton={{
              label: 'Connect Wallet',
              className: 'w-full py-3.5 rounded-xl font-bold text-[14px] bg-[#00C874] hover:bg-[#00E882] text-black transition-all',
            }}
            detailsButton={{ style: { display: 'none' } }}
          />
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between text-[10px] text-white/20 pb-1">
          <span>0.1% fee → Treasury</span>
          <span>MEV protected</span>
        </div>

        {/* Deposit / Withdraw links */}
        {authenticated && (
          <div className="flex items-center justify-center gap-6 pt-1 border-t border-white/5">
            <button className="text-[11px] text-white/30 hover:text-[#00E5FF] transition-colors flex items-center gap-1">
              <Wallet size={10} /> Deposit
            </button>
            <button className="text-[11px] text-white/30 hover:text-[#FF6B35] transition-colors flex items-center gap-1">
              <Wallet size={10} /> Withdraw
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
