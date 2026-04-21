/**
 * HookWorksheet.jsx — Pre-Cockpit hook planning
 *
 * Layer 1 of Hook Book architecture:
 *   - 3 reference lyric slots with ML analysis (rhyme scheme + devices)
 *   - Hook type visual picker (Repetition / Call-Response / Question-Answer / Paradox / Ascending / Fragmented)
 *   - Emotional peak locator (section placement)
 *   - Hook phrase rough draft
 *   - Output: hookOverrides object → App → Cockpit
 *
 * Props:
 *   preFill       — optional synthesis result from JournalPage
 *   onContinue(hookOverrides) — passes hook strategy to App
 *   onSkip()
 */
import { useState } from 'react'
import styles from './HookWorksheet.module.css'

const API = 'http://localhost:3001/api/hookbook'

const HOOK_TYPES = [
  { key: 'repetition',      label: 'Repetition',      icon: '↺', desc: 'Same phrase hammered home. Strength through return.' },
  { key: 'call_response',   label: 'Call-Response',   icon: '⇄', desc: 'Tension through dialogue. Question begets answer.' },
  { key: 'question_answer', label: 'Question-Answer', icon: '?→', desc: 'Inquiry drives toward truth. Ask then reveal.' },
  { key: 'paradox',         label: 'Paradox',         icon: '⊕', desc: 'Contradiction that resolves into meaning.' },
  { key: 'ascending',       label: 'Ascending',       icon: '↑', desc: 'Builds in intensity each repeat. Momentum.' },
  { key: 'fragmented',      label: 'Fragmented',      icon: '⋯', desc: 'Broken pieces that cohere. Dissonance into unity.' },
]

const PEAK_LOCATIONS = [
  { key: 'verse_1',    label: 'Verse 1',    desc: 'Immediate. No warm-up. Hit them with the assertion.' },
  { key: 'pre_chorus', label: 'Pre-Chorus', desc: 'Tension before release. Anticipation.' },
  { key: 'chorus',     label: 'Chorus',     desc: 'Classic peak. Earned catharsis.' },
  { key: 'bridge',     label: 'Bridge',     desc: 'Vulnerability safe zone. The revelation.' },
  { key: 'outro',      label: 'Outro',      desc: 'Earned wisdom. Final word.' },
]

async function analyzeRef(lyrics) {
  const lines = lyrics.split('\n').filter(l => l.trim())
  if (!lines.length) return null
  try {
    const [schemeRes, devicesRes] = await Promise.all([
      fetch(`${API}/scheme`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lines }) }),
      fetch(`${API}/devices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lines }) }),
    ])
    const [scheme, devices] = await Promise.all([schemeRes.json(), devicesRes.json()])
    const activeDevices = devices.devices
      ? Object.entries(devices.devices).filter(([,v]) => v?.length > 0).map(([k]) => k)
      : []
    return { scheme: scheme.scheme || '—', devices: activeDevices }
  } catch { return null }
}

function RefSlot({ idx, preFill }) {
  const [lyrics,   setLyrics]   = useState('')
  const [artist,   setArtist]   = useState('')
  const [why,      setWhy]      = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [loading,  setLoading]  = useState(false)

  async function run() {
    if (!lyrics.trim()) return
    setLoading(true); setAnalysis(null)
    const res = await analyzeRef(lyrics)
    setAnalysis(res)
    setLoading(false)
  }

  return (
    <div className={styles.refSlot}>
      <div className={styles.refHeader}>
        <span className={styles.refNum}>REF {idx + 1}</span>
        <input
          className={styles.artistInput}
          placeholder="Artist / Song title"
          value={artist}
          onChange={e => setArtist(e.target.value)}
        />
      </div>
      <textarea
        className={styles.refTextarea}
        placeholder="Paste 2–6 lines of lyrics you love here…"
        value={lyrics}
        onChange={e => setLyrics(e.target.value)}
        rows={4}
      />
      <input
        className={styles.whyInput}
        placeholder="Why does this hit you? (optional)"
        value={why}
        onChange={e => setWhy(e.target.value)}
      />
      <button className={styles.analyzeBtn} onClick={run} disabled={loading || !lyrics.trim()}>
        {loading ? '◌ Analyzing…' : '▶ Analyze'}
      </button>

      {analysis && (
        <div className={styles.refResult}>
          <div className={styles.refResultPill}>
            <span className={styles.refResultLabel}>RHYME SCHEME</span>
            <span className={styles.refResultValue}>{analysis.scheme}</span>
          </div>
          {analysis.devices.length > 0 && (
            <div className={styles.refResultPill}>
              <span className={styles.refResultLabel}>DEVICES</span>
              <span className={styles.refResultValue}>{analysis.devices.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HookWorksheet({ preFill, onContinue, onSkip }) {
  const [hookTypes,   setHookTypes]   = useState([])
  const [peakAt,      setPeakAt]      = useState('')
  const [hookPhrase,  setHookPhrase]  = useState(preFill?.hookSuggestion || '')
  const [archetype,   setArchetype]   = useState(preFill?.archetype || '')

  function toggleHookType(key) {
    setHookTypes(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  function handleContinue() {
    const hookOverrides = {
      hookTypes,
      emotionalPeakAt: peakAt,
      hookPhrase: hookPhrase.trim(),
      referredArchetype: archetype,
    }
    onContinue(hookOverrides)
  }

  const ready = hookTypes.length > 0 || hookPhrase.trim().length > 3

  return (
    <div className={styles.page}>
      <div className={styles.content}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.heroBadge}>⊕ HOOK BOOK — PRE-COCKPIT WORKSHEET</div>
          <h1 className={styles.heroTitle}>What Must Repeat?</h1>
          <p className={styles.heroSub}>
            The hook isn't decoration. It IS your identity. What you choose to hammer home defines the song.
            {preFill?.archetype && <span className={styles.heroArchetype}> Archetype detected: <em>{preFill.archetype}</em></span>}
          </p>
        </div>

        {/* ── Step 1: Reference lyrics ───────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.stepNum}>01</span>
            <div>
              <h2 className={styles.sectionTitle}>Reference Lyrics</h2>
              <p className={styles.sectionSub}>Paste 3 song excerpts you love. The engine reads your sonic DNA.</p>
            </div>
          </div>
          <div className={styles.refSlots}>
            {[0, 1, 2].map(i => <RefSlot key={i} idx={i} preFill={preFill} />)}
          </div>
        </section>

        {/* ── Step 2: Hook type ──────────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.stepNum}>02</span>
            <div>
              <h2 className={styles.sectionTitle}>Hook Structure</h2>
              <p className={styles.sectionSub}>How should your core phrase repeat? Pick one or more.</p>
            </div>
          </div>
          <div className={styles.hookGrid}>
            {HOOK_TYPES.map(ht => (
              <button
                key={ht.key}
                className={[styles.hookCard, hookTypes.includes(ht.key) ? styles.hookCardActive : ''].join(' ')}
                onClick={() => toggleHookType(ht.key)}
              >
                <span className={styles.hookIcon}>{ht.icon}</span>
                <span className={styles.hookLabel}>{ht.label}</span>
                <span className={styles.hookDesc}>{ht.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Step 3: Emotional peak ─────────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.stepNum}>03</span>
            <div>
              <h2 className={styles.sectionTitle}>Emotional Peak Placement</h2>
              <p className={styles.sectionSub}>Where should the song break your heart?</p>
            </div>
          </div>
          <div className={styles.peakRow}>
            {PEAK_LOCATIONS.map(pl => (
              <button
                key={pl.key}
                className={[styles.peakPill, peakAt === pl.key ? styles.peakActive : ''].join(' ')}
                onClick={() => setPeakAt(pl.key)}
                title={pl.desc}
              >
                {pl.label}
              </button>
            ))}
          </div>
          {peakAt && (
            <p className={styles.peakDesc}>{PEAK_LOCATIONS.find(p => p.key === peakAt)?.desc}</p>
          )}
        </section>

        {/* ── Step 4: Hook phrase draft ──────────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.stepNum}>04</span>
            <div>
              <h2 className={styles.sectionTitle}>Hook Phrase Draft</h2>
              <p className={styles.sectionSub}>In 1–2 sentences: what must the song keep saying?</p>
            </div>
          </div>
          <textarea
            className={styles.hookTextarea}
            placeholder={preFill?.hookSuggestion ? `Suggested: "${preFill.hookSuggestion}"` : 'Write the phrase your song must repeat. Raw is fine — the Cockpit will refine it.'}
            value={hookPhrase}
            onChange={e => setHookPhrase(e.target.value)}
            rows={3}
          />
          <p className={styles.hookHint}>
            Tip: Start with your archetype's voice —
            {' '}
            <em>Defiant: "I refuse…" · Vulnerable: "I still…" · Wise: "The [thing] teaches us…"</em>
          </p>
        </section>

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div className={styles.actions}>
          <button className={styles.skipBtn} onClick={onSkip}>Skip Hook Worksheet</button>
          <button
            className={[styles.continueBtn, ready ? styles.continueBtnReady : ''].join(' ')}
            onClick={handleContinue}
          >
            Load into Cockpit → Begin
          </button>
        </div>

      </div>
    </div>
  )
}
