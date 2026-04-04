/** RhymeSwatch.jsx — 5 coloured rhyme scheme selectors */
import styles from './RhymeSwatch.module.css'

const SCHEMES = [
  { id: 'AABB',     label: 'AABB',     color: '#00ff88', desc: 'Couplet' },
  { id: 'ABAB',     label: 'ABAB',     color: '#ff00aa', desc: 'Alternating' },
  { id: 'ABCB',     label: 'ABCB',     color: '#ffaa00', desc: 'Ballad' },
  { id: 'AAAA',     label: 'AAAA',     color: '#ff3355', desc: 'Monorhyme' },
  { id: 'INTERNAL', label: 'INT.',     color: '#00aaff', desc: 'Internal' },
  { id: 'FREE',     label: 'FREE',     color: '#808090', desc: 'Free Verse' },
]

export default function RhymeSwatch({ value, onChange }) {
  return (
    <div className={styles.swatches}>
      {SCHEMES.map(s => (
        <button
          key={s.id}
          className={[styles.swatch, value === s.id ? styles.selected : ''].join(' ')}
          style={{ '--c': s.color }}
          onClick={() => onChange(s.id)}
          title={s.desc}
        >
          <span className={styles.code}>{s.label}</span>
          <span className={styles.name}>{s.desc}</span>
        </button>
      ))}
    </div>
  )
}
