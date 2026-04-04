/**
 * Cockpit.jsx — v2 Three-panel spatial identity input interface
 *
 * LEFT  — WHO:   Identity rejection chips, archetype picker, trait knobs
 * CENTRE — WHAT: Core message, emotional truth, social conflict, reference text
 * RIGHT  — HOW:  Energy/Rawness knobs, language toggles, perspective pills, rhyme swatches
 *
 * Auto-saves to localStorage every 2s. Sends answers + overrides to onDone().
 */
import { useState, useEffect, useCallback } from 'react'
import PersonaLiveBar    from '../components/PersonaLiveBar'
import ArchetypeGrid     from '../components/ArchetypeGrid'
import KnobSlider        from '../components/KnobSlider'
import LanguageToggle    from '../components/LanguageToggle'
import RhymeSwatch       from '../components/RhymeSwatch'
import ThemeChips        from '../components/ThemeChips'
import ReferenceDropZone from '../components/ReferenceDropZone'
import styles            from './Cockpit.module.css'

const REJECTION_CHIPS = [
  'a victim',    'ordinary',    'defined by others', 'silent',
  'a stereotype','predictable', 'just from here',    'forgotten',
  'obedient',    'broken',      'what they made me', 'without a story',
  'replaceable', 'soft',        'lost',               'without power',
]

const PERSIST_KEY = 'sci_cockpit_v2'

function defaultState() {
  return {
    // WHO
    rejections:    [],
    archetype:     null,
    traits:        { poetic: 50, streetwise: 50, spiritual: 30, wounded: 50 },
    // WHAT
    mainIdea:      '',
    emotionalTruth:'',
    socialConflict:'',
    referenceText: '',
    subThemes:     [],
    // HOW
    energy:        60,
    rawness:       50,
    rhymeScheme:   'ABAB',
    perspective:   '1st',
    languageMix:   ['en'],
  }
}

function inferEmotion(state) {
  const { rejections, emotionalTruth, traits } = state
  if (emotionalTruth.toLowerCase().match(/angry|rage|hate|mad|furious/)) return 'anger'
  if (emotionalTruth.toLowerCase().match(/sad|hurt|broken|lost|empty/))  return 'sadness'
  if (rejections.length >= 3) return 'defiance'
  if (traits.wounded > 70)    return 'vulnerability'
  if (traits.spiritual > 70)  return 'longing'
  return 'determination'
}

export default function Cockpit({ onDone }) {
  const [s, setS] = useState(() => {
    try {
      const saved = localStorage.getItem(PERSIST_KEY)
      return saved ? { ...defaultState(), ...JSON.parse(saved) } : defaultState()
    } catch { return defaultState() }
  })
  const [igniting, setIgniting] = useState(false)

  // Auto-save every 2s
  useEffect(() => {
    const id = setTimeout(() => {
      try { localStorage.setItem(PERSIST_KEY, JSON.stringify(s)) } catch {}
    }, 2000)
    return () => clearTimeout(id)
  }, [s])

  const upd = useCallback((patch) => setS(prev => ({ ...prev, ...patch })), [])
  const updTrait = (key, val) => upd({ traits: { ...s.traits, [key]: val } })
  const toggleRejection = (chip) => upd({
    rejections: s.rejections.includes(chip)
      ? s.rejections.filter(r => r !== chip)
      : [...s.rejections, chip]
  })

  const canIgnite = s.mainIdea.trim().length > 4 || s.emotionalTruth.trim().length > 4

  function handleIgnite() {
    if (!canIgnite || igniting) return
    setIgniting(true)
    setTimeout(() => {
      const whoAreYouNot = s.rejections.length > 0
        ? `I am not ${s.rejections.join(', not ')}`
        : ''
      onDone({
        whoAreYouNot,
        mainIdea:       s.mainIdea,
        emotionalTruth: s.emotionalTruth,
        socialConflict: s.socialConflict,
        referenceText:  s.referenceText,
        overrides: {
          rawness:      s.rawness,
          energyValue:  s.energy,
          rhymeScheme:  s.rhymeScheme,
          perspective:  s.perspective,
          languageMix:  s.languageMix,
          traitWeights: s.traits,
          archetype:    s.archetype,
          subThemes:    s.subThemes,
        },
      })
    }, 800)
  }

  const dominantEmotion = inferEmotion(s)

  return (
    <>
      <PersonaLiveBar
        archetype={s.archetype}
        dominantEmotion={dominantEmotion}
        languageMix={s.languageMix}
        energy={s.energy}
        rawness={s.rawness}
      />

      <div className={styles.cockpit}>

        {/* ── LEFT PANEL: WHO ─────────────────────────────────────── */}
        <div className={styles.panel}>
          <SectionHeader label="WHO" sub="your identity" />

          <FieldBlock label="I AM NOT...">
            <div className={styles.chipGrid}>
              {REJECTION_CHIPS.map(chip => (
                <button
                  key={chip}
                  className={[styles.rejectChip, s.rejections.includes(chip) ? styles.chipActive : ''].join(' ')}
                  onClick={() => toggleRejection(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </FieldBlock>

          <FieldBlock label="ARCHETYPE">
            <ArchetypeGrid value={s.archetype} onChange={a => upd({ archetype: a })} />
            {!s.archetype && (
              <p className={styles.autoNote}>↑ leave blank to auto-detect from your answers</p>
            )}
          </FieldBlock>

          <FieldBlock label="TRAIT WEIGHTS">
            <div className={styles.knobs}>
              {Object.entries(s.traits).map(([key, val]) => (
                <KnobSlider
                  key={key}
                  label={key}
                  value={val}
                  onChange={v => updTrait(key, v)}
                />
              ))}
            </div>
          </FieldBlock>
        </div>

        {/* ── CENTRE PANEL: WHAT ──────────────────────────────────── */}
        <div className={[styles.panel, styles.panelCentre].join(' ')}>
          <SectionHeader label="WHAT" sub="your message" />

          <FieldBlock label="CORE MESSAGE *">
            <textarea
              className={styles.textarea}
              placeholder="If this song could say ONE thing — what would it be?&#10;&#10;Strip everything. What is the spine?"
              value={s.mainIdea}
              onChange={e => upd({ mainIdea: e.target.value })}
              rows={4}
            />
          </FieldBlock>

          <FieldBlock label="EMOTIONAL TRUTH *">
            <textarea
              className={[styles.textarea, styles.textareaMagenta].join(' ')}
              placeholder="The emotion you haven't said out loud. The 2am feeling."
              value={s.emotionalTruth}
              onChange={e => upd({ emotionalTruth: e.target.value })}
              rows={3}
            />
          </FieldBlock>

          <FieldBlock label="SOCIAL CONFLICT">
            <textarea
              className={styles.textarea}
              placeholder="What does the world get wrong about you?"
              value={s.socialConflict}
              onChange={e => upd({ socialConflict: e.target.value })}
              rows={3}
            />
          </FieldBlock>

          <FieldBlock label="SUB-THEMES">
            <ThemeChips value={s.subThemes} onChange={t => upd({ subThemes: t })} />
          </FieldBlock>

          <FieldBlock label="REFERENCE TEXT">
            <ReferenceDropZone
              value={s.referenceText}
              onChange={t => upd({ referenceText: t })}
            />
          </FieldBlock>
        </div>

        {/* ── RIGHT PANEL: HOW ────────────────────────────────────── */}
        <div className={styles.panel}>
          <SectionHeader label="HOW" sub="your sound" />

          <FieldBlock label="ENERGY / RAWNESS">
            <div className={styles.knobs}>
              <KnobSlider label="Energy" value={s.energy} onChange={v => upd({ energy: v })} />
              <KnobSlider label="Rawness" value={s.rawness} onChange={v => upd({ rawness: v })} />
            </div>
          </FieldBlock>

          <FieldBlock label="LANGUAGE MIX">
            <LanguageToggle value={s.languageMix} onChange={l => upd({ languageMix: l })} />
          </FieldBlock>

          <FieldBlock label="PERSPECTIVE">
            <div className={styles.pills}>
              {['1st','2nd','3rd'].map(p => (
                <button
                  key={p}
                  className={[styles.pill, s.perspective === p ? styles.pillActive : ''].join(' ')}
                  onClick={() => upd({ perspective: p })}
                >
                  {p} person
                </button>
              ))}
            </div>
          </FieldBlock>

          <FieldBlock label="RHYME SCHEME">
            <RhymeSwatch value={s.rhymeScheme} onChange={r => upd({ rhymeScheme: r })} />
          </FieldBlock>

          <div className={styles.previewBox}>
            <div className={styles.previewLabel}>CURRENT CONFIG</div>
            <ConfigLine k="Energy"  v={`${s.energy}/100`} />
            <ConfigLine k="Rawness" v={`${s.rawness}/100 — ${rawLabel(s.rawness)}`} />
            <ConfigLine k="Voice"   v={`${s.perspective} person`} />
            <ConfigLine k="Rhyme"   v={s.rhymeScheme} />
            <ConfigLine k="Langs"   v={s.languageMix.map(l => l.toUpperCase()).join(' + ')} />
            {s.archetype && <ConfigLine k="Arch" v={s.archetype} />}
          </div>
        </div>
      </div>

      {/* ── IGNITE BUTTON ─────────────────────────────────────── */}
      <div className={styles.igniteDock}>
        <button
          className={[styles.igniteBtn, igniting ? styles.igniting : ''].join(' ')}
          onClick={handleIgnite}
          disabled={!canIgnite}
        >
          {igniting ? 'BUILDING PERSONA...' : 'IGNITE →'}
        </button>
        {!canIgnite && (
          <p className={styles.igniteHint}>Fill in at least a core message or emotional truth to proceed</p>
        )}
      </div>
    </>
  )
}

function SectionHeader({ label, sub }) {
  return (
    <div className={styles.panelHeader}>
      <span className={styles.panelLabel}>{label}</span>
      <span className={styles.panelSub}>{sub}</span>
    </div>
  )
}

function FieldBlock({ label, children }) {
  return (
    <div className={styles.fieldBlock}>
      <div className={styles.fieldLabel}>{label}</div>
      {children}
    </div>
  )
}

function ConfigLine({ k, v }) {
  return (
    <div className={styles.configLine}>
      <span className={styles.configKey}>{k}</span>
      <span className={styles.configVal}>{v}</span>
    </div>
  )
}

function rawLabel(v) {
  if (v < 30) return 'polished'
  if (v < 60) return 'honest'
  return 'unfiltered'
}
