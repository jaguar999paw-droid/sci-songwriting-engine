/**
 * propertyTensionEngine.js — SCI Cross-Property Tension Detector v1
 *
 * Extends PIRE beyond sentence-level to property-level contradictions.
 * Detects when user-set sliders + engine-inferred properties create
 * structural tensions that should influence the song's architecture.
 *
 * Tension types returned:
 *   CERTAIN_AND_DIVIDED  — decisiveness > 70 + attribution near 50 (knows who they are but can't assign blame)
 *   RAW_AND_POLISHED     — rawness > 75 + diction_level = 'elevated' (wants to confess in formal language)
 *   PROUD_AND_EXPOSED    — primary_emotion = pride + vulnerability_level > 70
 *   FORWARD_STUCK        — change_direction = 'forward' + conflict type = 'stagnation'
 *   RIGHTEOUS_GREY       — narrator_morality = 'righteous' + attribution < 30 (blaming others, claims righteousness)
 *   ABSOLUTION_DEFIANT   — absolution_seeking = true + primary_emotion = 'defiance'
 *   PAST_HEAVY_FUTURE    — past_actual_weight > 0.8 + change_direction = 'forward'
 */

const TENSION_DEFINITIONS = {
  CERTAIN_AND_DIVIDED: {
    label: 'Certain but divided',
    description: 'Speaker knows who they are but cannot assign responsibility. Song should hold both certainty and ambiguity simultaneously.',
    craftSuggestion: { resolution: 'ambiguous', narratorMorality: 'morally_grey' },
    structureSuggestion: 'spoken_word',
  },
  RAW_AND_POLISHED: {
    label: 'Raw confession in formal dress',
    description: 'Contradiction between desire to be blunt and formal diction. Use diction as armour the speaker is consciously choosing to remove.',
    craftSuggestion: { dictionLevel: 'mixed', grammarIntentionality: 'intentional_breaks' },
    structureSuggestion: 'bridge_surrender',
  },
  PROUD_AND_EXPOSED: {
    label: 'Pride concealing wound',
    description: 'Pride is a defence mechanism. The vulnerability is the deeper truth. Song should let the pride crack at the bridge.',
    craftSuggestion: { momentum: 'release', rhetoricalDevices: ['synecdoche'] },
    structureSuggestion: 'bridge_surrender',
  },
  FORWARD_STUCK: {
    label: 'Wants to move, cannot',
    description: 'Stated desire for growth contradicts detected stagnation conflict. This IS the song — the gap between aspiration and reality.',
    craftSuggestion: { resolution: 'deferred', humor_type: 'irony' },
    structureSuggestion: 'hook_core_question',
  },
  RIGHTEOUS_GREY: {
    label: 'Righteous but assigns blame',
    description: 'Speaker claims moral authority while attributing everything externally. Tension is the engine of the story.',
    craftSuggestion: { stance: 'split', rhetoricalDevices: ['antimetabole'] },
    structureSuggestion: 'verse_external_world',
  },
  ABSOLUTION_DEFIANT: {
    label: 'Seeking forgiveness through defiance',
    description: 'Speaker asks for absolution but refuses to soften. The apology is delivered as an attack. Deeply complex emotional register.',
    craftSuggestion: { humorType: 'dark_humor', rhetoricalDevices: ['chiasmus'] },
    structureSuggestion: 'bridge_realization',
  },
  PAST_HEAVY_FUTURE: {
    label: 'Held by the past, reaching forward',
    description: 'Past self has enormous weight but speaker says they are moving forward. Classic transformation arc under strain.',
    craftSuggestion: { meter: 'anapestic', rhetoricalDevices: ['anadiplosis'] },
    structureSuggestion: 'verse_memory',
  },
};

/**
 * Detect all active cross-property tensions.
 *
 * @param {object} overrides — user-provided property values (from schema)
 * @param {object} parsed    — engine-parsed identity (from identityParser)
 * @returns {Array} tensions — list of active tension objects
 */
function detectPropertyTensions(overrides = {}, parsed = {}) {
  const tensions = [];
  const { decisiveness = 50, attribution = 50, rawness = 50, vulnerability_level = 50,
          change_direction = 'forward', narrator_morality, absolution_seeking = false,
          diction_level, past_actual_weight = 0.7, primary_emotion } = overrides;

  const conflictType    = parsed.conflicts?.[0]?.type || null;
  const dominantEmotion = parsed.emotions?.[0]?.emotion || primary_emotion || null;

  // CERTAIN_AND_DIVIDED: knows who they are but can't assign blame
  if (decisiveness > 70 && attribution >= 35 && attribution <= 65)
    tensions.push({ type: 'CERTAIN_AND_DIVIDED', ...TENSION_DEFINITIONS.CERTAIN_AND_DIVIDED });

  // RAW_AND_POLISHED: wants raw but chose formal diction
  if (rawness > 75 && diction_level === 'elevated')
    tensions.push({ type: 'RAW_AND_POLISHED', ...TENSION_DEFINITIONS.RAW_AND_POLISHED });

  // PROUD_AND_EXPOSED: pride emotion + high vulnerability
  if ((dominantEmotion === 'pride') && vulnerability_level > 70)
    tensions.push({ type: 'PROUD_AND_EXPOSED', ...TENSION_DEFINITIONS.PROUD_AND_EXPOSED });

  // FORWARD_STUCK: wants to grow but is stuck
  if (change_direction === 'forward' && conflictType === 'stagnation')
    tensions.push({ type: 'FORWARD_STUCK', ...TENSION_DEFINITIONS.FORWARD_STUCK });

  // RIGHTEOUS_GREY: claims righteousness + blames others
  if (narrator_morality === 'righteous' && attribution < 30)
    tensions.push({ type: 'RIGHTEOUS_GREY', ...TENSION_DEFINITIONS.RIGHTEOUS_GREY });

  // ABSOLUTION_DEFIANT: asking forgiveness + defiant
  if (absolution_seeking && (dominantEmotion === 'defiance'))
    tensions.push({ type: 'ABSOLUTION_DEFIANT', ...TENSION_DEFINITIONS.ABSOLUTION_DEFIANT });

  // PAST_HEAVY_FUTURE: past very heavy + moving forward
  if (past_actual_weight > 0.8 && change_direction === 'forward')
    tensions.push({ type: 'PAST_HEAVY_FUTURE', ...TENSION_DEFINITIONS.PAST_HEAVY_FUTURE });

  return tensions;
}

/**
 * Merge craft suggestions from detected tensions into the base craftConfig.
 * Tensions act as modifiers — they do not override explicit user choices.
 */
function applyTensionsToCraft(baseCraftConfig = {}, tensions = []) {
  if (tensions.length === 0) return baseCraftConfig;
  const merged = { ...baseCraftConfig };

  for (const tension of tensions) {
    if (!tension.craftSuggestion) continue;
    for (const [key, val] of Object.entries(tension.craftSuggestion)) {
      // Only apply if the user hasn't already explicitly set this
      if (merged[key] === undefined || merged[key] === null) {
        merged[key] = val;
      }
    }
  }

  // Merge rhetorical devices from all tensions (deduplicated, max 4)
  const tensionDevices = tensions
    .filter(t => t.craftSuggestion?.rhetoricalDevices)
    .flatMap(t => t.craftSuggestion.rhetoricalDevices);
  if (tensionDevices.length > 0) {
    const base = merged.rhetoricalDevices || [];
    merged.rhetoricalDevices = [...new Set([...base, ...tensionDevices])].slice(0, 4);
  }

  return merged;
}

/**
 * Build a summary string for logging/debugging.
 */
function buildTensionSummary(tensions) {
  if (tensions.length === 0) return 'No cross-property tensions detected';
  return tensions.map(t => `${t.type}: ${t.label}`).join(' | ');
}

module.exports = {
  detectPropertyTensions,
  applyTensionsToCraft,
  buildTensionSummary,
  TENSION_DEFINITIONS,
};
