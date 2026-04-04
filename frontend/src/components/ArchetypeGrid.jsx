/** ArchetypeGrid.jsx — 8 archetype cards, single-select */
import styles from './ArchetypeGrid.module.css'

const ARCHETYPES = [
  { id: 'The Defiant',       emoji: '⚡', desc: 'refuses definition' },
  { id: 'The Misunderstood', emoji: '🌊', desc: 'seen wrong, speaks truth' },
  { id: 'The Transformer',   emoji: '🔥', desc: 'becoming someone else' },
  { id: 'The Seeker',        emoji: '🔍', desc: 'searching for an answer' },
  { id: 'The Bridge Walker', emoji: '🌉', desc: 'between two worlds' },
  { id: 'The Lone Voice',    emoji: '🎤', desc: 'speaking into silence' },
  { id: 'The Heir',          emoji: '👑', desc: 'carrying the past' },
  { id: 'The Grounded',      emoji: '🌍', desc: 'rooted in place' },
]

export default function ArchetypeGrid({ value, onChange }) {
  return (
    <div className={styles.grid}>
      {ARCHETYPES.map(a => (
        <button key={a.id}
          className={[styles.card, value === a.id ? styles.selected : ''].join(' ')}
          onClick={() => onChange(value === a.id ? null : a.id)} title={a.desc}>
          <span className={styles.emoji}>{a.emoji}</span>
          <span className={styles.name}>{a.id}</span>
          <span className={styles.desc}>{a.desc}</span>
        </button>
      ))}
    </div>
  )
}