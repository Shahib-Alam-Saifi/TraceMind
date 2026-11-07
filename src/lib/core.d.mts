export const MAX_INPUT: number;
export function cleanText(value: unknown, limit?: number): string;
export function redactSecrets(text: unknown): { text: string; count: number };
export function incidentText(incident: { id: string; service: string; error: string; rootCause: string; fix: string }): string;
export function formatEvidence(items: Array<{ text: string }>): string;
export function makePrompt(args: { error: string; service: string; memoryEnabled: boolean; memories: Array<{ text: string }> }): string;
export function generatePostMortem(args: {
  service: string;
  error: string;
  diagnosis: string;
  evidence?: Array<{ text: string }>;
  fix?: string;
  rootCause?: string;
}): string;
export function generateBandAIPrompt(args: {
  service: string;
  error: string;
  diagnosis: string;
  fix?: string;
}): string;
