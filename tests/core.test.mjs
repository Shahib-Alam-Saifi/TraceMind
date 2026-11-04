import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, incidentText, formatEvidence, makePrompt } from '../src/lib/core.mjs';

test('sanitizes non-strings and trims input', () => {
  assert.equal(cleanText(null), '');
  assert.equal(cleanText('  stack trace  '), 'stack trace');
  assert.equal(cleanText('abcdefghijkl', 4), 'abcd');
});
test('retained incidents are labeled confirmed and contain fix', () => {
  const value = incidentText({ id:'abc', service:'web', error:'error', rootCause:'bad import', fix:'fix import' });
  assert.match(value, /Status: resolved and verified/);
  assert.match(value, /fix import/);
});
test('baseline prompt excludes memory', () => {
  const prompt = makePrompt({error:'oops',service:'web',memoryEnabled:false,memories:[{text:'SECRET_EVIDENCE'}]});
  assert.doesNotMatch(prompt, /SECRET_EVIDENCE/);
  assert.match(prompt, /disabled/);
});
test('memory prompt includes historical context with caution', () => {
  const prompt = makePrompt({error:'oops',service:'web',memoryEnabled:true,memories:[{text:'named import'}]});
  assert.match(prompt, /named import/);
  assert.match(prompt, /possibly irrelevant/);
  assert.match(prompt, /untrusted data/);
});
test('evidence formatting numbers items',()=>{
  assert.equal(formatEvidence([{text:'X'},{text:'Y'}]),'[Memory 1] X\n\n[Memory 2] Y');
});
