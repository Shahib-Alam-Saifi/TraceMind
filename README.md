# TraceMind

**An AI incident investigation assistant with persistent Hindsight memory.**

TraceMind is a Next.js/TypeScript project that analyzes production errors, recalls previous incidents using [Hindsight](https://github.com/vectorize-io/hindsight), and uses Groq for suggested diagnoses. It includes a memory-enabled versus baseline comparison and a flow for recording confirmed fixes.

## Getting started

The application source is currently being transferred into this repository. In the meantime, extract the supplied `TraceMind_Complete_Project.zip` archive and use its `tracemind/` folder.

```bash
npm install
cp .env.example .env.local
# Configure secrets in .env.local (never commit them)
npm test
npm run build
npm run dev
```

## Environment variables

See `.env.example` in the application package. Configure Hindsight base URL, API key, memory bank, and Groq API key as appropriate. Keep credentials server-side.

## Current verification

Five core unit tests were previously reported passing. A full Next.js production build and live end-to-end provider calls are **not yet verified**.

## Security

Never commit `.env.local`, `node_modules`, or secret API credentials.
