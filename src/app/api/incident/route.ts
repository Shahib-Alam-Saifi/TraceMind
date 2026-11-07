import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { authenticate, jsonError, values } from '@/lib/server';
import { ensureBank, hindsight } from '@/lib/hindsight';
import { incidentText, redactSecrets } from '@/lib/core.mjs';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const denied = authenticate(request);
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'TRACE MIND CONFIRMED INCIDENT';
    const bank = await ensureBank();
    const recalled = await hindsight().recall(bank, query);
    const incidents = (recalled?.results ?? []).map((r, i) => ({
      id: String(i + 1),
      text: r.text,
    }));
    return NextResponse.json({ success: true, count: incidents.length, incidents });
  } catch (e) {
    return jsonError(e, 'Could not query incidents from Hindsight memory bank.');
  }
}

export async function POST(request: Request) {
  const denied = authenticate(request);
  if (denied) return denied;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
    const { service, error: rawError, rootCause: rawRootCause, fix: rawFix } = values(body, [
      'service',
      'error',
      'rootCause',
      'fix',
    ]);

    // Redact secrets before permanent storage
    const error = redactSecrets(rawError).text;
    const rootCause = redactSecrets(rawRootCause).text;
    const fix = redactSecrets(rawFix).text;

    const id = randomUUID().slice(0, 8);
    const bank = await ensureBank();
    await hindsight().retain(bank, incidentText({ service, error, rootCause, fix, id }), {
      metadata: { incident_id: id, service, status: 'confirmed' },
    });
    return NextResponse.json({
      success: true,
      id,
      message: 'Confirmed incident successfully retained in persistent Hindsight memory.',
    });
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Missing '))
      return NextResponse.json({ error: e.message }, { status: 400 });
    return jsonError(e, 'Could not store incident. Check Hindsight credentials and server logs.');
  }
}
