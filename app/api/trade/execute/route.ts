import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken, getAuthTokenFromRequest } from '@/lib/privy-server';
import { TREASURY_WALLET_EVM, TREASURY_WALLET_SOLANA, TRADING_FEE_FREE } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const authToken = getAuthTokenFromRequest(req);
  if (!authToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const claims = await verifyPrivyToken(authToken);
    const body = await req.json();
    const { side, fromToken, toToken, amount, chain, slippage, userAddress, limitPrice, orderType } = body;

    if (!amount || amount <= 0 || !userAddress) {
      return NextResponse.json({ error: 'Invalid trade parameters' }, { status: 400 });
    }

    const treasury = chain === 'SOLANA' ? TREASURY_WALLET_SOLANA : TREASURY_WALLET_EVM;
    const fee = amount * TRADING_FEE_FREE;
    const amountAfterFee = amount - fee;

    // For Solana trades via Jupiter
    if (chain === 'SOLANA') {
      try {
        const inputMint = fromToken === 'USDC' ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' : fromToken;
        const outputMint = toToken === 'USDC' ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' : toToken;
        const inputDecimals = fromToken === 'USDC' ? 6 : 9;
        const inputAmount = Math.floor(amountAfterFee * Math.pow(10, inputDecimals));

        // Get Jupiter quote
        const quoteRes = await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${inputAmount}&slippageBps=${Math.floor(slippage * 100)}`
        );
        const quote = await quoteRes.json();

        if (!quote.outAmount) {
          return NextResponse.json({ error: 'No route found for this swap' }, { status: 400 });
        }

        // Get swap transaction
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
          // In production: return transaction for wallet to sign
          // The client-side code handles signing via Privy embedded wallet
          return NextResponse.json({
            success: true,
            transaction: swapData.swapTransaction,
            fee,
            feeUSD: fee,
            treasuryWallet: treasury,
            route: 'Jupiter',
            requiresSignature: true,
          });
        }
      } catch (err) {
        console.error('Jupiter error:', err);
      }
    }

    // For EVM trades: return transaction for signing
    // In production, integrate ParaSwap or 0x Protocol
    // Fee transfer to treasury is included in the transaction

    // Simulate successful trade (demo mode)
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
      userId: claims.userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Trade execution error:', error);
    return NextResponse.json({ error: 'Trade execution failed' }, { status: 500 });
  }
}
