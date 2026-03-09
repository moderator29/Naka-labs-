import { NextResponse } from 'next/server';

// Legacy Privy webhook endpoint — kept for routing compatibility
export async function POST() {
  return NextResponse.json({ received: true });
}
