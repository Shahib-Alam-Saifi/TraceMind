import { NextResponse } from 'next/server';
export async function GET() {
  return NextResponse.json({
    hindsightConfigured: Boolean(process.env.HINDSIGHT_BASE_URL && (process.env.HINDSIGHT_API_KEY || !process.env.HINDSIGHT_BASE_URL.includes('api.hindsight.vectorize.io'))),
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
    protected: Boolean(process.env.TRACEMIND_ACCESS_KEY),
  });
}
