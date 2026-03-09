import { NextRequest, NextResponse } from 'next/server';
import { TIER_REQUIREMENTS } from '@/lib/constants';

// NAKA token contract address (to be updated with actual address)
const NAKA_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // placeholder

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    // In production: fetch actual NAKA token balance via Alchemy
    // const alchemy = new Alchemy({ ... });
    // const balanceResult = await alchemy.core.getTokenBalances(address, [NAKA_TOKEN_ADDRESS]);
    // const balance = parseInt(balanceResult.tokenBalances[0].tokenBalance, 16) / 1e18;

    // Mock balance for demo
    const mockBalance = 0; // Start with 0 for new users

    const tier =
      mockBalance >= TIER_REQUIREMENTS.GOLD ? 'GOLD' :
      mockBalance >= TIER_REQUIREMENTS.SILVER ? 'SILVER' :
      mockBalance >= TIER_REQUIREMENTS.BRONZE ? 'BRONZE' :
      'FREE';

    return NextResponse.json({
      address,
      nakaBalance: mockBalance,
      tier,
      requirements: TIER_REQUIREMENTS,
    });
  } catch (error) {
    console.error('NAKA balance error:', error);
    return NextResponse.json({
      address,
      nakaBalance: 0,
      tier: 'FREE',
      requirements: TIER_REQUIREMENTS,
    });
  }
}
