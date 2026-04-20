/**
 * identitySchema.js — SCI Property Schema v1
 *
 * Single source of truth for every capturable identity property.
 * Modelled after Habitat-Lab's task config pattern:
 *   each property carries type, range, default, required, source, and uiControl.
 *
 * source:
 *   'user'     — explicitly provided by the user (UI input)
 *   'inferred' — derived from free text by the engine
 *   'computed' — calculated from other properties
 *
 * uiControl: maps to the interface component that captures this property
 */

const IDENTITY_SCHEMA = {

  // ── Layer 1: WHO (temporal identity) ────────────────────────────────────────
  past_actual_weight: {
    type: 'float', range: [0.0, 1.0], default: 0.7,
    required: false, source: 'user',
    label: 'Past self weight',
    uiControl: 'slider',
    sliderLabels: { left: 'Not defining', right: 'Entirely defining' },
    engineTarget: 'identityConfig.past.actual.weight',
  },
  decisiveness: {
    type: 'int', range: [0, 100], default: 50,
    required: false, source: 'user',
    label: 'Identity certainty',
    uiControl: 'slider',
    sliderLabels: { left: 'I am completely lost', right: 'I know exactly who I am' },
    engineTarget: 'identityConfig.controls.contradiction.decisiveness',
  },
  attribution: {
    type: 'int', range: [0, 100], default: 50,
    required: false, source: 'user',
    label: 'Fault attribution',
    uiControl: 'bipolar_slider',
    sliderLabels: { left: "It's entirely their fault", right: 'I own all of this' },
    engineTarget: 'identityConfig.controls.attribution',
  },
  change_direction: {
    type: 'enum',
    values: ['forward', 'backward', 'circular'],
    default: 'forward',
    required: false, source: 'user',
    label: 'Direction of change',
    uiControl: 'chip_select',
    chipLabels: { forward: '→ Growing', backward: '← Regressing', circular: '↻ Repeating' },
    engineTarget: 'identityConfig.controls.change.direction',
  },
  absolution_seeking: {
    type: 'bool', default: false,
    required: false, source: 'user',
    label: 'Seeking absolution',
    uiControl: 'toggle',
    engineTarget: 'identityConfig.controls.absolution.seeking',
  },
  identity_tensions: {
    type: 'enum[]',
    values: ['past_actual_to_now_actual','now_actual_to_now_alternative','now_actual_to_future_projected','past_actual_to_future_projected'],
    default: ['past_actual_to_now_actual', 'now_actual_to_now_alternative'],
    required: false, source: 'user',
    label: 'Active identity tensions',
    uiControl: 'multi_chip',
    engineTarget: 'identityConfig.activeTensions',
  },

  // ── Layer 2: FEEL (emotional state) ─────────────────────────────────────────
  primary_emotion: {
    type: 'enum',
    values: ['anger','sadness','defiance','longing','pride','confusion','joy','vulnerability'],
    default: null,
    required: false, source: 'user',
    label: 'Primary emotion',
    uiControl: 'emotion_grid',
    engineTarget: 'persona.primaryEmotion',
    confidenceThreshold: 0.5,
  },
  secondary_emotions: {
    type: 'enum[]',
    values: ['anger','sadness','defiance','longing','pride','confusion','joy','vulnerability'],
    default: [],
    required: false, source: 'user',
    label: 'Secondary emotions',
    uiControl: 'multi_chip',
    maxSelections: 3,
    engineTarget: 'persona.secondaryEmotions',
  },
  vulnerability_level: {
    type: 'int', range: [0, 100], default: 50,
    required: false, source: 'user',
    label: 'Vulnerability level',
    uiControl: 'slider',
    sliderLabels: { left: 'Armoured · Detached', right: 'Naked · Fully exposed' },
    engineTarget: 'craftConfig.vulnerabilityModifier',
  },

  // ── Layer 3: HOW (craft parameters) ─────────────────────────────────────────
  rawness: {
    type: 'int', range: [0, 100], default: 50,
    required: false, source: 'user',
    label: 'Rawness',
    uiControl: 'slider',
    sliderLabels: { left: 'Polished · Metaphorical', right: 'Confessional · Blunt' },
    engineTarget: 'styleMap.rawness',
  },
  rhyme_type: {
    type: 'enum',
    values: ['perfect','slant','eye','feminine','mosaic','internal','compound'],
    default: 'slant',
    required: false, source: 'user',
    label: 'Rhyme type',
    uiControl: 'card_select',
    engineTarget: 'craftConfig.rhymeType',
  },
  diction_level: {
    type: 'enum',
    values: ['elevated','natural','street','mixed','poetic'],
    default: 'natural',
    required: false, source: 'user',
    label: 'Diction level',
    uiControl: 'card_select',
    engineTarget: 'craftConfig.dictionLevel',
  },
  rhetorical_devices: {
    type: 'enum[]',
    values: ['anaphora','epistrophe','anadiplosis','antimetabole','polyptoton','synecdoche','tautology','alliteration','assonance','chiasmus','parallelism'],
    default: [],
    required: false, source: 'user',
    label: 'Rhetorical devices',
    uiControl: 'multi_chip',
    maxSelections: 4,
    engineTarget: 'craftConfig.rhetoricalDevices',
  },
  humor_type: {
    type: 'enum',
    values: ['none','wit','sarcasm','irony','self_deprecation','wordplay','absurdism','dark_humor'],
    default: 'none',
    required: false, source: 'user',
    label: 'Humor type',
    uiControl: 'card_select',
    engineTarget: 'craftConfig.humorType',
  },
  humor_intensity: {
    type: 'int', range: [0, 100], default: 40,
    required: false, source: 'user',
    label: 'Humor intensity',
    uiControl: 'slider',
    conditional: { property: 'humor_type', notValue: 'none' },
    sliderLabels: { left: 'Barely there', right: 'Dominant tone' },
    engineTarget: 'craftConfig.humorIntensity',
  },
  meter: {
    type: 'enum',
    values: ['free','iambic','trochaic','anapestic','syllabic'],
    default: 'free',
    required: false, source: 'user',
    label: 'Meter',
    uiControl: 'card_select',
    engineTarget: 'craftConfig.meter',
  },
  momentum: {
    type: 'enum',
    values: ['build','sustain','release','peak','valley'],
    default: 'sustain',
    required: false, source: 'user',
    label: 'Section momentum',
    uiControl: 'chip_select',
    engineTarget: 'craftConfig.momentum',
  },
  resolution: {
    type: 'enum',
    values: ['resolved','unresolved','ambiguous','deferred'],
    default: 'ambiguous',
    required: false, source: 'user',
    label: 'Resolution',
    uiControl: 'chip_select',
    engineTarget: 'craftConfig.resolution',
  },
  narrator_morality: {
    type: 'enum',
    values: ['righteous','morally_grey','repentant','amoral','witnessing'],
    default: 'morally_grey',
    required: false, source: 'user',
    label: 'Narrator morality',
    uiControl: 'card_select',
    engineTarget: 'craftConfig.narratorMorality',
  },
  theme_sensitivity: {
    type: 'enum',
    values: ['low','medium','high'],
    default: 'medium',
    required: false, source: 'user',
    label: 'Theme sensitivity',
    uiControl: 'chip_select',
    engineTarget: 'craftConfig.themeSensitivity',
  },

  // ── Layer 4: WHEN (temporal + logical) ──────────────────────────────────────
  temporal_dominant: {
    type: 'enum',
    values: ['past','present','future'],
    default: 'present',
    required: false, source: 'inferred',
    label: 'Temporal dominant',
    uiControl: 'display_override_chip',
    engineTarget: 'temporalProfile.temporal.dominant',
    confidenceThreshold: 0.6,
  },
  logical_relation: {
    type: 'enum',
    values: ['CONTRADICTION','CONTRARY','SUBCONTRARY','NEUTRAL'],
    default: 'NEUTRAL',
    required: false, source: 'inferred',
    label: 'Tension type',
    uiControl: 'display_override_chip',
    engineTarget: 'temporalProfile.logicalRelation.relation',
    confidenceThreshold: 0.7,
  },
  conflict_score: {
    type: 'float', range: [0.0, 1.0], default: 0.0,
    required: false, source: 'computed',
    label: 'Conflict score',
    uiControl: 'gauge',
    engineTarget: 'temporalProfile.conflictScore',
  },

  // ── Layer 5: VOICE (persona) ─────────────────────────────────────────────────
  language_mix: {
    type: 'enum[]',
    values: ['en','sw','sheng'],
    default: ['en'],
    required: false, source: 'user',
    label: 'Language mix',
    uiControl: 'toggle_group',
    engineTarget: 'persona.languageMix',
  },
  perspective: {
    type: 'enum',
    values: ['first','second','third'],
    default: 'first',
    required: false, source: 'user',
    label: 'Narrator perspective',
    uiControl: 'chip_select',
    engineTarget: 'persona.perspective',
  },
  archetype: {
    type: 'enum',
    values: ['The Defiant','The Misunderstood','The Transformer','The Seeker','The Bridge Walker','The Lone Voice','The Heir','The Grounded','The Observer'],
    default: null,
    required: false, source: 'user',
    label: 'Archetype',
    uiControl: 'card_select',
    engineTarget: 'persona.archetype',
    confidenceThreshold: 0.5,
  },
  energy: {
    type: 'int', range: [0, 100], default: 60,
    required: false, source: 'user',
    label: 'Energy level',
    uiControl: 'slider',
    sliderLabels: { left: 'Still · Quiet', right: 'Explosive · High' },
    engineTarget: 'persona.energyValue',
  },
  alter_ego: {
    type: 'enum',
    values: ['none','the_confessor','the_witness','the_trickster','the_preacher','the_ghost','the_street_philosopher','custom'],
    default: 'none',
    required: false, source: 'user',
    label: 'Alter ego',
    uiControl: 'card_select',
    engineTarget: 'identityConfig.activeAlterEgo',
  },
};

/**
 * Validate a property value against its schema definition.
 * Returns { valid: bool, reason: string|null }
 */
function validateProperty(key, value) {
  const def = IDENTITY_SCHEMA[key];
  if (!def) return { valid: true, reason: null }; // unknown keys pass through

  if (value === null || value === undefined) {
    if (def.required) return { valid: false, reason: `${key} is required` };
    return { valid: true, reason: null };
  }

  if (def.type === 'int' || def.type === 'float') {
    const n = Number(value);
    if (isNaN(n)) return { valid: false, reason: `${key} must be a number` };
    if (def.range && (n < def.range[0] || n > def.range[1]))
      return { valid: false, reason: `${key} must be between ${def.range[0]} and ${def.range[1]}` };
  }

  if (def.type === 'enum') {
    if (value !== null && !def.values.includes(value))
      return { valid: false, reason: `${key} must be one of: ${def.values.join(', ')}` };
  }

  if (def.type === 'enum[]') {
    if (!Array.isArray(value))
      return { valid: false, reason: `${key} must be an array` };
    const invalid = value.filter(v => !def.values.includes(v));
    if (invalid.length > 0)
      return { valid: false, reason: `${key} contains invalid values: ${invalid.join(', ')}` };
    if (def.maxSelections && value.length > def.maxSelections)
      return { valid: false, reason: `${key} allows max ${def.maxSelections} selections` };
  }

  return { valid: true, reason: null };
}

/**
 * Validate a full overrides object.
 * Returns { valid: bool, errors: string[] }
 */
function validateOverrides(overrides = {}) {
  const errors = [];
  for (const [key, value] of Object.entries(overrides)) {
    const result = validateProperty(key, value);
    if (!result.valid) errors.push(result.reason);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Build defaults object for all user-sourced properties.
 * Used when the user submits without touching optional controls.
 */
function getSchemaDefaults() {
  const defaults = {};
  for (const [key, def] of Object.entries(IDENTITY_SCHEMA)) {
    if (def.source === 'user' && def.default !== null) {
      defaults[key] = def.default;
    }
  }
  return defaults;
}

module.exports = { IDENTITY_SCHEMA, validateProperty, validateOverrides, getSchemaDefaults };
