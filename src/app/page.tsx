'use client';
import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  Copy,
  Database,
  Download,
  Fingerprint,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  SplitSquareVertical,
  TerminalSquare,
  WandSparkles,
  X,
} from 'lucide-react';
import type { Analysis, StoredMemoryItem } from '@/lib/types';
import { generatePostMortem } from '@/lib/core.mjs';

type Status = {
  hindsightConfigured: boolean;
  groqConfigured: boolean;
  protected: boolean;
  model?: string;
  bankId?: string;
};

const examples = [
  {
    service: 'frontend-web',
    error: 'Error: Element type is invalid: expected a string or a class/function but got undefined. Check the render method of Navbar.',
    rootCause: 'Navbar was exported as default but imported using named import syntax.',
    fix: 'Changed import { Navbar } from "./Navbar" to import Navbar from "./Navbar" and verified build passed.',
  },
  {
    service: 'api-gateway',
    error: 'HTTP 502 after deployment: upstream connection refused on port 8080.',
    rootCause: 'Application listened on port 3000 while the reverse proxy sent traffic to port 8080.',
    fix: 'Aligned PORT configuration and reverse proxy upstream; health check became healthy.',
  },
  {
    service: 'worker-queue',
    error: 'Queue consumer repeatedly retries with ECONNRESET after idle period.',
    rootCause: 'Stale connections were reused after the load balancer idle timeout.',
    fix: 'Enabled connection keepalive and reconnection handling; re-ran worker integration test.',
  },
];

function badge(text: string, tone = '') {
  return (
    <span className={'badge ' + tone}>
      <span className="status-dot" />
      {text}
    </span>
  );
}

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);
  const [access, setAccess] = useState('');
  const [service, setService] = useState('frontend-web');
  const [error, setError] = useState(examples[0].error);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [baselineAnalysis, setBaselineAnalysis] = useState<Analysis | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [active, setActive] = useState<'investigate' | 'memory' | 'guide'>('investigate');
  const [showModal, setShowModal] = useState(false);
  const [confirmed, setConfirmed] = useState({
    service: 'frontend-web',
    error: examples[0].error,
    rootCause: '',
    fix: '',
  });
  const [savedCount, setSavedCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tracemind_saved_count');
        return saved ? parseInt(saved, 10) || 0 : 0;
      } catch {
        return 0;
      }
    }
    return 0;
  });
  const [mobileNav, setMobileNav] = useState(false);
  const [storedMemories, setStoredMemories] = useState<StoredMemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMemories, setLoadingMemories] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(access ? { 'x-tracemind-key': access } : {}),
  };

  async function fetchStoredMemories() {
    setLoadingMemories(true);
    try {
      const r = await fetch('/api/incident', { headers: requestHeaders });
      const json = await r.json();
      if (r.ok && json.incidents) {
        setStoredMemories(json.incidents);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingMemories(false);
    }
  }

  async function analyze() {
    setBusy(true);
    setMessage('');
    setAnalysis(null);
    setBaselineAnalysis(null);

    try {
      if (compareMode) {
        // Run both memory-enabled and baseline in parallel for side-by-side comparison
        const [memRes, baseRes] = await Promise.all([
          fetch('/api/analyze', {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({ service, error, memoryEnabled: true }),
          }),
          fetch('/api/analyze', {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({ service, error, memoryEnabled: false }),
          }),
        ]);

        const memJson = await memRes.json();
        const baseJson = await baseRes.json();

        if (!memRes.ok) throw new Error(memJson.error || 'Memory analysis failed');
        if (!baseRes.ok) throw new Error(baseJson.error || 'Baseline analysis failed');

        setAnalysis(memJson);
        setBaselineAnalysis(baseJson);
      } else {
        const r = await fetch('/api/analyze', {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({ service, error, memoryEnabled }),
        });
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || 'Analysis failed');
        setAnalysis(json);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }

  async function saveIncident(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch('/api/incident', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(confirmed),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Save failed');
      const newCount = savedCount + 1;
      setSavedCount(newCount);
      try {
        localStorage.setItem('tracemind_saved_count', String(newCount));
      } catch {}
      setMessage(`Incident #${json.id} successfully retained in persistent Hindsight memory.`);
      setShowModal(false);
      if (active === 'memory') fetchStoredMemories();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  function loadExample(i: number) {
    setService(examples[i].service);
    setError(examples[i].error);
    setAnalysis(null);
    setBaselineAnalysis(null);
    setMessage('');
    setActive('investigate');
  }

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setMessage(`${label} copied to clipboard.`);
  }

  function exportPostMortem() {
    if (!analysis) return;
    const report = generatePostMortem({
      service,
      error,
      diagnosis: analysis.diagnosis,
      evidence: analysis.evidence,
      rootCause: confirmed.rootCause,
      fix: confirmed.fix,
    });
    copyText(report, 'Full Post-Mortem Markdown Report');
  }

  function exportBandAIJson() {
    const payload = {
      project: 'TraceMind',
      timestamp: new Date().toISOString(),
      service,
      error,
      memories: storedMemories,
      format: 'Band-AI-Desktop-v1',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracemind-incident-${service}-${Date.now()}.json`;
    a.click();
    setMessage('Exported incident bundle for Band AI Desktop.');
  }

  const filteredMemories = storedMemories.filter((m) =>
    m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (mobileNav ? 'open' : '')}>
        <div className="brand">
          <div className="brand-symbol">
            <BrainCircuit size={23} />
          </div>
          <div>
            <strong>TraceMind</strong>
            <small>INCIDENT INTELLIGENCE</small>
          </div>
        </div>

        <div className="side-group-label">WORKSPACE</div>
        <button
          className={'side-nav ' + (active === 'investigate' ? 'selected' : '')}
          onClick={() => {
            setActive('investigate');
            setMobileNav(false);
          }}
        >
          <LayoutDashboard size={17} /> Investigation <ChevronRight size={14} />
        </button>
        <button
          className={'side-nav ' + (active === 'memory' ? 'selected' : '')}
          onClick={() => {
            setActive('memory');
            setMobileNav(false);
            fetchStoredMemories();
          }}
        >
          <Database size={17} /> Memory Bank
        </button>
        <button
          className={'side-nav ' + (active === 'guide' ? 'selected' : '')}
          onClick={() => {
            setActive('guide');
            setMobileNav(false);
          }}
        >
          <Code2 size={17} /> Getting Started
        </button>

        <div className="side-group-label spaced">QUICK EXAMPLES</div>
        {examples.map((item, i) => (
          <button key={i} className="example-nav" onClick={() => loadExample(i)}>
            <span className="example-icon">
              <TerminalSquare size={14} />
            </span>
            <span>
              {['React component crash', 'Gateway deployment 502', 'Worker connection retry'][i]}
            </span>
          </button>
        ))}

        <div className="side-bottom">
          <div className="side-help">
            <div className="accent-icon">
              <ShieldCheck size={19} />
            </div>
            <strong>Developer-Verified Memory</strong>
            <p>Retains fixes only when confirmed by an engineer. AI guesses are never auto-saved.</p>
          </div>
          <div className="side-foot">
            <span className="online-dot" /> TraceMind v1.1 <span>·</span> Hindsight
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)}>
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            Workspace <ChevronRight size={13} />{' '}
            <strong>
              {active === 'investigate'
                ? 'Investigation'
                : active === 'memory'
                ? 'Memory Bank'
                : 'Getting Started'}
            </strong>
          </div>
          <div className="top-actions">
            {status?.hindsightConfigured
              ? badge('Hindsight Connected', 'good')
              : badge('Setup Needed', 'warn')}
            <div className="avatar">TM</div>
          </div>
        </header>

        <div className="content">
          {active === 'investigate' && (
            <>
              <section className="hero">
                <div>
                  <div className="eyebrow">
                    <span className="sparkle-dot" /> PERSISTENT ENGINEERING INTELLIGENCE
                  </div>
                  <h1>
                    Investigate faster.
                    <br />
                    <em>Remember every fix.</em>
                  </h1>
                  <p>
                    Turn recurring production issues into institutional knowledge. Retrieve past
                    tested solutions before spending hours reinventing the wheel.
                  </p>
                  <div className="btn-group">
                    <button
                      className="primary"
                      onClick={() => {
                        setConfirmed({ service, error, rootCause: '', fix: '' });
                        setShowModal(true);
                      }}
                    >
                      <Plus size={17} /> Record resolved incident
                    </button>
                    <button className="outline" onClick={exportBandAIJson}>
                      <Download size={15} /> Band AI Export
                    </button>
                  </div>
                </div>
                <div className="hero-graphic">
                  <div className="hero-orbit orbit-one" />
                  <div className="hero-orbit orbit-two" />
                  <div className="center-brain">
                    <BrainCircuit size={55} strokeWidth={1.35} />
                  </div>
                  <div className="floating-mini one">
                    <Database size={15} /> RETAIN
                  </div>
                  <div className="floating-mini two">
                    <Search size={15} /> RECALL
                  </div>
                  <div className="floating-mini three">
                    <Sparkles size={15} /> REASON
                  </div>
                </div>
              </section>

              <div className="stat-grid">
                <div className="stat">
                  <span className="stat-heading">
                    <Database size={15} /> Confirmed in this session
                  </span>
                  <strong>{savedCount.toString().padStart(2, '0')}</strong>
                  <small>Stored verified incidents</small>
                </div>
                <div className="stat">
                  <span className="stat-heading">
                    <BrainCircuit size={15} /> Hindsight Memory Bank
                  </span>
                  <strong>{status?.hindsightConfigured ? 'Connected' : 'Not Set'}</strong>
                  <small>{status?.bankId || 'tracemind-local-demo'}</small>
                </div>
                <div className="stat">
                  <span className="stat-heading">
                    <Activity size={15} /> AI Reasoning Model
                  </span>
                  <strong>{status?.groqConfigured ? 'Groq' : 'Reflect'}</strong>
                  <small>{status?.model || 'llama-3.3-70b-versatile'}</small>
                </div>
              </div>

              <div className="workspace-head">
                <div>
                  <h2>Incident Investigation Workspace</h2>
                  <p>Diagnose errors with or without persistent historical incident knowledge.</p>
                </div>
                <div className="btn-group">
                  <button
                    className={'outline ' + (compareMode ? 'selected' : '')}
                    onClick={() => setCompareMode(!compareMode)}
                  >
                    <SplitSquareVertical size={16} />{' '}
                    {compareMode ? 'Dual Mode Active' : 'Compare Baseline vs Memory'}
                  </button>
                  <button
                    className="outline"
                    onClick={() =>
                      loadExample(
                        (examples.findIndex((v) => v.error === error) + 1) % examples.length
                      )
                    }
                  >
                    <WandSparkles size={16} /> Load example
                  </button>
                </div>
              </div>

              <div className="work-grid">
                <section className="panel input-panel">
                  <div className="panel-head">
                    <span className="panel-title">
                      <TerminalSquare size={18} /> New investigation
                    </span>
                    <span className="panel-tag">INPUT</span>
                  </div>
                  <div className="field">
                    <label htmlFor="service">Affected service</label>
                    <div className="input-icon">
                      <Server size={16} />
                      <input
                        id="service"
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        maxLength={120}
                        placeholder="service-name"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="error">Error / stack trace</label>
                    <textarea
                      id="error"
                      value={error}
                      onChange={(e) => setError(e.target.value)}
                      rows={9}
                      maxLength={6000}
                      placeholder="Paste an error log, stack trace, or incident summary..."
                    />
                    <small>
                      🛡️ TraceMind automatically sanitizes API keys, JWTs, and database credentials
                      before analysis.
                    </small>
                  </div>

                  {!compareMode && (
                    <div className="memory-toggle">
                      <div>
                        <strong>
                          <BrainCircuit size={16} /> Hindsight memory
                        </strong>
                        <span>Include past confirmed fixes in the investigation</span>
                      </div>
                      <button
                        type="button"
                        className={'switch ' + (memoryEnabled ? 'on' : '')}
                        role="switch"
                        aria-checked={memoryEnabled}
                        onClick={() => setMemoryEnabled(!memoryEnabled)}
                      >
                        <span />
                      </button>
                    </div>
                  )}

                  <button
                    className="primary wide"
                    onClick={analyze}
                    disabled={busy || !error.trim() || !service.trim()}
                  >
                    {busy ? <span className="spinner" /> : <Sparkles size={17} />}
                    {busy
                      ? 'Investigating...'
                      : compareMode
                      ? 'Run Dual Comparison'
                      : 'Analyze incident'}
                    <ArrowRight size={16} />
                  </button>
                </section>

                <section className="panel output-panel">
                  <div className="panel-head">
                    <span className="panel-title">
                      <BrainCircuit size={18} /> Investigation results
                    </span>
                    {analysis && <span className="panel-tag">{analysis.elapsedMs} MS</span>}
                  </div>

                  {!analysis ? (
                    <div className="empty-state">
                      <div className="empty-orb">
                        <Fingerprint size={33} />
                      </div>
                      <h3>Ready to investigate</h3>
                      <p>
                        Paste an error stack on the left. TraceMind will retrieve verified fixes from
                        Hindsight and guide your investigation.
                      </p>
                      <div className="empty-steps">
                        <span>
                          <span className="step-circle">1</span> Add error
                        </span>
                        <span>
                          <span className="step-circle">2</span> Recall evidence
                        </span>
                        <span>
                          <span className="step-circle">3</span> Analyze
                        </span>
                      </div>
                    </div>
                  ) : compareMode && baselineAnalysis ? (
                    <div className="result">
                      <div className="dual-pane">
                        <div className="evidence">
                          <div className="result-meta">
                            {badge('Without Memory (Baseline)', 'warn')}
                            <span>
                              <Clock3 size={14} /> {baselineAnalysis.elapsedMs} ms
                            </span>
                          </div>
                          <h3>Baseline Diagnosis</h3>
                          <div className="diagnosis">{baselineAnalysis.diagnosis}</div>
                        </div>

                        <div className="evidence">
                          <div className="result-meta">
                            {badge('With Hindsight Memory', 'good')}
                            <span>
                              <Clock3 size={14} /> {analysis.elapsedMs} ms
                            </span>
                          </div>
                          <h3>Memory-Grounded Diagnosis</h3>
                          <div className="diagnosis">{analysis.diagnosis}</div>
                          <div className="evidence-head">
                            <h3>Recalled Evidence ({analysis.evidence.length})</h3>
                          </div>
                          {analysis.evidence.length ? (
                            analysis.evidence.map((m) => (
                              <div className="evidence" key={m.id} style={{ marginTop: 8 }}>
                                <div className="memory-label">
                                  <Database size={13} /> HISTORICAL MATCH #{m.id}
                                </div>
                                <p>{m.text}</p>
                              </div>
                            ))
                          ) : (
                            <p className="no-evidence">No matching past incident in bank.</p>
                          )}
                        </div>
                      </div>

                      <div className="btn-group">
                        <button
                          className="outline"
                          onClick={() => copyText(analysis.diagnosis, 'Memory Diagnosis')}
                        >
                          <Copy size={15} /> Copy Memory Diagnosis
                        </button>
                        <button className="outline" onClick={exportPostMortem}>
                          <Download size={15} /> Export Post-Mortem Report
                        </button>
                        <button
                          className="primary"
                          onClick={() => {
                            setConfirmed({ service, error, rootCause: '', fix: '' });
                            setShowModal(true);
                          }}
                        >
                          <CheckCircle2 size={16} /> Confirm this resolution
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="result">
                      <div className="result-meta">
                        {badge(
                          analysis.mode === 'memory'
                            ? 'Hindsight memory enabled'
                            : 'No-memory baseline',
                          analysis.mode === 'memory' ? 'good' : 'warn'
                        )}
                        {analysis.redactedCount && analysis.redactedCount > 0 ? (
                          badge(`${analysis.redactedCount} token(s) auto-redacted`, 'info')
                        ) : null}
                        <span>
                          <Clock3 size={14} /> {analysis.elapsedMs} ms
                        </span>
                      </div>

                      <h3>Diagnosis</h3>
                      <div className="diagnosis">{analysis.diagnosis}</div>

                      <div className="evidence-head">
                        <h3>Recalled Historical Memory</h3>
                        <span>{analysis.evidence.length} matches</span>
                      </div>
                      {analysis.evidence.length ? (
                        analysis.evidence.map((m) => (
                          <div className="evidence" key={m.id}>
                            <div className="memory-label">
                              <Database size={14} /> HISTORICAL MEMORY #{m.id}
                            </div>
                            <p>{m.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="no-evidence">
                          No historical evidence attached to this analysis.
                        </p>
                      )}

                      <div className="btn-group">
                        <button
                          className="outline"
                          onClick={() => copyText(analysis.diagnosis, 'Diagnosis')}
                        >
                          <Copy size={15} /> Copy Diagnosis
                        </button>
                        <button className="outline" onClick={exportPostMortem}>
                          <Download size={15} /> Export Post-Mortem Report
                        </button>
                        <button
                          className="outline"
                          onClick={() => {
                            setConfirmed({ service, error, rootCause: '', fix: '' });
                            setShowModal(true);
                          }}
                        >
                          <CheckCircle2 size={16} /> Confirm a resolution
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <div className="bottom-note">
                <LockKeyhole size={15} /> TraceMind never executes unconfirmed fixes. Always verify
                diagnoses before retaining them in memory.
              </div>
            </>
          )}

          {active === 'memory' && (
            <>
              <div className="subpage-head">
                <div className="eyebrow">HINDSIGHT MEMORY EXPLORER</div>
                <h1>
                  Institutional knowledge,
                  <br />
                  <em>on demand.</em>
                </h1>
                <p>
                  Browse and test real confirmed incident resolutions retained in your persistent
                  Hindsight memory bank.
                </p>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <Database size={23} />
                  <h3>Retain</h3>
                  <p>Save verified resolutions only after developer testing.</p>
                </div>
                <div className="info-card">
                  <Search size={23} />
                  <h3>Recall</h3>
                  <p>Retrieve past incidents across sessions using semantic and graph search.</p>
                </div>
                <div className="info-card">
                  <BrainCircuit size={23} />
                  <h3>Reason</h3>
                  <p>Ground future LLM investigations with concrete historical facts.</p>
                </div>
              </div>

              <div className="workspace-head">
                <div>
                  <h2>Persistent Memory Records</h2>
                  <p>Active Bank: {status?.bankId || 'tracemind-local-demo'}</p>
                </div>
                <div className="btn-group">
                  <button
                    className="outline"
                    onClick={fetchStoredMemories}
                    disabled={loadingMemories}
                  >
                    <RefreshCw size={15} /> {loadingMemories ? 'Refreshing...' : 'Refresh Bank'}
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      setConfirmed({ service, error, rootCause: '', fix: '' });
                      setShowModal(true);
                    }}
                  >
                    <Plus size={17} /> Add confirmed incident
                  </button>
                </div>
              </div>

              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search stored incidents by keyword or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="memory-list">
                {loadingMemories ? (
                  <p className="small-muted">Loading persistent memories from Hindsight...</p>
                ) : filteredMemories.length > 0 ? (
                  filteredMemories.map((item) => (
                    <div className="memory-card" key={item.id}>
                      <div className="memory-card-head">
                        <span className="badge good">
                          <Database size={13} /> Incident Record #{item.id}
                        </span>
                        <button
                          className="outline"
                          onClick={() => {
                            const errorMatch = item.text.match(/Error:\s*([^\n]+)/);
                            const serviceMatch = item.text.match(/Service:\s*([^\n]+)/);
                            if (errorMatch) setError(errorMatch[1]);
                            if (serviceMatch) setService(serviceMatch[1]);
                            setActive('investigate');
                          }}
                        >
                          <TerminalSquare size={14} /> Test in Investigation
                        </button>
                      </div>
                      <div className="memory-card-code">{item.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>
                      No stored incident matches found in this bank. Use &quot;Add confirmed
                      incident&quot; to save your first tested resolution!
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {active === 'guide' && (
            <>
              <div className="subpage-head">
                <div className="eyebrow">QUICKSTART & ARCHITECTURE</div>
                <h1>
                  How TraceMind
                  <br />
                  <em>retains and recalls.</em>
                </h1>
                <p>
                  TraceMind connects Next.js, Hindsight Agent Memory, and Groq reasoning into a
                  robust incident workflow.
                </p>
              </div>
              <div className="setup-steps">
                <div>
                  <span>01</span>
                  <div>
                    <h3>1. Retain Verified Outcomes</h3>
                    <p>
                      When a bug or outage is solved, the developer enters the service, error,
                      tested root cause, and verified fix. This is retained in Hindsight.
                    </p>
                  </div>
                </div>
                <div>
                  <span>02</span>
                  <div>
                    <h3>2. Multi-Strategy Recall</h3>
                    <p>
                      When a new error occurs, TraceMind searches the Hindsight memory bank using
                      vector embeddings, BM25 keywords, and relationship graph traversal.
                    </p>
                  </div>
                </div>
                <div>
                  <span>03</span>
                  <div>
                    <h3>3. Cautious LLM Diagnosis</h3>
                    <p>
                      The current error and historical context are passed to Groq (Llama 3.3 70B)
                      with strict safety guidelines to prevent blind trust in outdated fixes.
                    </p>
                  </div>
                </div>
                <div>
                  <span>04</span>
                  <div>
                    <h3>4. Band AI Desktop Integration</h3>
                    <p>
                      Export incident investigations and memories as structured JSON bundles to load
                      directly into desktop development and diagnostic tools.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {message && (
        <div className="toast">
          <CircleAlert size={17} />
          <span>{message}</span>
          <button onClick={() => setMessage('')} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <form className="modal" onSubmit={saveIncident}>
            <div className="modal-title">
              <div>
                <span className="eyebrow">HINDSIGHT RETAIN</span>
                <h2>Save confirmed resolution</h2>
                <p>Only store fixes that were tested and verified by a developer.</p>
              </div>
              <button type="button" className="icon-button" onClick={() => setShowModal(false)}>
                <X size={19} />
              </button>
            </div>
            <label>
              Service
              <input
                required
                value={confirmed.service}
                onChange={(e) => setConfirmed((v) => ({ ...v, service: e.target.value }))}
                maxLength={120}
              />
            </label>
            <label>
              Observed error
              <textarea
                required
                rows={3}
                value={confirmed.error}
                onChange={(e) => setConfirmed((v) => ({ ...v, error: e.target.value }))}
                maxLength={6000}
              />
            </label>
            <label>
              Verified root cause
              <textarea
                required
                rows={2}
                value={confirmed.rootCause}
                onChange={(e) => setConfirmed((v) => ({ ...v, rootCause: e.target.value }))}
                maxLength={6000}
                placeholder="What actually caused the failure?"
              />
            </label>
            <label>
              Confirmed fix
              <textarea
                required
                rows={2}
                value={confirmed.fix}
                onChange={(e) => setConfirmed((v) => ({ ...v, fix: e.target.value }))}
                maxLength={6000}
                placeholder="What fix passed verification?"
              />
            </label>
            {status?.protected && (
              <label>
                Access key
                <input
                  type="password"
                  value={access}
                  onChange={(e) => setAccess(e.target.value)}
                  placeholder="Server access key"
                />
              </label>
            )}
            <div className="modal-actions">
              <button type="button" className="outline" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary" disabled={busy}>
                {busy ? 'Saving...' : 'Save to Hindsight'}
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      )}

      {status?.protected && (
        <div className="access-bar">
          <LockKeyhole size={13} /> Protected demo{' '}
          <input
            type="password"
            aria-label="Demo access key"
            value={access}
            onChange={(e) => setAccess(e.target.value)}
            placeholder="Access key"
          />
        </div>
      )}
    </div>
  );
}
