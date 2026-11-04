import { HindsightClient } from '@vectorize-io/hindsight-client';

let instance: HindsightClient | null = null;
const initialized = new Set<string>();
export function bankId() {
  return process.env.HINDSIGHT_BANK_ID || 'tracemind-local-demo';
}
export function hindsight() {
  const baseUrl = process.env.HINDSIGHT_BASE_URL;
  if (!baseUrl) throw new Error('HINDSIGHT_BASE_URL missing');
  if (baseUrl.startsWith('https://api.hindsight.vectorize.io') && !process.env.HINDSIGHT_API_KEY)
    throw new Error('HINDSIGHT_API_KEY missing for Hindsight Cloud');
  if (!instance) instance = new HindsightClient({ baseUrl, apiKey: process.env.HINDSIGHT_API_KEY || undefined });
  return instance;
}
export async function ensureBank() {
  const bank = bankId();
  if (initialized.has(bank)) return bank;
  const client = hindsight();
  // If the bank already exists, createBank may report a conflict. We only suppress
  // a documented conflict-style error, not authentication or network failures.
  try {
    await client.createBank(bank, { name: 'TraceMind incidents' });
  } catch (e) {
    const message = String(e).toLowerCase();
    if (!message.includes('409') && !message.includes('already exists') && !message.includes('conflict')) throw e;
  }
  initialized.add(bank);
  return bank;
}
