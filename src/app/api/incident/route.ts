import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { authenticate, jsonError, values } from '@/lib/server';
import { ensureBank, hindsight } from '@/lib/hindsight';
import { incidentText, redactSecrets } from '@/lib/core.mjs';

export const runtime = 'nodejs';

const DEMO_SEED_INCIDENTS = [
  {
    service: 'api-gateway',
    error: 'HTTP 502 Bad Gateway: Upstream connection refused on port 8080 during traffic spike.',
    rootCause:
      'Application container was listening on port 3000 while reverse proxy upstream.conf routed traffic to port 8080.',
    fix: 'Aligned PORT environment variable and reverse proxy upstream.conf to port 3000; health check returned 200 OK.',
  },
  {
    service: 'payment-service',
    error: 'StripeWebhookError: Webhook signature verification failed on endpoint /api/webhooks/stripe.',
    rootCause:
      'Webhook endpoint used raw body parsing after global express.json() middleware had already consumed the incoming byte stream.',
    fix: 'Mounted express.raw() specifically on the webhook route before global body parsing middleware.',
  },
  {
    service: 'worker-queue',
    error: 'RedisConnectionTimeout: Reached max retry limit of 10 while polling task queue after idle period.',
    rootCause:
      'Redis connection pool exhaustion caused by missing client.release() in async error handler.',
    fix: 'Wrapped worker task execution in try...finally block ensuring client connection is always released back to pool.',
  },
];

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

    // Check if this is a request to seed demo incidents
    if (body.action === 'seed') {
      const bank = await ensureBank();
      const seededIds: string[] = [];
      for (const item of DEMO_SEED_INCIDENTS) {
        const id = randomUUID().slice(0, 8);
        await hindsight().retain(
          bank,
          incidentText({
            service: item.service,
            error: item.error,
            rootCause: item.rootCause,
            fix: item.fix,
            id,
          }),
          {
            metadata: { incident_id: id, service: item.service, status: 'confirmed' },
          }
        );
        seededIds.push(id);
      }
      return NextResponse.json({
        success: true,
        seededCount: seededIds.length,
        seededIds,
        message: 'Retained 3 realistic enterprise incidents into Hindsight memory bank.',
      });
    }

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
