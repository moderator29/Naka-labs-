import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, country, idType, telegram, twitter, reason, userAddress } = body;

    if (!fullName || !country || !idType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!userAddress) {
      return NextResponse.json({ error: 'Wallet not connected' }, { status: 401 });
    }

    // In production: save to Supabase and notify admin
    const submission = {
      userId: userAddress,
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
  const address = req.nextUrl.searchParams.get('address');
  if (!address) return NextResponse.json({ status: 'NONE' });
  // In production: query Supabase for this user's verification status
  return NextResponse.json({ userId: address, status: 'NONE' });
}
