const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`;
const HELIUS_BACKUP_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY_BACKUP}`;

async function heliusPost(method: string, params: unknown[], useBackup = false): Promise<unknown> {
  const url = useBackup ? HELIUS_BACKUP_URL : HELIUS_URL;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  if (!res.ok && !useBackup) {
    return heliusPost(method, params, true);
  }

  const data = await res.json();
  return data.result;
}

export async function getSolanaBalance(address: string): Promise<number> {
  const result = await heliusPost('getBalance', [address]) as { value: number };
  return (result?.value ?? 0) / 1e9;
}

export async function getSolanaTokenAccounts(walletAddress: string) {
  return heliusPost('getTokenAccountsByOwner', [
    walletAddress,
    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    { encoding: 'jsonParsed' },
  ]);
}

export async function getSolanaTransactions(address: string, limit = 50) {
  const signatures = await heliusPost('getSignaturesForAddress', [address, { limit }]) as { signature: string }[];
  if (!signatures || !Array.isArray(signatures)) return [];

  const txs = await heliusPost('getTransactions', [
    signatures.slice(0, 20).map((s) => s.signature),
  ]);
  return txs;
}

export async function getTokenMetadataBatch(mintAddresses: string[]) {
  const res = await fetch(`https://api.helius.xyz/v0/token-metadata?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mintAccounts: mintAddresses, includeOffChain: true }),
  });
  return res.json();
}

export async function getEnrichedTransactions(address: string, type?: string) {
  const params: Record<string, unknown> = { account: address, limit: 100 };
  if (type) params.type = type;

  const res = await fetch(
    `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
    { next: { revalidate: 60 } }
  );
  return res.json();
}
