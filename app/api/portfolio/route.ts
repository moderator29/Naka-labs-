import { NextRequest, NextResponse } from 'next/server';
import { isEVMAddress, isSolanaAddress } from '@/lib/utils/validators';
import { getPortfolioTokens, getTokenMetadata } from '@/lib/blockchain/alchemy';
import { getSolanaBalance, getSolanaTokenAccounts } from '@/lib/blockchain/helius';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    const isEVM = isEVMAddress(address);
    const isSolana = isSolanaAddress(address);

    if (!isEVM && !isSolana) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    if (isSolana) {
      const [balance, tokenAccounts] = await Promise.allSettled([
        getSolanaBalance(address),
        getSolanaTokenAccounts(address),
      ]);

      const solBalance = balance.status === 'fulfilled' ? balance.value : 0;
      const holdings = [
        {
          tokenAddress: 'SOL_NATIVE',
          tokenSymbol: 'SOL',
          tokenName: 'Solana',
          chain: 'SOLANA',
          balance: solBalance,
          priceUSD: 182,
          valueUSD: solBalance * 182,
          change24h: -0.5,
        },
      ];

      const totalValue = holdings.reduce((sum, h) => sum + h.valueUSD, 0);

      return NextResponse.json({
        holdings,
        totalValue,
        unrealizedPL: 0,
        chain: 'SOLANA',
      });
    }

    // EVM Portfolio
    const { tokens, ethBalance } = await getPortfolioTokens(address);
    const ethValueUSD = (parseInt(ethBalance) / 1e18) * 3247;

    const holdings: {
      tokenAddress: string;
      tokenSymbol: string;
      tokenName: string;
      chain: string;
      balance: number;
      priceUSD: number;
      valueUSD: number;
      change24h: number;
    }[] = [
      {
        tokenAddress: 'ETH_NATIVE',
        tokenSymbol: 'ETH',
        tokenName: 'Ethereum',
        chain: 'ETHEREUM',
        balance: parseInt(ethBalance) / 1e18,
        priceUSD: 3247,
        valueUSD: ethValueUSD,
        change24h: 1.8,
      },
    ];

    // Fetch metadata for top tokens
    const tokenAddresses = tokens.slice(0, 10).map((t) => t.contractAddress);
    if (tokenAddresses.length > 0) {
      const metadataResults = await Promise.allSettled(
        tokenAddresses.map((addr) => getTokenMetadata(addr, 'ETHEREUM'))
      );

      tokens.slice(0, 10).forEach((token, i) => {
        const meta = metadataResults[i];
        if (meta.status === 'fulfilled' && meta.value) {
          const m = meta.value;
          const decimals = m.decimals ?? 18;
          const balance = parseInt(token.tokenBalance ?? '0', 16) / Math.pow(10, decimals);

          if (balance > 0) {
            holdings.push({
              tokenAddress: token.contractAddress,
              tokenSymbol: m.symbol ?? 'UNKNOWN',
              tokenName: m.name ?? 'Unknown Token',
              chain: 'ETHEREUM',
              balance,
              priceUSD: 0, // Would fetch from CoinGecko in production
              valueUSD: 0,
              change24h: 0,
            });
          }
        }
      });
    }

    const totalValue = holdings.reduce((sum, h) => sum + h.valueUSD, 0);

    return NextResponse.json({
      holdings,
      totalValue,
      unrealizedPL: 0,
      chain: 'ETHEREUM',
    });
  } catch (error) {
    console.error('Portfolio error:', error);
    // Return empty portfolio on error
    return NextResponse.json({
      holdings: [],
      totalValue: 0,
      unrealizedPL: 0,
    });
  }
}
