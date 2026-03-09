import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function getOrCreateUser(walletAddress: string) {
  let user = await prisma.user.findFirst({
    where: { wallets: { some: { address: walletAddress } } },
  });
  if (!user) {
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

// GET /api/alerts?wallet=0x...
export async function GET(req: NextRequest) {
  const wallet = new URL(req.url).searchParams.get('wallet');
  if (!wallet) return NextResponse.json({ error: 'wallet required' }, { status: 400 });

  try {
    const user = await getOrCreateUser(wallet);
    const alerts = await prisma.alert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ alerts });
  } catch (err) {
    console.error('GET alerts error:', err);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

// POST /api/alerts
// body: { wallet, name, type, tokenAddress?, chain?, condition, target?, notifyEmail? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      wallet, name, type = 'PRICE', tokenAddress, chain,
      condition = 'above', target, notifyEmail = false,
    } = body;

    if (!wallet || !name) {
      return NextResponse.json({ error: 'wallet and name required' }, { status: 400 });
    }

    const user = await getOrCreateUser(wallet);
    const alert = await prisma.alert.create({
      data: {
        userId:       user.id,
        name,
        type,
        tokenAddress: tokenAddress ?? null,
        chain:        chain ?? null,
        condition,
        target:       target ? parseFloat(target) : null,
        notifyEmail,
        notifyInApp:  true,
        active:       true,
      },
    });

    return NextResponse.json({ alert });
  } catch (err) {
    console.error('POST alert error:', err);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

// PATCH /api/alerts  body: { id, wallet, active? }
export async function PATCH(req: NextRequest) {
  try {
    const { id, wallet, active } = await req.json();
    if (!id || !wallet) return NextResponse.json({ error: 'id and wallet required' }, { status: 400 });

    const user = await getOrCreateUser(wallet);
    const alert = await prisma.alert.updateMany({
      where: { id, userId: user.id },
      data:  { active },
    });
    return NextResponse.json({ updated: alert.count });
  } catch (err) {
    console.error('PATCH alert error:', err);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}

// DELETE /api/alerts?id=...&wallet=...
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id     = url.searchParams.get('id');
  const wallet = url.searchParams.get('wallet');
  if (!id || !wallet) return NextResponse.json({ error: 'id and wallet required' }, { status: 400 });

  try {
    const user = await getOrCreateUser(wallet);
    await prisma.alert.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE alert error:', err);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }
}
