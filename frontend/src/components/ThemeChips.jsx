/** ThemeChips.jsx — Multi-select sub-theme chips */
import styles from './ThemeChips.module.css'

const THEMES = [
  { id: 'place',          label: '📍 Place' },
  { id: 'love',           label: '❤ Love' },
  { id: 'transformation', label: '🔄 Change' },
  { id: 'society',        label: '👁 Society' },
  { id: 'rejection',      label: '✊ Rejection' },
  { id: 'duality',        label: '⚖ Duality' },
  { id: 'ancestral',      label: '🌿 Roots' },
  { id: 'desire',         label: '🌙 Desire' },
  { id: 'isolation',      label: '🔇 Isolation' },
  { id: 'pride',          label: '💎 Pride' },
]

export default function ThemeChips({ value = [], onChange }) {
  function toggle(id) {
    const next = value.includes(id)
      ? value.filter(v => v !== id)
      : [...value, id]
    onChange(next)
  }
  return (
    <div className={styles.chips}>
      {THEMES.map(t => (
        <button
          key={t.id}
          className={[styles.chip, value.includes(t.id) ? styles.selected : ''].join(' ')}
          onClick={() => toggle(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
