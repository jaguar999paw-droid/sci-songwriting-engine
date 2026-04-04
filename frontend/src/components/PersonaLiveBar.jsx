/** PersonaLiveBar.jsx — Fixed top bar showing live persona snapshot */
import styles from './PersonaLiveBar.module.css'

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

export default function PersonaLiveBar({ archetype, dominantEmotion, languageMix, energy, rawness }) {
  const emoji = archetype ? (ARCHETYPE_EMOJI[archetype] || '◈') : '◈'

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.emoji}>{emoji}</span>
        <span className={styles.archetype}>{archetype || 'AUTO-DETECT'}</span>
      </div>
      <div className={styles.centre}>
        {dominantEmotion && <Tag label="EMOTION" value={dominantEmotion} color="var(--magenta)" />}
        {languageMix?.length > 0 && <Tag label="LANG" value={languageMix.map(l => l.toUpperCase()).join('+')} color="var(--green)" />}
      </div>
      <div className={styles.right}>
        {energy != null && <Meter label="NRG" value={energy} />}
        {rawness != null && <Meter label="RAW" value={rawness} color="var(--magenta)" />}
      </div>
    </div>
  )
}

function Tag({ label, value, color = 'var(--green)' }) {
  return (
    <span className={styles.tag} style={{ '--c': color }}>
      <span className={styles.tagLabel}>{label}</span>
      <span className={styles.tagValue}>{value}</span>
    </span>
  )
}

function Meter({ label, value, color = 'var(--green)' }) {
  return (
    <span className={styles.meter}>
      <span className={styles.meterLabel}>{label}</span>
      <span className={styles.meterTrack}>
        <span className={styles.meterFill} style={{ width: `${value}%`, background: color }} />
      </span>
      <span className={styles.meterVal} style={{ color }}>{value}</span>
    </span>
  )
}
