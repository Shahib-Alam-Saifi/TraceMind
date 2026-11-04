# TraceMind — Submission Preparation

This file is a preparation guide. Do **not** publish claims of live performance until you have verified the application using real credentials.

## Checklist from the supplied event guides

- [ ] Publicly readable, clean GitHub repository
- [ ] Live working project shown to judges
- [ ] 2–5 minute 1080p YouTube demo of real retain/recall
- [ ] Clearly explain how Hindsight is central to the agent
- [ ] Each team member publishes their own technical article (guide: 800–1,500 words)
- [ ] Each team member publishes their own short LinkedIn post (<800 characters)
- [ ] Share article on an indicated Reddit community
- [ ] Install and use Band AI Desktop (explicit event requirement)
- [ ] Ensure the article and social posts **do not use the word disallowed by the content guide** (including hashtags)
- [ ] Verify whether the event requires individual videos in addition to one team video; the two supplied guides are inconsistent

## 3-minute video narrative

**0:00–0:25 — Hook:** An engineer encounters the same production error months later. Normally, last time's fix lives in someone's memory or an old ticket.

**0:25–0:45 — Problem:** Show an error in TraceMind with memory disabled. Explain that it can only propose a generic debugging path (avoid claiming a comparison improvement until verified).

**0:45–1:35 — Retain:** Record a realistic incident with root cause and verified fix. Show Hindsight Cloud / API accepting the memory. Discuss why only confirmed resolutions are retained.

**1:35–2:30 — Recall:** Paste a similar incident in a fresh session, enable memory, and run diagnosis. Show the actual recalled memory in the evidence panel and the recommendation grounded in that context. If no memory appears, fix the integration before recording.

**2:30–3:00 — Wrap:** Show the architecture and state the tested difference between baseline and historical recall. Mention one limitation (irrelevant memories can mislead an agent).

## Article structure (1200–1500 words after verification)

Suggested working title: **The Debugging Fix I Almost Lost—Until Hindsight Remembered**

1. Open with a concrete engineering error (150 words).
2. Explain why conventional model-only troubleshooting loses context (150).
3. Describe TraceMind system architecture and actual files `src/lib/hindsight.ts`, `src/app/api/incident/route.ts`, `src/app/api/analyze/route.ts` (300).
4. Explain retain vs recall vs reflect with 2–4 real code snippets and screenshots (300).
5. Share **actual** baseline-vs-memory tests, including failures, latency and uncertainty; do not invent benchmarks (250).
6. End with 3–5 honest lessons learned (150).

Embed:
- Hindsight GitHub: https://github.com/vectorize-io/hindsight
- Docs: https://hindsight.vectorize.io/
- Agent memory explanation: https://vectorize.io/what-is-agent-memory

### Draft LinkedIn post — customize after testing

> Debugging gets expensive when yesterday's fix disappears into old tickets.
>
> I built TraceMind to connect incident investigation to persistent agent memory.
>
> The approach:
> - Store only developer-confirmed fixes.
> - Recall similar incidents with Hindsight.
> - Show evidence separately from AI suggestions.
> - Compare diagnosis with and without memory.
>
> My biggest lesson: retrieved history isn't automatically correct; context still needs verification.
>
> GitHub: [ADD YOUR REAL REPOSITORY URL]
> Article: [ADD PUBLIC ARTICLE URL]
>
> #AIAgents #Hindsight #AgentMemory #DevOps

Post your article URL and Hindsight repository URL in the comments as instructed in the supplied guide. Review for length after inserting URLs.

## Example evaluation sheet

Use the *same Groq model*, same temperature and same errors for baseline vs memory. Track:

| Scenario | Root cause | Baseline correct? | Memory correct? | Relevant memory recalled? | Latency difference |
|---|---|---|---|---|---|
| React import mismatch | confirmed | [test] | [test] | [test] | [measure] |
| Gateway wrong upstream port | confirmed | [test] | [test] | [test] | [measure] |
| Queue stale connection | confirmed | [test] | [test] | [test] | [measure] |
| Similar symptoms, different cause | confirmed | [test] | [test] | [test] | [measure] |

**Do not manufacture performance metrics.** A convincing demo uses real evidence and admits failure cases.
