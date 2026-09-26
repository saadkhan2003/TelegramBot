import { customAlphabet } from 'nanoid';

const numbersOnly = customAlphabet('0123456789', 6);

export function generateOrderNumber(year = new Date().getFullYear()): string {
  return `ORD-${year}-${numbersOnly()}`;
}

export function generateDepositNumber(year = new Date().getFullYear()): string {
  return `DEP-${year}-${numbersOnly()}`;
}

export function generateTicketNumber(year = new Date().getFullYear()): string {
  return `TKT-${year}-${numbersOnly()}`;
}

export function generateWarrantyNumber(year = new Date().getFullYear()): string {
  return `WAR-${year}-${numbersOnly()}`;
}
