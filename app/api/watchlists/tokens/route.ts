import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Chain } from '@prisma/client';

// POST /api/watchlists/tokens  body: { watchlistId, tokenAddress, chain }
export async function POST(req: NextRequest) {
  try {
    const { watchlistId, tokenAddress, chain: chainRaw = 'ETHEREUM' } = await req.json();
    const chain = chainRaw as Chain;
    if (!watchlistId || !tokenAddress) {
      return NextResponse.json({ error: 'watchlistId and tokenAddress required' }, { status: 400 });
    }

    const token = await prisma.watchlistToken.upsert({
      where: { watchlistId_tokenAddress_chain: { watchlistId, tokenAddress, chain } },
      update: {},
      create: { watchlistId, tokenAddress, chain },
    });
    return NextResponse.json({ token });
  } catch (err) {
    console.error('POST watchlist token error:', err);
    return NextResponse.json({ error: 'Failed to add token' }, { status: 500 });
  }
}

// DELETE /api/watchlists/tokens?watchlistId=...&tokenAddress=...&chain=...
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const watchlistId   = url.searchParams.get('watchlistId');
  const tokenAddress  = url.searchParams.get('tokenAddress');
  const chain         = (url.searchParams.get('chain') ?? 'ETHEREUM') as Chain;
  if (!watchlistId || !tokenAddress) {
    return NextResponse.json({ error: 'watchlistId and tokenAddress required' }, { status: 400 });
  }

  try {
    await prisma.watchlistToken.deleteMany({ where: { watchlistId, tokenAddress, chain } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE watchlist token error:', err);
    return NextResponse.json({ error: 'Failed to remove token' }, { status: 500 });
  }
}
