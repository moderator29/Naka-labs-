import { createThirdwebClient } from 'thirdweb';
import { inAppWallet, createWallet } from 'thirdweb/wallets';

export const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export const wallets = [
  inAppWallet({
    auth: {
      options: ['email', 'google', 'x', 'passkey'],
    },
  }),
  createWallet('io.metamask'),
  createWallet('com.trustwallet.app'),
  createWallet('com.coinbase.wallet'),
  createWallet('me.rainbow'),
  createWallet('com.exodus'),
  createWallet('walletConnect'),
];
