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
    fix: [
      '--- /etc/nginx/conf.d/upstream.conf',
      '+++ /etc/nginx/conf.d/upstream.conf',
      '@@ -12,3 +12,3 @@',
      '- proxy_pass http://upstream_app:8080;',
      '+ proxy_pass http://upstream_app:3000;',
    ].join('\n'),
  },
  {
    service: 'frontend-web',
    error:
      'Error: Element type is invalid: expected a string or a class/function but got undefined. Check the render method of Navbar.',
    rootCause: 'Navbar was exported as default but imported using named import syntax.',
    fix: [
      '--- src/components/Header.tsx',
      '+++ src/components/Header.tsx',
      '@@ -3,1 +3,1 @@',
      '- import { Navbar } from "./Navbar";',
      '+ import Navbar from "./Navbar";',
    ].join('\n'),
  },
  {
    service: 'worker-queue',
    error:
      'RedisConnectionTimeout: Reached max retry limit of 10 while polling task queue after idle period.',
    rootCause:
      'Redis connection pool exhaustion caused by missing client.release() in async error handler.',
    fix: [
      '--- src/workers/consumer.ts',
      '+++ src/workers/consumer.ts',
      '@@ -24,3 +24,5 @@',
      '- const conn = await pool.acquire();',
      '- await processJob(conn, data);',
      '+ const conn = await pool.acquire();',
      '+ try { await processJob(conn, data); }',
      '+ finally { pool.release(conn); }',
    ].join('\n'),
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
        message: 'Retained 3 realistic enterprise incidents with code diffs into Hindsight memory bank.',
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
