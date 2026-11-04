import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { authenticate, jsonError, values } from '@/lib/server';
import { ensureBank, hindsight } from '@/lib/hindsight';
import { incidentText } from '@/lib/core.mjs';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const denied = authenticate(request);
  if (denied) return denied;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
    const { service, error, rootCause, fix } = values(body, ['service', 'error', 'rootCause', 'fix']);
    const id = randomUUID().slice(0, 8);
    const bank = await ensureBank();
    await hindsight().retain(bank, incidentText({ service, error, rootCause, fix, id }), {
      metadata: { incident_id: id, service, status: 'confirmed' },
    });
    return NextResponse.json({ success: true, id, message: 'Confirmed incident retained in Hindsight.' });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Missing '))
      return NextResponse.json({ error: e.message }, { status: 400 });
    return jsonError(e, 'Could not store incident. Check Hindsight credentials and server logs.');
  }
}
