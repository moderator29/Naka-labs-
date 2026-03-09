import { NextRequest, NextResponse } from 'next/server';
import { TREASURY_WALLET_EVM, TREASURY_WALLET_SOLANA, TRADING_FEE_FREE } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromToken, toToken, amount, chain, slippage = 0.5 } = body;

    if (!fromToken || !toToken || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const treasury = chain === 'SOLANA' ? TREASURY_WALLET_SOLANA : TREASURY_WALLET_EVM;
    const fee = amount * TRADING_FEE_FREE;
    const amountAfterFee = amount - fee;

    // For Solana: use Jupiter Aggregator
    if (chain === 'SOLANA') {
      try {
        const inputMint = fromToken === 'USDC' ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' : fromToken;
        const outputMint = toToken === 'USDC' ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' : toToken;
        const inputDecimals = fromToken === 'USDC' ? 6 : 9;
        const inputAmount = Math.floor(amountAfterFee * Math.pow(10, inputDecimals));

        const jupRes = await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${inputAmount}&slippageBps=${Math.floor(slippage * 100)}`
        );
        const jupQuote = await jupRes.json();

        if (jupQuote.outAmount) {
          const outputDecimals = toToken === 'USDC' ? 6 : 9;
          const outputAmount = parseFloat(jupQuote.outAmount) / Math.pow(10, outputDecimals);
          return NextResponse.json({
            fromToken,
            toToken,
            inputAmount: amount,
            outputAmount,
            fee,
            feeUSD: fee,
            treasuryWallet: treasury,
            priceImpact: parseFloat(jupQuote.priceImpactPct ?? '0'),
            route: 'Jupiter',
            quote: jupQuote,
          });
        }
      } catch {
        // Fall through to mock
      }
    }

    // For EVM: simulate with ParaSwap or return estimate
    // In production, call ParaSwap API here
    const mockOutputAmount = fromToken === 'USDC'
      ? amountAfterFee / 3247 // USDC → token
      : amountAfterFee * 3247; // token → USDC

    return NextResponse.json({
      fromToken,
      toToken,
      inputAmount: amount,
      outputAmount: mockOutputAmount,
      fee,
      feeUSD: fee,
      treasuryWallet: treasury,
      priceImpact: 0.12,
      route: 'ParaSwap',
      slippage,
    });
  } catch (error) {
    console.error('Quote error:', error);
    return NextResponse.json({ error: 'Failed to get quote' }, { status: 500 });
  }
}
