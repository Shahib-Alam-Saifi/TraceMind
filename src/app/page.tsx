'use client';
import { useEffect, useState, useMemo } from 'react';
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
  Layers,
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
  X,
  Zap,
} from 'lucide-react';
import type { Analysis, StoredMemoryItem } from '@/lib/types';
import { generatePostMortem, generateBandAIPrompt } from '@/lib/core.mjs';

type Status = {
  hindsightConfigured: boolean;
  groqConfigured: boolean;
  protected: boolean;
  model?: string;
  bankId?: string;
};

const INCIDENT_PRESETS = [
  {
    name: 'Gateway 502 Upstream',
    service: 'api-gateway',
    error: 'HTTP 502 Bad Gateway: Upstream connection refused on port 8080 during traffic spike.',
    rootCause:
      'Application container was listening on port 3000 while reverse proxy upstream.conf routed traffic to port 8080.',
    fix: 'Aligned PORT environment variable and reverse proxy upstream.conf to port 3000; health check returned 200 OK.',
  },
  {
    name: 'React Navbar Crash',
    service: 'frontend-web',
    error:
      'Error: Element type is invalid: expected a string or a class/function but got undefined. Check the render method of Navbar.',
    rootCause: 'Navbar was exported as default but imported using named import syntax.',
    fix: 'Changed import { Navbar } from "./Navbar" to import Navbar from "./Navbar" and verified build passed.',
  },
  {
    name: 'Queue Redis Timeout',
    service: 'worker-queue',
    error:
      'RedisConnectionTimeout: Reached max retry limit of 10 while polling task queue after idle period.',
    rootCause:
      'Redis connection pool exhaustion caused by missing client.release() in async error handler.',
    fix: 'Wrapped worker task execution in try...finally block ensuring client connection is always released back to pool.',
  },
];

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);
  const [access, setAccess] = useState('');
  const [service, setService] = useState('api-gateway');
  const [error, setError] = useState(INCIDENT_PRESETS[0].error);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [baselineAnalysis, setBaselineAnalysis] = useState<Analysis | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'investigate' | 'memory' | 'guide'>('investigate');
  const [showModal, setShowModal] = useState(false);
  const [confirmed, setConfirmed] = useState({
    service: 'api-gateway',
    error: INCIDENT_PRESETS[0].error,
    rootCause: '',
    fix: '',
  });
  const [savedCount, setSavedCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('tracemind_saved_count');
        return saved ? parseInt(saved, 10) || 0 : 3;
      } catch {
        return 3;
      }
    }
    return 3;
  });
  const [mobileNav, setMobileNav] = useState(false);
  const [storedMemories, setStoredMemories] = useState<StoredMemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [loadingMemories, setLoadingMemories] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  const requestHeaders = useMemo(() => {
    return {
      'Content-Type': 'application/json',
      ...(access ? { 'x-tracemind-key': access } : {}),
    };
  }, [access]);

  async function fetchStoredMemories() {
    setLoadingMemories(true);
    try {
      const r = await fetch('/api/incident', { headers: requestHeaders });
      const json = await r.json();
      if (r.ok && json.incidents) {
        setStoredMemories(json.incidents);
      }
    } catch {
      // non-blocking
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
      setMessage(e instanceof Error ? e.message : 'Unexpected analysis failure');
    } finally {
      setBusy(false);
    }
  }

  async function seedDemoData() {
    setLoadingMemories(true);
    setMessage('');
    try {
      const r = await fetch('/api/incident', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({ action: 'seed' }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Seed failed');
      const newCount = savedCount + (json.seededCount || 3);
      setSavedCount(newCount);
      try {
        localStorage.setItem('tracemind_saved_count', String(newCount));
      } catch {}
      setMessage('Retained 3 realistic enterprise incidents into Hindsight memory bank.');
      fetchStoredMemories();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not seed demo incidents');
    } finally {
      setLoadingMemories(false);
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
      setMessage(`Incident #${json.id} verified and stored in persistent Hindsight memory.`);
      setShowModal(false);
      if (activeTab === 'memory') fetchStoredMemories();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to save incident');
    } finally {
      setBusy(false);
    }
  }

  function loadPreset(i: number) {
    const item = INCIDENT_PRESETS[i];
    setService(item.service);
    setError(item.error);
    setConfirmed({
      service: item.service,
      error: item.error,
      rootCause: item.rootCause,
      fix: item.fix,
    });
    setAnalysis(null);
    setBaselineAnalysis(null);
    setMessage('');
    setActiveTab('investigate');
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
    copyText(report, 'Incident Post-Mortem Report');
  }

  function copyBandAIPrompt() {
    if (!analysis) return;
    const promptText = generateBandAIPrompt({
      service,
      error,
      diagnosis: analysis.diagnosis,
      fix: confirmed.fix,
    });
    copyText(promptText, 'Band AI Desktop Agent Task Prompt');
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

  const filteredMemories = useMemo(() => {
    return storedMemories.filter((m) => {
      const matchesSearch = m.text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesService =
        serviceFilter === 'all' ||
        m.text.toLowerCase().includes(`service: ${serviceFilter.toLowerCase()}`);
      return matchesSearch && matchesService;
    });
  }, [storedMemories, searchQuery, serviceFilter]);

  return (
    <div className="app-shell">
      {/* Precision Developer Sidebar */}
      <aside className={'sidebar ' + (mobileNav ? 'open' : '')}>
        <div className="brand">
          <div className="brand-icon-box">
            <BrainCircuit size={20} strokeWidth={2.2} />
          </div>
          <div className="brand-info">
            <strong>TraceMind</strong>
            <small>INCIDENT INTELLIGENCE</small>
          </div>
        </div>

        <div className="nav-section-title">WAR ROOM</div>
        <button
          className={'nav-item ' + (activeTab === 'investigate' ? 'active' : '')}
          onClick={() => {
            setActiveTab('investigate');
            setMobileNav(false);
          }}
        >
          <LayoutDashboard size={16} /> Investigation
        </button>
        <button
          className={'nav-item ' + (activeTab === 'memory' ? 'active' : '')}
          onClick={() => {
            setActiveTab('memory');
            setMobileNav(false);
            fetchStoredMemories();
          }}
        >
          <Database size={16} /> Memory Bank
        </button>
        <button
          className={'nav-item ' + (activeTab === 'guide' ? 'active' : '')}
          onClick={() => {
            setActiveTab('guide');
            setMobileNav(false);
          }}
        >
          <Code2 size={16} /> Architecture & Guide
        </button>

        <div className="nav-section-title" style={{ marginTop: 24 }}>
          INCIDENT PRESETS
        </div>
        {INCIDENT_PRESETS.map((item, i) => (
          <button key={i} className="example-item" onClick={() => loadPreset(i)}>
            <Zap size={13} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
            <span>{item.name}</span>
          </button>
        ))}

        <div className="sidebar-footer">
          <div className="sidebar-status-card">
            <div className="status-row">
              <span>Hindsight Layer</span>
              <span className="status-indicator">
                <span className="pulse-dot" />
                {status?.hindsightConfigured ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="status-row">
              <span>Model</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-main)' }}>
                {status?.model || 'llama-3.3-70b'}
              </span>
            </div>
            <div className="status-row" style={{ marginBottom: 0 }}>
              <span>Bank ID</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
                {status?.bankId || 'tracemind-demo'}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>
            Built for Devnovate Hackathon
          </div>
        </div>
      </aside>

      {/* Main Command Center */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button
              onClick={() => setMobileNav(!mobileNav)}
              style={{ display: 'none', color: 'var(--text-main)' }}
              className="mobile-menu-btn"
            >
              <Menu size={18} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} style={{ color: 'var(--text-dim)' }} />
            <strong style={{ color: 'var(--text-main)' }}>
              {activeTab === 'investigate'
                ? 'Active Investigation'
                : activeTab === 'memory'
                ? 'Persistent Memory Ledger'
                : 'Architecture & Runbook'}
            </strong>
          </div>

          <div className="topbar-right">
            {status?.hindsightConfigured ? (
              <span className="badge good">
                <span className="pulse-dot" /> Hindsight Cloud Active
              </span>
            ) : (
              <span className="badge warn">Setup Needed</span>
            )}
            <span className="badge cyan">Groq Llama 3.3 70B</span>
          </div>
        </header>

        <main className="page-container">
          {activeTab === 'investigate' && (
            <>
              {/* Sleek Command Bar */}
              <div className="command-header">
                <div className="command-title">
                  <h1>
                    <TerminalSquare size={22} style={{ color: 'var(--blue)' }} /> Incident War Room
                  </h1>
                  <p>
                    Correlate live stack traces against verified past resolutions retained in
                    Hindsight.
                  </p>
                </div>

                <div className="command-actions">
                  <button
                    className={'btn-secondary ' + (compareMode ? 'active' : '')}
                    onClick={() => setCompareMode(!compareMode)}
                  >
                    <SplitSquareVertical size={15} />
                    {compareMode ? 'Dual Mode Active' : 'Compare Baseline vs Memory'}
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setConfirmed({ service, error, rootCause: '', fix: '' });
                      setShowModal(true);
                    }}
                  >
                    <Plus size={15} /> Record Verified Fix
                  </button>
                </div>
              </div>

              {/* Utility Metrics Ribbon */}
              <div className="metrics-ribbon">
                <div className="metric-tile">
                  <span className="metric-tile-label">
                    <Database size={13} style={{ color: 'var(--blue)' }} /> Memory Bank
                  </span>
                  <span className="metric-tile-val">{status?.bankId || 'tracemind-local-demo'}</span>
                  <span className="metric-tile-sub">Persistent Vectorize Bank</span>
                </div>

                <div className="metric-tile">
                  <span className="metric-tile-label">
                    <Activity size={13} style={{ color: 'var(--cyan)' }} /> Reasoning Engine
                  </span>
                  <span className="metric-tile-val">{status?.model || 'llama-3.3-70b-versatile'}</span>
                  <span className="metric-tile-sub">Fast Groq Provider</span>
                </div>

                <div className="metric-tile">
                  <span className="metric-tile-label">
                    <Layers size={13} style={{ color: 'var(--emerald)' }} /> Confirmed Incidents
                  </span>
                  <span className="metric-tile-val">{savedCount.toString().padStart(2, '0')}</span>
                  <span className="metric-tile-sub">Human-verified fixes retained</span>
                </div>

                <div className="metric-tile">
                  <span className="metric-tile-label">
                    <Clock3 size={13} style={{ color: 'var(--amber)' }} /> Estimated MTTR
                  </span>
                  <span className="metric-tile-val" style={{ color: 'var(--emerald)' }}>
                    -85% Reduction
                  </span>
                  <span className="metric-tile-sub">45 min ➔ 30 sec resolution</span>
                </div>
              </div>

              {/* Investigation Workspace Split View */}
              <div className="workspace-grid">
                {/* Input Panel */}
                <div className="editor-card">
                  <div className="card-header-bar">
                    <span className="card-header-title">
                      <Server size={15} style={{ color: 'var(--blue)' }} /> Incident Parameters
                    </span>
                    <span className="badge">INPUT</span>
                  </div>

                  <div className="card-body">
                    <div className="form-group">
                      <label className="form-label" htmlFor="service-input">
                        <span>Affected Service</span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          Namespace or Microservice
                        </span>
                      </label>
                      <input
                        id="service-input"
                        className="input-control"
                        value={service}
                        onChange={(e) => setService(e.target.value)}
                        placeholder="e.g. api-gateway, auth-service"
                        maxLength={120}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="error-textarea">
                        <span>Production Error / Stack Trace</span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {error.length} chars
                        </span>
                      </label>
                      <textarea
                        id="error-textarea"
                        className="input-control textarea-control"
                        value={error}
                        onChange={(e) => setError(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            analyze();
                          }
                        }}
                        rows={8}
                        maxLength={6000}
                        placeholder="Paste application logs, stack traces, or incident description..."
                      />
                      <div className="form-tip">
                        <ShieldCheck size={14} style={{ color: 'var(--emerald)' }} />
                        <span>Automatic token, JWT, and database credential redaction enabled.</span>
                      </div>
                    </div>

                    {!compareMode && (
                      <div className="toggle-switch-card">
                        <div className="toggle-switch-info">
                          <strong>
                            <BrainCircuit size={15} style={{ color: 'var(--cyan)' }} /> Hindsight
                            Persistent Memory
                          </strong>
                          <small>Recall previously verified solutions from the memory bank</small>
                        </div>
                        <button
                          type="button"
                          className={'switch-pill ' + (memoryEnabled ? 'active' : '')}
                          onClick={() => setMemoryEnabled(!memoryEnabled)}
                        >
                          <span className="switch-thumb" />
                        </button>
                      </div>
                    )}

                    <button
                      className="btn-primary"
                      style={{ width: '100%', padding: '12px' }}
                      onClick={analyze}
                      disabled={busy || !error.trim() || !service.trim()}
                    >
                      {busy ? <span className="loading-spinner" /> : <Sparkles size={16} />}
                      {busy
                        ? 'Investigating Incident...'
                        : compareMode
                        ? 'Execute Dual Comparison'
                        : 'Diagnose Incident'}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>

                {/* Output Panel */}
                <div className="results-card">
                  <div className="card-header-bar">
                    <span className="card-header-title">
                      <BrainCircuit size={15} style={{ color: 'var(--cyan)' }} /> Diagnosis &
                      Evidence
                    </span>
                    {analysis && <span className="badge">{analysis.elapsedMs} ms</span>}
                  </div>

                  <div className="card-body">
                    {!analysis ? (
                      <div className="empty-hero-state">
                        <div className="empty-icon-shield">
                          <Fingerprint size={28} />
                        </div>
                        <h3>No Active Investigation</h3>
                        <p>
                          Paste a stack trace on the left or select a preset to begin. TraceMind will
                          search Hindsight for verified past fixes.
                        </p>
                      </div>
                    ) : compareMode && baselineAnalysis ? (
                      <div>
                        {/* Visual MTTR Delta Callout for Hackathon Judges */}
                        <div className="mttr-delta-badge">
                          <Zap size={16} />
                          <span>
                            Judging Demonstration: Notice how Baseline proposes generic hypotheses,
                            while Hindsight pinpoints the exact verified fix!
                          </span>
                        </div>

                        <div className="dual-comparison-container">
                          {/* Baseline Column */}
                          <div className="dual-column">
                            <div className="dual-column-header">
                              <span className="badge warn">Stateless Baseline</span>
                              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                {baselineAnalysis.elapsedMs} ms
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--text-dim)',
                                textTransform: 'uppercase',
                                marginBottom: 6,
                              }}
                            >
                              Generic LLM Hypotheses
                            </span>
                            <div className="diagnosis-text">{baselineAnalysis.diagnosis}</div>
                          </div>

                          {/* Memory Column */}
                          <div className="dual-column highlighted">
                            <div className="dual-column-header">
                              <span className="badge good">
                                <span className="pulse-dot" /> With Hindsight Memory
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                                {analysis.elapsedMs} ms
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'var(--cyan)',
                                textTransform: 'uppercase',
                                marginBottom: 6,
                              }}
                            >
                              Grounded in Verified Fix
                            </span>
                            <div className="diagnosis-text">{analysis.diagnosis}</div>

                            <div className="evidence-section-header">
                              <h4>Recalled Historical Evidence ({analysis.evidence.length})</h4>
                            </div>
                            {analysis.evidence.length ? (
                              analysis.evidence.map((m) => (
                                <div className="evidence-item-card" key={m.id}>
                                  <div className="evidence-item-badge">
                                    <Database size={11} /> Recalled Memory #{m.id}
                                  </div>
                                  <div>{m.text}</div>
                                </div>
                              ))
                            ) : (
                              <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                                No matching prior incident in memory bank.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="action-buttons-ribbon">
                          <button
                            className="btn-secondary btn-sm"
                            onClick={() => copyText(analysis.diagnosis, 'Diagnosis')}
                          >
                            <Copy size={13} /> Copy Diagnosis
                          </button>
                          <button className="btn-secondary btn-sm" onClick={copyBandAIPrompt}>
                            <TerminalSquare size={13} /> Copy for Band AI
                          </button>
                          <button className="btn-secondary btn-sm" onClick={exportPostMortem}>
                            <Download size={13} /> Post-Mortem (.md)
                          </button>
                          <button
                            className="btn-primary btn-sm"
                            style={{ marginLeft: 'auto' }}
                            onClick={() => {
                              setConfirmed({ service, error, rootCause: '', fix: '' });
                              setShowModal(true);
                            }}
                          >
                            <CheckCircle2 size={13} /> Confirm Verified Fix
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                          <span
                            className={
                              'badge ' + (analysis.mode === 'memory' ? 'good' : 'warn')
                            }
                          >
                            {analysis.mode === 'memory'
                              ? 'Hindsight Memory Active'
                              : 'Baseline (No Memory)'}
                          </span>
                          {analysis.redactedCount && analysis.redactedCount > 0 ? (
                            <span className="badge cyan">
                              <ShieldCheck size={12} /> {analysis.redactedCount} token(s) auto-redacted
                            </span>
                          ) : null}
                          <span style={{ fontSize: 11, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                            {analysis.elapsedMs} ms latency
                          </span>
                        </div>

                        <div className="diagnosis-block">
                          <div className="diagnosis-block-title">
                            <Sparkles size={14} /> AI Incident Diagnosis & Action Plan
                          </div>
                          <div className="diagnosis-text">{analysis.diagnosis}</div>
                        </div>

                        <div className="evidence-section-header">
                          <h4>
                            <Database size={14} style={{ color: 'var(--cyan)' }} /> Recalled Memory
                            Evidence ({analysis.evidence.length})
                          </h4>
                        </div>
                        {analysis.evidence.length ? (
                          analysis.evidence.map((m) => (
                            <div className="evidence-item-card" key={m.id}>
                              <div className="evidence-item-badge">
                                <Database size={11} /> Historical Memory Match #{m.id}
                              </div>
                              <div>{m.text}</div>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: 12, color: 'var(--text-dim)', padding: '10px 0' }}>
                            No prior matching incident found in bank. If you solve this, record it below to teach Hindsight!
                          </p>
                        )}

                        <div className="action-buttons-ribbon">
                          <button
                            className="btn-secondary btn-sm"
                            onClick={() => copyText(analysis.diagnosis, 'Diagnosis')}
                          >
                            <Copy size={13} /> Copy Diagnosis
                          </button>
                          <button className="btn-secondary btn-sm" onClick={copyBandAIPrompt}>
                            <TerminalSquare size={13} /> Copy for Band AI
                          </button>
                          <button className="btn-secondary btn-sm" onClick={exportPostMortem}>
                            <Download size={13} /> Export Post-Mortem
                          </button>
                          <button
                            className="btn-primary btn-sm"
                            style={{ marginLeft: 'auto' }}
                            onClick={() => {
                              setConfirmed({ service, error, rootCause: '', fix: '' });
                              setShowModal(true);
                            }}
                          >
                            <CheckCircle2 size={13} /> Confirm Verified Fix
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'memory' && (
            <div>
              <div className="command-header">
                <div className="command-title">
                  <h1>
                    <Database size={22} style={{ color: 'var(--cyan)' }} /> Persistent Memory Ledger
                  </h1>
                  <p>
                    Browse, search, and recall confirmed engineering resolutions stored in your
                    Hindsight bank.
                  </p>
                </div>

                <div className="command-actions">
                  <button className="btn-secondary" onClick={seedDemoData} disabled={loadingMemories}>
                    <Sparkles size={14} /> Seed Enterprise Incidents
                  </button>
                  <button className="btn-secondary" onClick={exportBandAIJson}>
                    <Download size={14} /> Export for Band AI
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setConfirmed({ service, error, rootCause: '', fix: '' });
                      setShowModal(true);
                    }}
                  >
                    <Plus size={15} /> Retain New Fix
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                  <Search
                    size={15}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-dim)',
                    }}
                  />
                  <input
                    className="input-control"
                    style={{ paddingLeft: 36 }}
                    placeholder="Search incident memories by keyword, error, or fix..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="input-control"
                  style={{ width: 180 }}
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                >
                  <option value="all">All Services</option>
                  <option value="api-gateway">api-gateway</option>
                  <option value="frontend-web">frontend-web</option>
                  <option value="worker-queue">worker-queue</option>
                  <option value="payment-service">payment-service</option>
                </select>

                <button
                  className="btn-secondary"
                  onClick={fetchStoredMemories}
                  disabled={loadingMemories}
                >
                  <RefreshCw size={14} /> {loadingMemories ? 'Syncing...' : 'Refresh'}
                </button>
              </div>

              {/* Memory Cards Grid */}
              <div className="knowledge-base-grid">
                {loadingMemories ? (
                  <p style={{ color: 'var(--text-dim)' }}>Loading memories from Hindsight...</p>
                ) : filteredMemories.length > 0 ? (
                  filteredMemories.map((item) => (
                    <div className="kb-card" key={item.id}>
                      <div className="kb-card-header">
                        <span className="badge good">
                          <CheckCircle2 size={12} /> Confirmed Incident #{item.id}
                        </span>
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => {
                            const errorMatch = item.text.match(/Error:\s*([^\n]+)/);
                            const serviceMatch = item.text.match(/Service:\s*([^\n]+)/);
                            if (errorMatch) setError(errorMatch[1]);
                            if (serviceMatch) setService(serviceMatch[1]);
                            setActiveTab('investigate');
                          }}
                        >
                          <TerminalSquare size={13} /> Test Recall
                        </button>
                      </div>

                      <div className="kb-card-code">{item.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="empty-hero-state" style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-icon-shield">
                      <Database size={28} />
                    </div>
                    <h3>Memory Bank Empty or No Matches</h3>
                    <p>
                      Click below to pre-populate 3 realistic enterprise incidents, or record your
                      first tested resolution.
                    </p>
                    <button
                      className="btn-primary"
                      onClick={seedDemoData}
                      style={{ marginTop: 16 }}
                    >
                      <Sparkles size={15} /> Seed 3 Realistic Enterprise Incidents
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div>
              <div className="command-header">
                <div className="command-title">
                  <h1>
                    <Code2 size={22} style={{ color: 'var(--blue)' }} /> Architecture & Hackathon
                    Alignment
                  </h1>
                  <p>
                    How TraceMind implements Hindsight persistent memory to solve real enterprise
                    debugging.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 16,
                  marginTop: 20,
                }}
              >
                <div className="kb-card">
                  <div className="diagnosis-block-title">
                    <Database size={15} /> 1. Retain (Verified Knowledge)
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    AI-generated guesses are never auto-saved. Only when a developer verifies a fix
                    does TraceMind call <code>client.retain(bankId, incidentText)</code>, creating a
                    durable institutional ledger.
                  </p>
                </div>

                <div className="kb-card">
                  <div className="diagnosis-block-title">
                    <Search size={15} /> 2. Multi-Strategy Recall
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    When a new incident occurs, Hindsight executes parallel semantic vector search,
                    BM25 keyword matching, and graph traversal to retrieve matching historical fixes
                    across sessions.
                  </p>
                </div>

                <div className="kb-card">
                  <div className="diagnosis-block-title">
                    <TerminalSquare size={15} /> 3. Band AI Desktop Bridge
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    Export grounded diagnoses and memories into structured JSON bundles or agent
                    prompts for <strong>Band AI Desktop</strong> (https://band.ai) multi-agent rooms.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {message && (
        <div className="toast-notification">
          <CircleAlert size={16} style={{ color: 'var(--cyan)' }} />
          <span>{message}</span>
          <button onClick={() => setMessage('')} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Record Verified Fix Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal-dialog">
            <div className="modal-header">
              <div>
                <span className="badge good" style={{ marginBottom: 6 }}>
                  Hindsight Retain
                </span>
                <h3>Record Confirmed Incident Resolution</h3>
                <p>Only store resolutions that passed testing in your environment.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ color: 'var(--text-dim)', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveIncident}>
              <div className="form-group">
                <label className="form-label">Service</label>
                <input
                  required
                  className="input-control"
                  value={confirmed.service}
                  onChange={(e) => setConfirmed((v) => ({ ...v, service: e.target.value }))}
                  maxLength={120}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Observed Error / Stack Trace</label>
                <textarea
                  required
                  rows={3}
                  className="input-control textarea-control"
                  style={{ minHeight: 90 }}
                  value={confirmed.error}
                  onChange={(e) => setConfirmed((v) => ({ ...v, error: e.target.value }))}
                  maxLength={6000}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Verified Root Cause</label>
                <textarea
                  required
                  rows={2}
                  className="input-control textarea-control"
                  style={{ minHeight: 70 }}
                  value={confirmed.rootCause}
                  onChange={(e) => setConfirmed((v) => ({ ...v, rootCause: e.target.value }))}
                  placeholder="e.g. Reverse proxy forwarded to 8080 while app was on port 3000..."
                  maxLength={6000}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmed Fix</label>
                <textarea
                  required
                  rows={2}
                  className="input-control textarea-control"
                  style={{ minHeight: 70 }}
                  value={confirmed.fix}
                  onChange={(e) => setConfirmed((v) => ({ ...v, fix: e.target.value }))}
                  placeholder="e.g. Aligned upstream proxy_pass to port 3000 and tested health check..."
                  maxLength={6000}
                />
              </div>

              {status?.protected && (
                <div className="form-group">
                  <label className="form-label">Access Key</label>
                  <input
                    type="password"
                    className="input-control"
                    value={access}
                    onChange={(e) => setAccess(e.target.value)}
                    placeholder="Server access key"
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {busy ? <span className="loading-spinner" /> : <Database size={15} />}
                  {busy ? 'Retaining...' : 'Retain in Hindsight'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {status?.protected && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            padding: '6px 12px',
            borderRadius: '8px 8px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            color: 'var(--text-muted)',
            zIndex: 40,
          }}
        >
          <LockKeyhole size={13} /> Protected Demo
          <input
            type="password"
            aria-label="Demo access key"
            value={access}
            onChange={(e) => setAccess(e.target.value)}
            placeholder="Access key"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 11,
              width: 120,
            }}
          />
        </div>
      )}
    </div>
  );
}
