const { getTemporalSectionRecommendations } = require('./temporalParser');

/**
 * structurePlanner.js — v2
 *
 * Dynamically generates a song structure based on conflict type,
 * emotional intensity, energy level, vulnerability signals, and PIRE temporal layer.
 *
 * v2 additions:
 *   - Emotion-weighted structure selection
 *   - Vulnerability in top 2 emotions → always include bridge_surrender
 *   - 3 new section types: verse_address_listener, spoken_word, call_and_response
 *   - Double-hook variant when emotions[0].intensity > 0.7 AND energy > 70
 *   - PIRE temporal injection (CONTRADICTION→double-hook, SUBCONTRARY→spoken_word)
 */

const SECTION_BLUEPRINTS = {
  verse_introduce_conflict:  { type:'verse',            goal:'introduce_conflict',         description:'Set the scene. Introduce who is speaking and what tension exists.',              lines:8 },
  verse_expand_struggle:     { type:'verse',            goal:'expand_internal_struggle',    description:'Go deeper into the internal world. Show contradictions.',                       lines:8 },
  verse_external_world:      { type:'verse',            goal:'describe_external_pressure',  description:'Show how the outside world sees or judges the speaker.',                        lines:8 },
  verse_memory:              { type:'verse',            goal:'recall_origin',               description:'Reference a formative memory or moment of identity formation.',                 lines:6 },
  verse_address_listener:    { type:'verse',            goal:'address_listener_directly',   description:'Second-person break — speak directly to the listener. Intimate, confrontational.', lines:6 },
  spoken_word:               { type:'spoken-word',      goal:'prose_delivery',              description:'No rhyme scheme. Prose delivery — raw, unfiltered statement. Like a confession.', lines:6 },
  call_and_response:         { type:'call-and-response',goal:'communal_echo',               description:'For spiritual/streetwise archetypes. A statement and its echo. Ritual feel.',   lines:4 },
  hook_core_question:        { type:'hook',             goal:'express_core_question',       description:'Repeat the emotional core. The unanswered question or declaration.',            lines:4 },
  hook_declaration:          { type:'hook',             goal:'declare_identity',            description:'A bold, repeatable statement of who the speaker is.',                           lines:4 },
  pre_hook:                  { type:'pre-hook',         goal:'build_tension_before_hook',   description:'A 2-bar transition that escalates into the hook.',                             lines:2 },
  bridge_realization:        { type:'bridge',           goal:'realization',                 description:'A shift in perspective — the speaker sees something differently.',              lines:6 },
  bridge_surrender:          { type:'bridge',           goal:'surrender_or_acceptance',     description:'The speaker stops fighting and accepts a truth.',                               lines:6 },
  outro_resolution:          { type:'outro',            goal:'resolution_or_open_end',      description:'Leave the listener with the final emotional impression.',                       lines:4 },
  intro:                     { type:'intro',            goal:'establish_atmosphere',        description:'Set the sonic/emotional tone before lyrics begin.',                             lines:2 },
};

const STRUCTURE_TEMPLATES = {
  identity_rejection:  ['verse_introduce_conflict','hook_declaration','verse_expand_struggle','hook_declaration','bridge_realization','hook_declaration'],
  external_judgment:   ['verse_introduce_conflict','pre_hook','hook_core_question','verse_external_world','pre_hook','hook_core_question','bridge_realization','hook_core_question'],
  transformation:      ['verse_memory','hook_declaration','verse_introduce_conflict','hook_declaration','bridge_surrender','outro_resolution'],
  stagnation:          ['verse_introduce_conflict','hook_core_question','verse_expand_struggle','hook_core_question','bridge_realization','hook_declaration'],
  duality:             ['verse_introduce_conflict','verse_external_world','hook_core_question','verse_expand_struggle','hook_core_question','bridge_realization','outro_resolution'],
  isolation:           ['intro','verse_introduce_conflict','hook_core_question','verse_expand_struggle','bridge_surrender','outro_resolution'],
  ancestral_tension:   ['verse_memory','hook_declaration','verse_introduce_conflict','hook_declaration','bridge_realization','hook_declaration'],
  place_identity:      ['verse_introduce_conflict','hook_declaration','verse_external_world','hook_declaration','bridge_realization','outro_resolution'],
};

const DEFAULT_STRUCTURE = ['verse_introduce_conflict','hook_core_question','verse_expand_struggle','hook_core_question','bridge_realization','hook_core_question'];

function applyEmotionWeighting(templateKeys, persona) {
  const keys = [...templateKeys];
  const emotions = persona.emotions || [];
  const topIntensity = emotions[0]?.intensity || 0;
  const energyNum    = persona.energyValue || 50;

  if (topIntensity > 0.7 && energyNum > 70) {
    const firstHookIdx = keys.findIndex(k => k.startsWith('hook_'));
    if (firstHookIdx !== -1) keys.splice(firstHookIdx + 1, 0, keys[firstHookIdx]);
  }

  const top2Emotions = emotions.slice(0, 2).map(e => e.emotion);
  if (top2Emotions.includes('vulnerability')) {
    if (!keys.includes('bridge_surrender')) {
      const bridgeIdx = keys.findIndex(k => k.startsWith('bridge_'));
      if (bridgeIdx !== -1) keys[bridgeIdx] = 'bridge_surrender';
      else keys.push('bridge_surrender');
    }
  }

  const archetype = persona.archetype || '';
  if (archetype === 'The Grounded' || (persona.traits || []).includes('spiritual')) {
    const bridgeIdx = keys.findIndex(k => k.startsWith('bridge_'));
    if (bridgeIdx !== -1 && !keys.includes('call_and_response')) {
      keys.splice(bridgeIdx, 0, 'call_and_response');
    }
  }

  return keys;
}

function planStructure(persona, message) {
  const conflictType    = persona.dominantConflict;
  const temporalProfile = message.temporalProfile || null;
  let templateKeys = [...(STRUCTURE_TEMPLATES[conflictType] || DEFAULT_STRUCTURE)];

  if (temporalProfile) {
    const logicalRel = temporalProfile.logicalRelation?.relation;

    if (logicalRel === 'CONTRADICTION') {
      const hookIdx = templateKeys.lastIndexOf('hook_declaration');
      if (hookIdx >= 0 && !templateKeys.slice(hookIdx + 1).includes('hook_declaration'))
        templateKeys.splice(hookIdx + 1, 0, 'hook_declaration');
    }
    if (logicalRel === 'SUBCONTRARY' && !templateKeys.includes('spoken_word')) {
      const bridgeIdx = templateKeys.findIndex(k => k.startsWith('bridge'));
      if (bridgeIdx > 0) templateKeys.splice(bridgeIdx, 0, 'spoken_word');
    }
    if (temporalProfile.temporal?.counts?.past > 0 && !templateKeys.includes('verse_memory'))
      templateKeys.unshift('verse_memory');
    if (temporalProfile.temporal?.counts?.future > 0 && logicalRel === 'CONTRARY' && !templateKeys.includes('outro_resolution'))
      templateKeys.push('outro_resolution');
  }

  const plan = templateKeys.map((key, index) => {
    const blueprint = SECTION_BLUEPRINTS[key];
    if (!blueprint) return null;
    return {
      index:       index + 1,
      type:        blueprint.type,
      goal:        blueprint.goal,
      description: blueprint.description,
      lines:       blueprint.lines,
      tone:        persona.tone,
      perspective: persona.perspective,
      energy:      persona.energy,
      languageMix: persona.languageMix,
    };
  }).filter(Boolean);

  return {
    sections:        plan,
    totalSections:   plan.length,
    conflictType:    conflictType || 'general',
    coreMessage:     message.coreMessage,
    logicalRelation: temporalProfile?.logicalRelation || null,
    conflictScore:   temporalProfile?.conflictScore   || 0,
    temporalSummary: temporalProfile?.temporalSummary || null,
  };
}

module.exports = { planStructure, SECTION_BLUEPRINTS, STRUCTURE_TEMPLATES };
