import { Alchemy, Network, AssetTransfersCategory } from 'alchemy-sdk';

const NETWORK_MAP: Record<string, Network> = {
  ETHEREUM: Network.ETH_MAINNET,
  BASE: Network.BASE_MAINNET,
  ARBITRUM: Network.ARB_MAINNET,
  POLYGON: Network.MATIC_MAINNET,
  OPTIMISM: Network.OPT_MAINNET,
};

const clients: Record<string, Alchemy> = {};

function getClient(chain: string): Alchemy {
  if (!clients[chain]) {
    const network = NETWORK_MAP[chain] ?? Network.ETH_MAINNET;
    clients[chain] = new Alchemy({
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      network,
    });
  }
  return clients[chain];
}

export async function getTokenBalances(walletAddress: string, chain = 'ETHEREUM') {
  const alchemy = getClient(chain);
  return alchemy.core.getTokenBalances(walletAddress);
}

export async function getTokenMetadata(tokenAddress: string, chain = 'ETHEREUM') {
  const alchemy = getClient(chain);
  return alchemy.core.getTokenMetadata(tokenAddress);
}

export async function getNFTsForOwner(walletAddress: string, chain = 'ETHEREUM') {
  const alchemy = getClient(chain);
  return alchemy.nft.getNftsForOwner(walletAddress);
}

export async function getEthBalance(walletAddress: string, chain = 'ETHEREUM'): Promise<string> {
  const alchemy = getClient(chain);
  const balance = await alchemy.core.getBalance(walletAddress);
  return balance.toString();
}

export async function getTransactionHistory(walletAddress: string, chain = 'ETHEREUM') {
  const alchemy = getClient(chain);
  const [sent, received] = await Promise.all([
    alchemy.core.getAssetTransfers({
      fromAddress: walletAddress,
      category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20, AssetTransfersCategory.ERC721],
      maxCount: 100,
    }),
    alchemy.core.getAssetTransfers({
      toAddress: walletAddress,
      category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20, AssetTransfersCategory.ERC721],
      maxCount: 100,
    }),
  ]);
  return { sent: sent.transfers, received: received.transfers };
}

export async function isContract(address: string, chain = 'ETHEREUM'): Promise<boolean> {
  const alchemy = getClient(chain);
  const code = await alchemy.core.getCode(address);
  return code !== '0x' && code.length > 2;
}

export async function getPortfolioTokens(walletAddress: string, chain = 'ETHEREUM') {
  const alchemy = getClient(chain);

  const [balances, ethBalance] = await Promise.all([
    alchemy.core.getTokenBalances(walletAddress),
    alchemy.core.getBalance(walletAddress),
  ]);

  const nonZeroBalances = balances.tokenBalances.filter(
    (token) => token.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000'
  );

  return { tokens: nonZeroBalances, ethBalance: ethBalance.toString() };
}
