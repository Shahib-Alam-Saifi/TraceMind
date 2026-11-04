import { NextResponse } from 'next/server';
import { cleanText } from './core.mjs';
export function jsonError(error: unknown, fallback = 'Request failed') {
  console.error('[tracemind]', error);
  return NextResponse.json({ error: fallback }, { status: 502 });
}
export function authenticate(request: Request) {
  const key = process.env.TRACEMIND_ACCESS_KEY;
  if (!key) return null;
  return request.headers.get('x-tracemind-key') === key
    ? null : NextResponse.json({ error: 'Access key required' }, { status: 401 });
}
export function values(body: Record<string, unknown>, keys: string[]) {
  const results: Record<string, string> = {};
  for (const key of keys) {
    const value = cleanText(body[key]);
    if (!value) throw new Error(`Missing ${key}`);
    results[key] = value;
  }
  return results;
}
