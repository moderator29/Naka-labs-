import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper: get or create a minimal User row by wallet address
async function getOrCreateUser(walletAddress: string) {
  let user = await prisma.user.findFirst({
    where: { wallets: { some: { address: walletAddress } } },
  });
  if (!user) {
    // Create a stub user with the wallet address as identity
    const id = `wallet_${walletAddress.toLowerCase().slice(0, 20)}`;
    user = await prisma.user.upsert({
      where: { username: id },
      update: {},
      create: {
        privyId:  id,
        username: id,
        tier:     'FREE',
        wallets:  {
          create: {
            address: walletAddress,
            chain:   walletAddress.startsWith('0x') ? 'ETHEREUM' : 'SOLANA',
          },
        },
      },
    });
  }
  return user;
}

// GET /api/watchlists?wallet=0x...
export async function GET(req: NextRequest) {
  const wallet = new URL(req.url).searchParams.get('wallet');
  if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 });

  try {
    const user = await getOrCreateUser(wallet);
    const lists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: { tokens: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ watchlists: lists });
  } catch (err) {
    console.error('GET watchlists error:', err);
    return NextResponse.json({ error: 'Failed to fetch watchlists' }, { status: 500 });
  }
}

// POST /api/watchlists  body: { wallet, name }
export async function POST(req: NextRequest) {
  try {
    const { wallet, name } = await req.json();
    if (!wallet || !name) return NextResponse.json({ error: 'wallet and name required' }, { status: 400 });

    const user = await getOrCreateUser(wallet);
    const list = await prisma.watchlist.create({
      data: { userId: user.id, name },
    });
    return NextResponse.json({ watchlist: list });
  } catch (err) {
    console.error('POST watchlist error:', err);
    return NextResponse.json({ error: 'Failed to create watchlist' }, { status: 500 });
  }
}

// DELETE /api/watchlists?id=...&wallet=...
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const wallet = url.searchParams.get('wallet');
  if (!id || !wallet) return NextResponse.json({ error: 'id and wallet required' }, { status: 400 });

  try {
    const user = await getOrCreateUser(wallet);
    await prisma.watchlist.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE watchlist error:', err);
    return NextResponse.json({ error: 'Failed to delete watchlist' }, { status: 500 });
  }
}
