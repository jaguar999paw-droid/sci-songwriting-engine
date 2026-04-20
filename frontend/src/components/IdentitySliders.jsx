/**
 * IdentitySliders.jsx — Phase 3 mixing console
 *
 * 4 labelled sliders presented as a visual mixing board.
 * The user is not answering questions — they are mixing their identity.
 * Each slider has a real-time semantic label that updates as the handle moves.
 */
import styles from './IdentitySliders.module.css'

const SLIDERS = [
  {
    key:   'rawness',
    label: 'RAWNESS',
    left:  'Polished',
    right: 'Unfiltered',
    color: 'var(--color-accent)',
    describe: v => v < 30 ? 'Metaphorical · Indirect' : v < 60 ? 'Honest · Grounded' : 'Confessional · Blunt',
  },
  {
    key:   'decisiveness',
    label: 'CERTAINTY',
    left:  'Lost',
    right: 'Certain',
    color: 'var(--color-magenta, #ff00ff)',
    describe: v => v < 30 ? 'I don\'t know who I am' : v < 70 ? 'I know, but I still question' : 'I know exactly who I am',
  },
  {
    key:   'attribution',
    label: 'FAULT',
    left:  'Theirs',
    right: 'Mine',
    color: '#ff9900',
    describe: v => v < 30 ? 'External — it\'s their fault' : v < 70 ? 'Shared — both sides' : 'Internal — I own this',
  },
  {
    key:   'vulnerability_level',
    label: 'EXPOSURE',
    left:  'Armoured',
    right: 'Naked',
    color: '#aa33ff',
    describe: v => v < 30 ? 'Protected · Detached' : v < 70 ? 'Present · Honest' : 'Fully exposed · No armour',
  },
]

export default function IdentitySliders({ values = {}, onChange }) {
  function handleChange(key, val) {
    onChange({ ...values, [key]: Number(val) })
  }

  return (
    <div className={styles.console}>
      {SLIDERS.map(({ key, label, left, right, color, describe }) => {
        const val = values[key] ?? 50
        return (
          <div key={key} className={styles.track}>
            <div className={styles.trackHeader}>
              <span className={styles.trackLabel} style={{ color }}>{label}</span>
              <span className={styles.trackDesc}>{describe(val)}</span>
            </div>
            <div className={styles.sliderRow}>
              <span className={styles.pole}>{left}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={val}
                className={styles.slider}
                style={{ '--track-color': color }}
                onChange={e => handleChange(key, e.target.value)}
              />
              <span className={styles.pole}>{right}</span>
            </div>
            <div className={styles.fill} style={{ width: `${val}%`, background: color }} />
          </div>
        )
      })}
    </div>
  )
}
