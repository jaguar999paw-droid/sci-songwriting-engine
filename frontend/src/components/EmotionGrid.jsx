/**
 * EmotionGrid.jsx — Phase 2 emotion selector
 * 
 * 2×4 grid of emoji+label chips. Tapping an emotion sets primary,
 * second tap adds to secondary (max 3). Third tap deselects.
 */
import styles from './EmotionGrid.module.css'

const EMOTIONS = [
  { key: 'anger',         emoji: '😤', label: 'Anger' },
  { key: 'sadness',       emoji: '😢', label: 'Sadness' },
  { key: 'defiance',      emoji: '✊', label: 'Defiance' },
  { key: 'longing',       emoji: '🌙', label: 'Longing' },
  { key: 'pride',         emoji: '💪', label: 'Pride' },
  { key: 'confusion',     emoji: '😕', label: 'Confusion' },
  { key: 'joy',           emoji: '✨', label: 'Joy' },
  { key: 'vulnerability', emoji: '🫀', label: 'Vulnerability' },
]

export default function EmotionGrid({ primary, secondary = [], onChange }) {
  function handleClick(key) {
    if (primary === key) {
      // deselect primary — promote first secondary or clear
      const newPrimary    = secondary[0] || null
      const newSecondary  = secondary.slice(1)
      onChange({ primary: newPrimary, secondary: newSecondary })
    } else if (secondary.includes(key)) {
      // deselect from secondary
      onChange({ primary, secondary: secondary.filter(k => k !== key) })
    } else if (!primary) {
      // set as primary
      onChange({ primary: key, secondary })
    } else {
      // add to secondary (max 3)
      if (secondary.length < 3) {
        onChange({ primary, secondary: [...secondary, key] })
      }
    }
  }

  return (
    <div className={styles.grid}>
      {EMOTIONS.map(({ key, emoji, label }) => {
        const isPrimary   = primary === key
        const secIndex    = secondary.indexOf(key)
        const isSecondary = secIndex !== -1
        return (
          <button
            key={key}
            className={[
              styles.chip,
              isPrimary   ? styles.primary   : '',
              isSecondary ? styles.secondary : '',
            ].join(' ')}
            onClick={() => handleClick(key)}
            title={isPrimary ? 'Primary emotion (click to remove)' : isSecondary ? `Secondary #${secIndex+1} (click to remove)` : 'Click to select'}
          >
            <span className={styles.emoji}>{emoji}</span>
            <span className={styles.label}>{label}</span>
            {isPrimary   && <span className={styles.badge}>1</span>}
            {isSecondary && <span className={styles.badge}>{secIndex + 2}</span>}
          </button>
        )
      })}
      {primary && (
        <p className={styles.hint}>
          Primary: <strong>{primary}</strong>
          {secondary.length > 0 && <> · Also: {secondary.join(', ')}</>}
        </p>
      )}
    </div>
  )
}
