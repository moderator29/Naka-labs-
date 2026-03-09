import { PrivyClient } from '@privy-io/server-auth';

export const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function verifyPrivyToken(authToken: string) {
  try {
    const verifiedClaims = await privyClient.verifyAuthToken(authToken);
    return verifiedClaims;
  } catch {
    throw new Error('Invalid auth token');
  }
}

export function getAuthTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization');
  return auth?.replace('Bearer ', '') ?? null;
}
