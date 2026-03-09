import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

// Privy webhook handler for user lifecycle events
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('privy-signature');

    // Verify webhook signature
    const webhookSecret = process.env.PRIVY_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSig = createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== `sha256=${expectedSig}`) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const { type, data } = event;

    switch (type) {
      case 'user.created': {
        // New user signed up - create profile in DB
        const { user } = data;
        console.log('New user:', user.id);

        // In production: create user in Prisma
        // await prisma.user.create({
        //   data: {
        //     privyId: user.id,
        //     email: user.email?.address,
        //     username: `user_${user.id.slice(-8)}`,
        //   }
        // });
        break;
      }

      case 'user.authenticated': {
        const { user } = data;
        console.log('User authenticated:', user.id);
        // Update last login timestamp
        break;
      }

      case 'user.linked_account': {
        const { user } = data;
        console.log('Account linked for user:', user.id);
        // Update linked wallets
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Privy webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
