import { NextRequest, NextResponse } from 'next/server';

// Routes that require wallet connection (checked client-side via ThirdWeb)
// For server-side auth we check the x-wallet-address header sent by ThirdWeb
const PROTECTED_ROUTES = [
  '/portfolio',
  '/watchlists',
  '/alerts',
  '/settings',
  '/profile',
  '/vtx',
];

// API routes that require a wallet address in headers
const PROTECTED_API_ROUTES = [
  '/api/watchlists',
  '/api/alerts',
  '/api/portfolio',
  '/api/dna/analyze',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Rate limiting hint via headers ─────────────────────────────────────────
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https: wss:; font-src 'self' https: data:;"
  );

  // ── CORS for API routes ────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin');
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'https://localhost:3000',
    ].filter(Boolean);

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-wallet-address');
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    // Soft auth check for protected API routes — wallet address required in header or query
    const isProtectedApi = PROTECTED_API_ROUTES.some(r => pathname.startsWith(r));
    if (isProtectedApi) {
      const walletHeader = req.headers.get('x-wallet-address');
      const walletQuery  = new URL(req.url).searchParams.get('wallet');
      if (!walletHeader && !walletQuery) {
        return NextResponse.json(
          { error: 'Wallet address required. Connect your wallet first.' },
          { status: 401, headers: response.headers }
        );
      }
    }
  }

  // ── Client-side protected page routes ─────────────────────────────────────
  // These pages are accessible but show a "connect wallet" prompt client-side.
  // We just add a marker header so the page can detect server-side if needed.
  const isProtectedPage = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  if (isProtectedPage) {
    response.headers.set('X-Auth-Required', '1');
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|icons|images|fonts).*)',
  ],
};
