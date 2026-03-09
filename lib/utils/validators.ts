import { isAddress } from 'ethers';

export function isEVMAddress(address: string): boolean {
  try {
    return isAddress(address);
  } catch {
    return false;
  }
}

export function isSolanaAddress(address: string): boolean {
  // Solana addresses are base58, 32-44 chars
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function detectAddressChain(address: string): 'EVM' | 'SOLANA' | null {
  if (isEVMAddress(address)) return 'EVM';
  if (isSolanaAddress(address)) return 'SOLANA';
  return null;
}

export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

export function isContractAddress(bytecode: string): boolean {
  return bytecode !== '0x' && bytecode.length > 2;
}
