// Server auth — address-based after Privy → Thirdweb migration

export function getAuthTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization');
  return auth?.replace('Bearer ', '') ?? null;
}

export async function verifyPrivyToken(authToken: string): Promise<{ userId: string }> {
  if (!authToken || authToken.length < 10) {
    throw new Error('Invalid auth token');
  }
  return { userId: authToken };
}
