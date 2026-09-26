export interface VerificationRequest {
  network: string; // 'USDT_BEP20' | 'USDT_TRC20' | 'TON'
  expectedDestinationAddress: string;
  transactionHash: string;
  minimumDepositUsd: number;
}

export interface VerificationResult {
  isValid: boolean;
  blockNumber?: number;
  confirmations?: number;
  actualAmount?: number;
  actualCurrency?: string;
  actualRecipient?: string;
  senderAddress?: string;
  failureReason?: string;
  rawDetails?: Record<string, unknown>;
}

export interface IPaymentVerifier {
  verifyTransaction(request: VerificationRequest): Promise<VerificationResult>;
  validateHashFormat(network: string, hash: string): boolean;
}

export class BlockchainPaymentVerifier implements IPaymentVerifier {
  validateHashFormat(network: string, hash: string): boolean {
    const cleaned = hash.trim();
    if (network.includes('BEP20') || network.includes('ERC20')) {
      // 0x followed by 64 hex chars
      return /^0x[a-fA-F0-9]{64}$/.test(cleaned);
    }
    if (network.includes('TRC20')) {
      // 64 hex chars
      return /^[a-fA-F0-9]{64}$/.test(cleaned);
    }
    if (network.includes('TON')) {
      // Base64 or 64 hex chars
      return cleaned.length >= 44;
    }
    return cleaned.length >= 10;
  }

  async verifyTransaction(request: VerificationRequest): Promise<VerificationResult> {
    const { network, expectedDestinationAddress, transactionHash, minimumDepositUsd } = request;

    if (!this.validateHashFormat(network, transactionHash)) {
      return {
        isValid: false,
        failureReason: `Invalid transaction hash format for ${network}`,
      };
    }

    // In development/test mode or if simulation hash is provided:
    if (process.env.NODE_ENV !== 'production' && transactionHash.startsWith('0xTEST_')) {
      const match = transactionHash.match(/_([0-9.]+)/);
      const simulatedAmount = match ? parseFloat(match[1]!) : 10.0;
      return {
        isValid: true,
        actualAmount: simulatedAmount,
        actualCurrency: 'USDT',
        actualRecipient: expectedDestinationAddress,
        blockNumber: 1234567,
        confirmations: 12,
        rawDetails: { simulated: true, network },
      };
    }

    // Production verifier interface hooks:
    // Future plugins for BscScan / TronGrid / TonCenter API
    return {
      isValid: false,
      failureReason: 'Transaction pending blockchain indexing or verification worker queue.',
      rawDetails: { network, transactionHash },
    };
  }
}
