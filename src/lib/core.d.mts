export const MAX_INPUT: number;
export function cleanText(value: unknown, limit?: number): string;
export function incidentText(incident: {id:string; service:string; error:string; rootCause:string; fix:string}):string;
export function formatEvidence(items: Array<{text:string}>):string;
export function makePrompt(args: {error:string; service:string; memoryEnabled:boolean; memories:Array<{text:string}>}):string;
