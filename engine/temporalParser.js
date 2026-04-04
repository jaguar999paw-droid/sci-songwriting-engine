/**
 * temporalParser.js — SCI PIRE Layer (Temporal + Logical Relations)
 *
 * Extracted from the Pluggable Identity Reasoning Engine (PIRE) proposal.
 * Implements the accepted subset: temporal classification + logical relation detection.
 *
 * WHAT THIS DOES:
 *   1. Classifies identity statements across Past / Present / Future
 *   2. Detects logical relations: CONTRADICTION, CONTRARY, SUBCONTRARY, NEUTRAL
 *   3. Computes conflict score and tension weight (identity metrics)
 *   4. Returns a temporalProfile that structurePlanner and promptBuilder can consume
 *
 * WHAT THIS DELIBERATELY DOES NOT DO:
 *   - Identity graph traversal (too costly for real-time pipeline)
 *   - Future path simulation (requires separate UI flow)
 *   - Persona type transformation (handled by personaBuilder/styleMapper)
 *
 * PHILOSOPHICAL GROUNDING:
 *   Aristotle's Potentiality vs Actuality → Past=Actual, Future=Potential
 *   Dialectics (Hegel) → PAST(thesis) × PRESENT(antithesis) → FUTURE(synthesis)
 *   Subcontrary logic → Both truths can coexist (the bridge moment)
 */

const PAST_SIGNALS = [
  'used to', 'before i', 'i was', 'when i was', 'back then', 'once i',
  'i had', 'we had', 'those days', 'i remember', 'the old me',
  'i lost', 'i gave', 'i left', 'i used to be', 'i became',
  'growing up', 'as a child', 'years ago', 'yesterday',
  'nilikuwa', 'zamani', 'hapo awali', 'wakati ule', 'kabla',
]

const PRESENT_SIGNALS = [
  'i am', "i'm", 'right now', 'today', 'i stand', 'i know', 'i see',
  'i feel', 'i carry', 'i hold', 'i refuse', 'i choose',
  'i face', 'this is', 'here i am', 'now i', 'still i',
  'sasa', 'leo', 'mimi ni', 'niko', 'ninajua', 'naona',
]

const FUTURE_SIGNALS = [
  'i will', "i'll", 'one day', 'someday', 'i want to become',
  'i hope to', 'i dream of', 'going to', 'tomorrow', 'i plan',
  'i will be', 'i am becoming', 'the person i', 'my future',
  'when i grow', 'what i want', 'where i am going',
  'nitakuwa', 'kesho', 'wakati ujao', 'ndoto yangu',
]

/**
 * Classify the logical relation between what the user IS and what they REJECT.
 *
 * CONTRADICTION: A vs NOT-A — max tension → hook / double-hook
 * CONTRARY: A vs B, both can't be true → verse poles
 * SUBCONTRARY: both can be true → bridge / spoken-word
 * NEUTRAL: no significant tension
 */
function classifyLogicalRelation(emotions, conflicts, traits, rawInputs) {
  const text = Object.values(rawInputs).join(' ').toLowerCase()

  const hasDirectNegation = (
    /\bi am not\b|\bi'm not\b/.test(text) &&
    /\bi am\b|\bi'm\b/.test(text)
  )
  const hasIdentityRejection = conflicts.some(c => c.type === 'identity_rejection')
  const emotionLabels = emotions.map(e => e.emotion || e)
  const hasOpposingEmotions = (
    (emotionLabels.includes('anger') && emotionLabels.includes('vulnerability')) ||
    (emotionLabels.includes('pride') && emotionLabels.includes('sadness')) ||
    (emotionLabels.includes('defiance') && emotionLabels.includes('longing'))
  )

  if (hasDirectNegation && hasIdentityRejection) return { relation: 'CONTRADICTION', confidence: 0.9 }
  if (hasDirectNegation || (hasIdentityRejection && hasOpposingEmotions)) return { relation: 'CONTRADICTION', confidence: 0.7 }

  const isDuality = conflicts.some(c => c.type === 'duality')
  const hasComplexity = /\bboth\b|\band yet\b|\bat the same time\b|\beven though\b|\bdespite\b|\bstill i\b/.test(text)
  const hasAncestralDuality = conflicts.some(c => c.type === 'ancestral_tension' || c.type === 'place_identity')

  if (isDuality || (hasComplexity && emotionLabels.length >= 3)) return { relation: 'SUBCONTRARY', confidence: 0.8 }
  if (hasOpposingEmotions && hasAncestralDuality) return { relation: 'SUBCONTRARY', confidence: 0.7 }
  if (hasOpposingEmotions) return { relation: 'SUBCONTRARY', confidence: 0.6 }

  const hasTransformation = conflicts.some(c => c.type === 'transformation' || c.type === 'stagnation')
  const hasBecomingLanguage = /\bbecom(ing|e)\b|\bno longer\b|\bchanged\b|\bwas once\b/.test(text)

  if (hasTransformation || hasBecomingLanguage) return { relation: 'CONTRARY', confidence: 0.75 }
  if (conflicts.some(c => c.type === 'external_judgment')) return { relation: 'CONTRARY', confidence: 0.6 }

  return { relation: 'NEUTRAL', confidence: 0.5 }
}

function classifyTemporalLayers(text) {
  const lower = text.toLowerCase()
  const sentences = lower.split(/[.!?]+/).filter(s => s.trim().length > 4)
  const layers = { past: [], present: [], future: [] }

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (PAST_SIGNALS.some(s    => sentence.includes(s))) layers.past.push(trimmed)
    if (PRESENT_SIGNALS.some(s => sentence.includes(s))) layers.present.push(trimmed)
    if (FUTURE_SIGNALS.some(s  => sentence.includes(s))) layers.future.push(trimmed)
  }

  const counts = { past: layers.past.length, present: layers.present.length, future: layers.future.length }
  const dominant = Object.entries(counts).sort(([,a], [,b]) => b - a)[0][0]

  return {
    layers, counts, dominant,
    spread: Object.values(counts).filter(c => c > 0).length,
    hasFullArc: counts.past > 0 && counts.present > 0 && counts.future > 0,
  }
}

/**
 * Conflict Score: |Actual - Potential| approximation.
 * Range 0.0–1.0. Feeds into prompt intensity directives.
 */
function computeConflictScore(emotions, conflicts, rawInputs) {
  const text = Object.values(rawInputs).join(' ').toLowerCase()
  let score = 0

  const rejectionCount = (text.match(/\bi am not\b|\bi'm not\b|\bnever been\b|\bdon't call me\b/g) || []).length
  score += Math.min(rejectionCount * 0.15, 0.3)
  score += Math.min(conflicts.length * 0.1, 0.3)

  if (emotions.length > 0) {
    const topIntensity = emotions[0].intensity ?? emotions[0].score ?? 0.5
    score += topIntensity * 0.2
  }

  const emotionLabels = emotions.map(e => e.emotion || e)
  if (
    (emotionLabels.includes('anger') && emotionLabels.includes('vulnerability')) ||
    (emotionLabels.includes('pride') && emotionLabels.includes('sadness'))
  ) score += 0.2

  return Math.min(score, 1.0)
}

const SECTION_TENSION_WEIGHTS = {
  'hook': 1.0, 'pre-hook': 0.8, 'bridge': 0.9,
  'spoken-word': 0.95, 'call-and-response': 0.85,
  'verse': 0.6, 'intro': 0.3, 'outro': 0.4,
}

function getTensionWeight(sectionType) {
  return SECTION_TENSION_WEIGHTS[sectionType] || 0.5
}

function getTemporalSectionRecommendations(temporalProfile, logicalRelation) {
  const recs = []
  if (temporalProfile.counts.past > 0)   recs.push({ type: 'verse_memory',       reason: 'past temporal layer detected', priority: 1 })
  if (temporalProfile.counts.future > 0) recs.push({ type: 'bridge_realization', reason: 'future projection detected',   priority: 2 })
  if (logicalRelation.relation === 'CONTRARY' && temporalProfile.counts.future > 0)
    recs.push({ type: 'outro_resolution', reason: 'future + contrary = dialectical resolution', priority: 3 })
  if (logicalRelation.relation === 'CONTRADICTION')
    recs.push({ type: 'hook_declaration', reason: 'CONTRADICTION forces declarative hook', priority: 0 })
  if (logicalRelation.relation === 'SUBCONTRARY')
    recs.push({ type: 'spoken_word', reason: 'SUBCONTRARY — paradox needs prose delivery', priority: 2 })
  if (temporalProfile.hasFullArc)
    recs.push({ type: 'call_and_response', reason: 'full temporal arc = ritual call-and-response', priority: 3 })
  return recs.sort((a, b) => a.priority - b.priority)
}

function parseTemporalIdentity(rawInputs, emotions = [], conflicts = []) {
  const fullText = Object.values(rawInputs).join(' ')
  const temporalLayers  = classifyTemporalLayers(fullText)
  const logicalRelation = classifyLogicalRelation(emotions, conflicts, [], rawInputs)
  const conflictScore   = computeConflictScore(emotions, conflicts, rawInputs)
  const sectionRecommendations = getTemporalSectionRecommendations(temporalLayers, logicalRelation)

  const parts = []
  if (temporalLayers.counts.past    > 0) parts.push(`Past self is present (${temporalLayers.counts.past} ref)`)
  if (temporalLayers.counts.present > 0) parts.push(`Present self is speaking (${temporalLayers.counts.present} stmt)`)
  if (temporalLayers.counts.future  > 0) parts.push(`Future self is projected (${temporalLayers.counts.future} proj)`)
  parts.push(`Logical relation: ${logicalRelation.relation} (${Math.round(logicalRelation.confidence * 100)}%)`)
  parts.push(`Conflict score: ${Math.round(conflictScore * 100)}/100`)

  return {
    temporal: temporalLayers,
    logicalRelation,
    conflictScore: Math.round(conflictScore * 100) / 100,
    temporalSummary: parts.join(' | '),
    sectionRecommendations,
  }
}

module.exports = {
  parseTemporalIdentity,
  classifyTemporalLayers,
  classifyLogicalRelation,
  computeConflictScore,
  getTensionWeight,
  getTemporalSectionRecommendations,
}