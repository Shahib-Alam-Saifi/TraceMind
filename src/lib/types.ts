export type Evidence = { text: string; id: string };
export type Analysis = {
  diagnosis: string;
  evidence: Evidence[];
  mode: 'memory' | 'baseline';
  engine: 'groq' | 'hindsight-reflect';
  elapsedMs: number;
  redactedCount?: number;
};
export type Incident = { id: string; service: string; error: string; rootCause: string; fix: string };
export type StoredMemoryItem = { id: string; text: string };
