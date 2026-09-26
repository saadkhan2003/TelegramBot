export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_DISABLED: 'PRODUCT_DISABLED',
  DUPLICATE_TXID: 'DUPLICATE_TXID',
  INVALID_TXID: 'INVALID_TXID',
  USER_FROZEN: 'USER_FROZEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
