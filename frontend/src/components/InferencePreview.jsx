/**
 * InferencePreview.jsx — Engine inference display after text submission
 *
 * Shows what the engine detected from free text. Each item is clickable
 * to override. This is the "Habitat episode metadata" pattern:
 * surface the agent's understanding of its own state, allow correction.
 */
import { useState } from 'react'
import styles from './InferencePreview.module.css'

const CONFIDENCE_LABEL = (c) => c >= 0.8 ? 'strong' : c >= 0.5 ? 'likely' : 'uncertain'
const CONFIDENCE_CLASS = (c) => c >= 0.8 ? styles.strong : c >= 0.5 ? styles.likely : styles.uncertain

const RELATION_COLORS = {
  CONTRADICTION: '#ff3333',
  CONTRARY:      '#ff9900',
  SUBCONTRARY:   '#aa33ff',
  NEUTRAL:       '#666',
}

export default function InferencePreview({ parsed, propertyConfidence = {}, tensionSummary, onOverride }) {
  const [expanded, setExpanded] = useState(false)
  if (!parsed) return null

  const { emotions, conflicts, traits, languageMix, temporalProfile } = parsed
  const relation     = temporalProfile?.logicalRelation?.relation || 'NEUTRAL'
  const conflictPct  = Math.round((temporalProfile?.conflictScore || 0) * 100)
  const primaryEmotion = emotions?.[0]
  const primaryConflict = conflicts?.[0]

  return (
    <div className={styles.preview}>
      <div className={styles.header} onClick={() => setExpanded(e => !e)}>
        <span className={styles.title}>ENGINE DETECTED</span>
        <span className={styles.toggle}>{expanded ? '▲' : '▼'}</span>
      </div>

      <div className={styles.chips}>
        {primaryEmotion && (
          <Chip
            label={`${primaryEmotion.emotion} (${Math.round(primaryEmotion.intensity * 100)}%)`}
            category="EMOTION"
            confidence={propertyConfidence.primary_emotion}
            onOverride={() => onOverride?.('primary_emotion')}
          />
        )}
        {primaryConflict && (
          <Chip
            label={primaryConflict.type.replace(/_/g, ' ')}
            category="CONFLICT"
            confidence={propertyConfidence.dominant_conflict}
            onOverride={() => onOverride?.('archetype')}
          />
        )}
        <Chip
          label={relation}
          category="TENSION"
          confidence={temporalProfile?.logicalRelation?.confidence}
          color={RELATION_COLORS[relation]}
          onOverride={() => onOverride?.('logical_relation')}
        />
        <Chip
          label={`${conflictPct}% tension`}
          category="SCORE"
          confidence={0.9}
          onOverride={null}
        />
        {languageMix?.sheng && (
          <Chip label="Sheng detected" category="LANG" confidence={0.9} onOverride={() => onOverride?.('language_mix')} />
        )}
        {languageMix?.kiswahili && (
          <Chip label="Kiswahili detected" category="LANG" confidence={0.8} onOverride={() => onOverride?.('language_mix')} />
        )}
        {temporalProfile?.temporal?.dominant && (
          <Chip
            label={`${temporalProfile.temporal.dominant} self dominant`}
            category="TIME"
            confidence={propertyConfidence.temporal_dominant}
            onOverride={() => onOverride?.('temporal_dominant')}
          />
        )}
      </div>

      {expanded && (
        <div className={styles.detail}>
          {traits?.length > 0 && (
            <div className={styles.row}>
              <span className={styles.dk}>Traits</span>
              <span className={styles.dv}>{traits.join(' · ')}</span>
            </div>
          )}
          {emotions?.slice(1, 3).length > 0 && (
            <div className={styles.row}>
              <span className={styles.dk}>Secondary emotions</span>
              <span className={styles.dv}>{emotions.slice(1,3).map(e => e.emotion).join(' · ')}</span>
            </div>
          )}
          {tensionSummary && tensionSummary !== 'No cross-property tensions detected' && (
            <div className={styles.row}>
              <span className={styles.dk}>Property tensions</span>
              <span className={[styles.dv, styles.tension].join(' ')}>{tensionSummary}</span>
            </div>
          )}
          {temporalProfile?.temporalSummary && (
            <div className={styles.row}>
              <span className={styles.dk}>Temporal</span>
              <span className={styles.dv}>{temporalProfile.temporalSummary}</span>
            </div>
          )}
          <p className={styles.overrideHint}>Tap any chip above to override a detected value</p>
        </div>
      )}
    </div>
  )
}

function Chip({ label, category, confidence, color, onOverride }) {
  return (
    <button
      className={[styles.chip, onOverride ? styles.clickable : ''].join(' ')}
      style={color ? { borderColor: color, color } : {}}
      onClick={onOverride || undefined}
      title={confidence != null ? `Confidence: ${CONFIDENCE_LABEL(confidence)}` : undefined}
    >
      <span className={styles.cat}>{category}</span>
      <span className={styles.val}>{label}</span>
      {confidence != null && (
        <span className={[styles.conf, CONFIDENCE_CLASS(confidence)].join(' ')} />
      )}
    </button>
  )
}
