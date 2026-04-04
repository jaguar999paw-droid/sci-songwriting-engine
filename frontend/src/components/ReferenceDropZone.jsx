/** ReferenceDropZone.jsx — Paste reference lyrics; detects rhyme/tone/vocab */
import { useState, useEffect } from 'react'
import styles from './ReferenceDropZone.module.css'

function quickDetect(text) {
  if (!text || text.trim().length < 20) return null
  const lines = text.trim().split('\n').filter(l => l.trim())
  // Simple end-word rhyme detector
  const ends = lines.map(l => l.trim().split(/\s+/).pop()?.toLowerCase().replace(/[^a-z]/g, '') || '')
  const rhymes = {}
  ends.forEach(w => { rhymes[w] = (rhymes[w] || 0) + 1 })
  const dominated = Object.values(rhymes).filter(c => c >= 2).length
  const scheme = dominated >= lines.length * 0.6 ? 'AAAA' : dominated >= 2 ? 'ABAB' : 'FREE'
  // Vocab level
  const words = text.toLowerCase().split(/\s+/)
  const shengHits = words.filter(w => ['manze','buda','niaje','poa','fiti','mtaa','dame','chali','sema'].includes(w)).length
  const vocab = shengHits >= 2 ? 'street' : words.some(w => w.length > 9) ? 'elevated' : 'mixed'
  return { scheme, vocab, lineCount: lines.length }
}

export default function ReferenceDropZone({ value, onChange }) {
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setPreview(quickDetect(value)), 600)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className={styles.zone}>
      <textarea
        className={styles.textarea}
        placeholder="Paste reference lyrics or a song you admire here&#10;&#10;The engine will extract its rhyme pattern, vocabulary level and tonal register to influence your song's style."
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={5}
      />
      {preview && (
        <div className={styles.preview}>
          <span className={styles.pill}>Rhyme: <b>{preview.scheme}</b></span>
          <span className={styles.pill}>Vocab: <b>{preview.vocab}</b></span>
          <span className={styles.pill}>{preview.lineCount} lines</span>
        </div>
      )}
    </div>
  )
}
