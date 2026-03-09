import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken, getAuthTokenFromRequest } from '@/lib/privy-server';

export async function POST(req: NextRequest) {
  const authToken = getAuthTokenFromRequest(req);
  if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const claims = await verifyPrivyToken(authToken);
    const body = await req.json();

    const { fullName, country, idType, telegram, twitter, reason } = body;
    if (!fullName || !country || !idType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In production: save to Supabase and notify admin
    const submission = {
      userId: claims.userId,
      fullName,
      country,
      idType,
      telegram: telegram ?? null,
      twitter: twitter ?? null,
      reason: reason ?? null,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    // TODO: await supabase.from('verifications').insert(submission)
    console.log('Verification submission:', submission);

    return NextResponse.json({ success: true, message: 'Verification request submitted. We will review within 24-48 hours.' });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Failed to submit verification' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authToken = getAuthTokenFromRequest(req);
  if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const claims = await verifyPrivyToken(authToken);
    // In production: query Supabase for this user's verification status
    return NextResponse.json({ userId: claims.userId, status: 'NONE' });
  } catch {
    return NextResponse.json({ status: 'NONE' });
  }
}
