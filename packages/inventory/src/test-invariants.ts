import { encryptPayload, decryptPayload, parseBulkInventory } from './index.js';
import { generateOrderNumber, generateDepositNumber } from '@telegram-store/shared';

const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

console.log('🧪 Running Verification Tests...');

// 1. AES-256-GCM Test
const secretAccount = {
  email: 'test_user@openai.com',
  password: 'SuperSecretPassword123!',
  activationUrl: 'https://license.provider.com/claim/abc123xyz',
};

const encrypted = encryptPayload(secretAccount, TEST_KEY);
console.log('Encrypted payload:', encrypted.slice(0, 40) + '...');
const decrypted = decryptPayload<typeof secretAccount>(encrypted, TEST_KEY);

if (
  decrypted.email === secretAccount.email &&
  decrypted.password === secretAccount.password &&
  decrypted.activationUrl === secretAccount.activationUrl
) {
  console.log('✅ AES-256-GCM Encryption / Decryption verified successfully.');
} else {
  console.error('❌ AES-256-GCM Failed:', decrypted);
  process.exit(1);
}

// 2. Bulk Inventory Parser & Duplicate Check Test
const bulkInput = `
user1@gmail.com|pass1
user2@gmail.com|pass2
user1@gmail.com|pass1
user3@gmail.com|pass3
invalid_line_without_delimiter
`;

const parseResult = parseBulkInventory(bulkInput, '|', undefined, true);
console.log('Parse result:', {
  total: parseResult.total,
  validCount: parseResult.validCount,
  duplicateCount: parseResult.duplicateCount,
  invalidCount: parseResult.invalidCount,
});

if (parseResult.validCount === 3 && parseResult.duplicateCount === 1 && parseResult.invalidCount === 1) {
  console.log('✅ Bulk inventory parsing and duplicate filtering verified successfully.');
} else {
  console.error('❌ Bulk parser mismatch:', parseResult);
  process.exit(1);
}

// 3. ID Generator Tests
const orderId = generateOrderNumber();
const depositId = generateDepositNumber();

console.log('Sample Generated IDs:', { orderId, depositId });

if (/^ORD-\d{4}-\d{6}$/.test(orderId) && /^DEP-\d{4}-\d{6}$/.test(depositId)) {
  console.log('✅ Human-friendly ID generators verified.');
} else {
  console.error('❌ ID format mismatch:', { orderId, depositId });
  process.exit(1);
}

console.log('🎉 All foundational invariants verified!');
