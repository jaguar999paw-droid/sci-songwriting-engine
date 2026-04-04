/**
 * CockpitPreview.jsx — Cinematic persona reveal before generation
 *
 * 1. Black screen → archetype name fades in (Bebas Neue 72px, green glow)
 * 2. Core message appears below in italic
 * 3. Structure plan slides up from bottom
 * 4. GENERATE → button — commit mode, no back
 */
import { useState, useEffect } from 'react'
import styles from './CockpitPreview.module.css'

const ARCHETYPE_EMOJI = {
  'The Defiant':       '⚡',
  'The Misunderstood': '🌊',
  'The Transformer':   '🔥',
  'The Seeker':        '🔍',
  'The Bridge Walker': '🌉',
  'The Lone Voice':    '🎤',
  'The Heir':          '👑',
  'The Grounded':      '🌍',
  'The Observer':      '👁',
}

const SECTION_COLORS = {
  verse:      '#00ff88',
  hook:       '#ff00aa',
  'pre-hook': '#ffaa00',
  bridge:     '#00aaff',
  intro:      '#606068',
  outro:      '#9060ff',
}

export default function CockpitPreview({ answers, onAnalysis }) {
  const [phase,   setPhase]   = useState(0) // 0=loading 1=archetype 2=message 3=structure 4=ready
  const [data,    setData]    = useState(null)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function analyze() {
      try {
        const body = {
          answers: {
            whoAreYouNot:   answers.whoAreYouNot,
            mainIdea:       answers.mainIdea,
            emotionalTruth: answers.emotionalTruth,
            socialConflict: answers.socialConflict,
            referenceText:  answers.referenceText,
          },
          overrides: answers.overrides || {},
        }
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`Server error ${res.status}`)
        const json = await res.json()
        setData(json)
        // Cinematic sequence
        setTimeout(() => setPhase(1), 200)
        setTimeout(() => setPhase(2), 1000)
        setTimeout(() => setPhase(3), 1900)
        setTimeout(() => setPhase(4), 2800)
      } catch (err) {
        setError(err.message)
        setPhase(4)
      }
    }
    analyze()
  }, [])

  if (!data && !error) return (
    <div className={styles.screen}>
      <div className={styles.spinner} />
      <p className={styles.loadingText}>PARSING IDENTITY...</p>
    </div>
  )

  if (error) return (
    <div className={styles.screen}>
      <p className={styles.error}>⚠ {error}</p>
      <p className={styles.errorNote}>Make sure the backend is running:<br /><code>cd backend && npm start</code></p>
    </div>
  )

  const { persona, message, structure } = data
  const emoji = ARCHETYPE_EMOJI[persona.archetype] || '◈'

  return (
    <div className={styles.screen}>

      {/* PHASE 1 — Archetype */}
      <div className={[styles.archetypeBlock, phase >= 1 ? styles.visible : ''].join(' ')}>
        <span className={styles.archetypeEmoji}>{emoji}</span>
        <h1 className={styles.archetypeName}>{persona.archetype}</h1>
        <div className={styles.personaMeta}>
          <Tag v={persona.primaryEmotion} />
          <Tag v={persona.tone} />
          <Tag v={`${persona.perspective} person`} />
          <Tag v={persona.languageMix} color="var(--magenta)" />
        </div>
      </div>

      {/* PHASE 2 — Core message */}
      <div className={[styles.messageBlock, phase >= 2 ? styles.visible : ''].join(' ')}>
        <div className={styles.messageLabel}>CORE MESSAGE</div>
        <p className={styles.messageText}>"{message.coreMessage}"</p>
      </div>

      {/* PHASE 3 — Structure */}
      <div className={[styles.structureBlock, phase >= 3 ? styles.visible : ''].join(' ')}>
        <div className={styles.structureLabel}>
          SONG STRUCTURE — {structure.totalSections} sections
        </div>
        <div className={styles.sections}>
          {structure.sections.map((s, i) => (
            <div key={i} className={styles.sectionRow}>
              <span
                className={styles.sType}
                style={{ color: SECTION_COLORS[s.type] || 'var(--green)', borderColor: SECTION_COLORS[s.type] || 'var(--green)' }}
              >{s.type.toUpperCase()}</span>
              <span className={styles.sGoal}>{s.goal.replace(/_/g, ' ')}</span>
              <span className={styles.sLines}>{s.lines}L</span>
            </div>
          ))}
        </div>
      </div>

      {/* PHASE 4 — Generate button */}
      <div className={[styles.generateDock, phase >= 4 ? styles.visible : ''].join(' ')}>
        <button
          className={styles.generateBtn}
          onClick={() => onAnalysis(data)}
        >
          GENERATE →
        </button>
        <p className={styles.commitNote}>No back. Only forward.</p>
      </div>
    </div>
  )
}

function Tag({ v, color = 'var(--green)' }) {
  return <span className={styles.tag} style={{ color, borderColor: color }}>{v}</span>
}
