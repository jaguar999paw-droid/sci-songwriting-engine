/** LanguageToggle.jsx — EN/SW/SH independent toggles */
import styles from './LanguageToggle.module.css'

const LANGS = [
  { id: 'en', label: 'EN', full: 'English' },
  { id: 'sw', label: 'SW', full: 'Kiswahili' },
  { id: 'sh', label: 'SH', full: 'Sheng' },
]

export default function LanguageToggle({ value = ['en'], onChange }) {
  function toggle(id) {
    const next = value.includes(id)
      ? value.filter(v => v !== id)
      : [...value, id]
    // At least one must be active
    if (next.length > 0) onChange(next)
  }

  return (
    <div className={styles.group}>
      {LANGS.map(l => (
        <button
          key={l.id}
          className={[styles.btn, value.includes(l.id) ? styles.active : ''].join(' ')}
          onClick={() => toggle(l.id)}
          title={l.full}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
