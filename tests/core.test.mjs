import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanText,
  incidentText,
  formatEvidence,
  makePrompt,
  redactSecrets,
  generatePostMortem,
} from '../src/lib/core.mjs';

test('sanitizes non-strings and trims input', () => {
  assert.equal(cleanText(null), '');
  assert.equal(cleanText('  stack trace  '), 'stack trace');
  assert.equal(cleanText('abcdefghijkl', 4), 'abcd');
});

test('retained incidents are labeled confirmed and contain fix', () => {
  const value = incidentText({
    id: 'abc',
    service: 'web',
    error: 'error',
    rootCause: 'bad import',
    fix: 'fix import',
  });
  assert.match(value, /Status: resolved and verified/);
  assert.match(value, /fix import/);
});

test('baseline prompt excludes memory', () => {
  const prompt = makePrompt({
    error: 'oops',
    service: 'web',
    memoryEnabled: false,
    memories: [{ text: 'SECRET_EVIDENCE' }],
  });
  assert.doesNotMatch(prompt, /SECRET_EVIDENCE/);
  assert.match(prompt, /disabled/);
});

test('memory prompt includes historical context with caution', () => {
  const prompt = makePrompt({
    error: 'oops',
    service: 'web',
    memoryEnabled: true,
    memories: [{ text: 'named import' }],
  });
  assert.match(prompt, /named import/);
  assert.match(prompt, /possibly irrelevant/);
  assert.match(prompt, /untrusted data/);
});

test('evidence formatting numbers items', () => {
  assert.equal(formatEvidence([{ text: 'X' }, { text: 'Y' }]), '[Memory 1] X\n\n[Memory 2] Y');
});

test('redacts bearer tokens and jwt tokens', () => {
  const log =
    'Failed request: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisToken';
  const { text, count } = redactSecrets(log);
  assert.ok(count >= 1);
  assert.doesNotMatch(text, /doNotLeakThisToken/);
  assert.match(text, /REDACTED/);
});

test('redacts database credentials in connection strings', () => {
  const log = 'Connection failed: postgres://admin:superSecretP@ss123@db.prod.internal:5432/maindb';
  const { text, count } = redactSecrets(log);
  assert.ok(count >= 1);
  assert.doesNotMatch(text, /superSecretP@ss123/);
  assert.match(text, /postgres:\/\/\[USER\]:\[REDACTED\]@\[HOST\]\/\[DB\]/);
});

test('redacts api keys and passwords', () => {
  const log = 'Config: api_key: "sk-live-998877665544332211" password: "superSecretPassword"';
  const { text, count } = redactSecrets(log);
  assert.ok(count >= 2);
  assert.doesNotMatch(text, /sk-live-998877665544332211/);
  assert.doesNotMatch(text, /superSecretPassword/);
});

test('generates structured post-mortem report', () => {
  const report = generatePostMortem({
    service: 'payment-service',
    error: 'Timeout connecting to bank gateway',
    diagnosis: 'Likely network partition',
    evidence: [{ text: 'Memory 1: Gateway port 443 misconfigured' }],
    rootCause: 'Firewall egress rule dropped traffic',
    fix: 'Whitelisted CIDR block',
  });
  assert.match(report, /Incident Post-Mortem Report/);
  assert.match(report, /payment-service/);
  assert.match(report, /Likely network partition/);
  assert.match(report, /Gateway port 443 misconfigured/);
  assert.match(report, /Whitelisted CIDR block/);
});
