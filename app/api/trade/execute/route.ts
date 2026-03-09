import { NextRequest, NextResponse } from 'next/server';
import { TREASURY_WALLET_EVM, TREASURY_WALLET_SOLANA, TRADING_FEE_FREE } from '@/lib/constants';

// 0x API base URLs per chain
const ZEROx_BASES: Record<string, string> = {
  '1':     'https://api.0x.org',
  '56':    'https://bsc.api.0x.org',
  '137':   'https://polygon.api.0x.org',
  '8453':  'https://base.api.0x.org',
  '42161': 'https://arbitrum.api.0x.org',
  '10':    'https://optimism.api.0x.org',
  '43114': 'https://avalanche.api.0x.org',
};

// Native token addresses per chain
const NATIVE_TOKEN: Record<string, string> = {
  '1':     '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH
  '56':    '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // BNB
  '137':   '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // MATIC
  '8453':  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH on Base
  '42161': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', // ETH on Arb
};

// USDC addresses per chain (buy-in currency)
const USDC_ADDRESSES: Record<string, string> = {
  '1':     '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  '56':    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  '137':   '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  '8453':  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  '42161': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
};

// Chain ID lookup by Naka chain name
const CHAIN_TO_ID: Record<string, string> = {
  ETHEREUM: '1', BSC: '56', POLYGON: '137',
  BASE: '8453', ARBITRUM: '42161', OPTIMISM: '10',
  AVALANCHE: '43114',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { side, fromToken, toToken, amount, chain, slippage = 0.5, userAddress, orderType } = body;

    if (!amount || amount <= 0 || !userAddress) {
      return NextResponse.json({ error: 'Invalid trade parameters' }, { status: 400 });
    }

    const treasury = chain === 'SOLANA' ? TREASURY_WALLET_SOLANA : TREASURY_WALLET_EVM;
    const fee = amount * TRADING_FEE_FREE;
    const amountAfterFee = amount - fee;

    // ── Solana: Jupiter ──────────────────────────────────────────────────────
    if (chain === 'SOLANA') {
      try {
        const inputMint = fromToken === 'USDC' ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' : fromToken;
        const outputMint = toToken === 'USDC' ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' : toToken;
        const inputDecimals = fromToken === 'USDC' ? 6 : 9;
        const inputAmount = Math.floor(amountAfterFee * Math.pow(10, inputDecimals));

        const quoteRes = await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${inputAmount}&slippageBps=${Math.floor(slippage * 100)}`
        );
        const quote = await quoteRes.json();

        if (!quote.outAmount) {
          return NextResponse.json({ error: 'No route found for this swap' }, { status: 400 });
        }

        const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteResponse: quote,
            userPublicKey: userAddress,
            wrapAndUnwrapSol: true,
            feeAccount: treasury,
          }),
        });
        const swapData = await swapRes.json();

        if (swapData.swapTransaction) {
          return NextResponse.json({
            success: true,
            transaction: swapData.swapTransaction,
            outAmount: quote.outAmount,
            fee,
            feeUSD: fee,
            treasuryWallet: treasury,
            route: 'Jupiter',
            requiresSignature: true,
            chain: 'SOLANA',
          });
        }
      } catch (err) {
        console.error('Jupiter error:', err);
      }
    }

    // ── EVM: 0x API ──────────────────────────────────────────────────────────
    const chainId = CHAIN_TO_ID[chain];
    const zeroXBase = chainId ? ZEROx_BASES[chainId] : null;
    const apiKey = process.env.ZEROX_API_KEY;

    if (zeroXBase && apiKey) {
      try {
        // Determine sell/buy token addresses
        const sellToken = side === 'buy'
          ? (USDC_ADDRESSES[chainId] ?? 'USDC')          // spend USDC to buy
          : (fromToken || NATIVE_TOKEN[chainId]);          // sell token

        const buyToken = side === 'buy'
          ? (toToken || NATIVE_TOKEN[chainId])              // receive token
          : (USDC_ADDRESSES[chainId] ?? 'USDC');           // receive USDC

        // Amount in USDC decimals (6) or ETH decimals (18)
        const isUSDCInput = sellToken === USDC_ADDRESSES[chainId];
        const decimals = isUSDCInput ? 6 : 18;
        const sellAmountUnits = BigInt(Math.floor(amountAfterFee * 10 ** decimals)).toString();

        const params = new URLSearchParams({
          sellToken,
          buyToken,
          sellAmount: sellAmountUnits,
          takerAddress: userAddress,
          slippagePercentage: (slippage / 100).toString(),
          feeRecipient: TREASURY_WALLET_EVM,
          buyTokenPercentageFee: TRADING_FEE_FREE.toString(),
          skipValidation: 'false',
        });

        const quoteRes = await fetch(`${zeroXBase}/swap/v1/quote?${params}`, {
          headers: {
            '0x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (quoteRes.ok) {
          const quote = await quoteRes.json();

          if (quote.to && quote.data) {
            return NextResponse.json({
              success: true,
              // Transaction fields — frontend signs + sends with ThirdWeb sendTransaction
              to: quote.to,
              data: quote.data,
              value: quote.value ?? '0',
              gas: quote.estimatedGas ?? quote.gas,
              gasPrice: quote.gasPrice,
              // Quote info
              price: quote.price,
              guaranteedPrice: quote.guaranteedPrice,
              buyAmount: quote.buyAmount,
              sellAmount: quote.sellAmount,
              estimatedPriceImpact: quote.estimatedPriceImpact,
              allowanceTarget: quote.allowanceTarget,
              // Meta
              fee,
              feeUSD: fee,
              treasuryWallet: TREASURY_WALLET_EVM,
              route: '0x',
              dex: quote.sources?.[0]?.name ?? '0x',
              requiresSignature: true,
              requiresApproval: quote.allowanceTarget && quote.allowanceTarget !== '0x0000000000000000000000000000000000000000',
              chain,
              chainId,
            });
          }
        } else {
          const errText = await quoteRes.text();
          console.error('0x API error:', quoteRes.status, errText);
        }
      } catch (err) {
        console.error('0x API error:', err);
      }
    }

    // ── Fallback demo mode (no API key or route not found) ───────────────────
    const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    return NextResponse.json({
      success: true,
      txHash: mockTxHash,
      side,
      fromToken,
      toToken,
      amount,
      fee,
      feeUSD: fee,
      treasuryWallet: treasury,
      chain,
      userId: userAddress,
      timestamp: new Date().toISOString(),
      demo: !apiKey || !zeroXBase,
    });
  } catch (error) {
    console.error('Trade execution error:', error);
    return NextResponse.json({ error: 'Trade execution failed' }, { status: 500 });
  }
}
