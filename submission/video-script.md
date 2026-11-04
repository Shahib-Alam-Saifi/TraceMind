# TraceMind — 3-minute team demo script

This is a script to adapt **only after the real memory operations work**. Record real application screens. Do not simulate a success response.

## 0:00–0:25 — Introduce the problem
**Screen:** TraceMind home screen, then a sample error.

"Debugging the same problem twice is expensive. An engineer may have already solved a similar issue, but that resolution is buried in old tickets or someone's memory. We built TraceMind to help software teams preserve those lessons and recall them during future investigations."

## 0:25–0:45 — Show baseline
**Screen:** Turn Hindsight memory OFF, keep Groq configured, click Analyze.

"With historical memory turned off, this agent only sees the current incident. It can suggest possible causes, but it cannot cite the fixes that worked in our own environment."

## 0:45–1:35 — Save verified resolution
**Screen:** Open Record resolved incident, paste sample error and verified fix, save. Show success response or Hindsight dashboard.

"Now we record an incident after its fix has been verified. We store the service, error, root cause, and working resolution through Hindsight's retain operation. We deliberately do not auto-save generated guesses."

## 1:35–2:30 — Prove recall
**Screen:** Refresh to demonstrate a separate session. Paste similar error, turn Hindsight ON, run Analyze; show returned memory record and diagnosis.

"For the next incident, TraceMind recalls relevant historical cases from the persistent Hindsight bank. The UI displays that evidence separately from the AI's recommendation. We can now check whether the previous fix applies to this incident, rather than blindly trying it."

## 2:30–3:00 — Conclude
**Screen:** Show the UI's evidence panel and your project README architecture.

"The key idea is that persistent memory should preserve verified engineering outcomes. A retrieved match is evidence, not proof. Next we'll test this with more diverse incidents and measure whether it improves diagnosis quality."

**Recording checklist:** 1080p, 2–5 minutes, clear narration, cursor zoom if needed, no exposed tokens, GitHub and article URLs in YouTube description, public upload.
