/**
 * lyricsStyleEngine.js — SCI Craft Layer v3
 *
 * Handles all linguistic, rhetorical, prosodic, and expressive craft parameters.
 * This is the "HOW it sounds" layer — distinct from "WHAT it says" (messageExtractor)
 * and "WHO speaks" (personaBuilder).
 *
 * Covers:
 *   1. Rhetorical devices (Anaphora, Epistrophe, Anadiplosis, etc.)
 *   2. Humor types (Sarcasm, Irony, Self-deprecation, Wordplay, etc.)
 *   3. Prosody (meter, syllable patterns, stress)
 *   4. Rhyme types (Perfect, Slant, Internal, Feminine, etc.)
 *   5. Voice register (diction, colloquialism, grammar intentionality)
 *   6. Momentum (Build / Sustain / Release per section)
 *   7. Restraint (over/under-usage guards)
 *   8. Resolution control (resolved/unresolved/ambiguous)
 *   9. Morality of narrator
 *  10. Objective vs subjective stance
 *  11. Theme sensitivity level
 */

const RHETORICAL_DEVICE_INSTRUCTIONS = {
  anaphora:      { name: 'Anaphora',              instruction: 'Begin 2–3 consecutive lines with the same word or phrase. Creates accumulation and emotional hammer-blow.', example: '"I was here. I was real. I was never what you needed."' },
  epistrophe:    { name: 'Epistrophe',             instruction: 'End 2–3 consecutive lines with the same word or phrase. Creates resolution and resonance.', example: '"You called me broken. He called me broken. The mirror called me broken."' },
  anadiplosis:   { name: 'Anadiplosis',            instruction: 'End one line with a word and begin the NEXT with the same word. Creates a chain of causality.', example: '"I gave you everything. Everything I had is gone."' },
  antimetabole:  { name: 'Antimetabole',           instruction: 'Repeat words in reverse order in the next phrase. Creates paradox and irony.', example: '"I live to fight, and fight to live."' },
  polyptoton:    { name: 'Polyptoton',             instruction: 'Use the same root word in different grammatical forms within close proximity.', example: '"The loved, the loveless, learning to love again."' },
  synecdoche:    { name: 'Synecdoche',             instruction: 'Refer to the whole by one of its parts. Compress identity into a single object.', example: '"These hands built everything. These hands carry nothing."' },
  tautology:     { name: 'Tautology (Intentional)',instruction: 'Repeat the same idea in different words. Creates emphasis through redundancy.', example: '"I am what I am and nothing else."' },
  alliteration:  { name: 'Alliteration',           instruction: 'Repeat initial consonant sounds across consecutive words. Creates sonic momentum.', example: '"Silent streets, still sleeping souls"' },
  assonance:     { name: 'Assonance',              instruction: 'Repeat vowel sounds within or across lines without rhyming. Creates sonic texture.', example: '"The stone road holds the cold bones"' },
  chiasmus:      { name: 'Chiasmus',               instruction: 'A reversal of grammatical structure across two phrases. Creates balance through inversion.', example: '"Never let them see you cry / Never cry where they can see"' },
  parallelism:   { name: 'Parallelism',            instruction: 'Use the same grammatical structure for related ideas. Creates rhythm and clarity.', example: '"I survived the rain. I survived the cold. I survived you."' },
};

const HUMOR_TYPE_INSTRUCTIONS = {
  none:            { instruction: 'Maintain serious, earnest tone throughout. No levity.' },
  wit:             { instruction: 'Clever, intelligent observations and wordplay. Humor through insight, not mockery.', example: '"Smart enough to know better, dumb enough to do it anyway."' },
  sarcasm:         { instruction: 'Say the opposite of what you mean with a cutting edge. One or two lines maximum per section.', example: '"Oh sure, thank you for your concern — wherever it was when I needed it."' },
  irony:           { instruction: 'Create contrast between what is stated and what is true, or between expectation and reality.', example: '"The one who taught me not to lie could never tell the truth."' },
  self_deprecation:{ instruction: 'Humor that mocks the speaker themselves — vulnerability as comedic material.', example: '"Here I am, world\'s greatest disaster, somehow still asking for more."' },
  wordplay:        { instruction: 'Exploit double meanings, puns, homonyms, or unexpected semantic connections.', example: '"I gave it my all, and my all gave out."' },
  absurdism:       { instruction: 'Surreal or exaggerated imagery to reveal an emotional truth through the absurd.', example: '"I carry seventeen years of silence in a suitcase with no wheels."' },
  dark_humor:      { instruction: 'Find humor in suffering or failure. The laugh comes from recognizing the horror is real.', example: '"Another loss, another lesson, another album coming soon."' },
};

const RHYME_TYPE_INSTRUCTIONS = {
  perfect:  { name: 'Perfect (True) Rhyme',      instruction: 'Exact match of vowel sound and final consonant: "love/above", "night/right".' },
  slant:    { name: 'Slant (Near) Rhyme',         instruction: 'Approximate match — shared consonants or assonance but not exact: "prove/love". More conversational.' },
  eye:      { name: 'Eye Rhyme',                  instruction: 'Words that look like they rhyme but don\'t sound it: "love/move". Use for dissonance.' },
  feminine: { name: 'Feminine Rhyme',             instruction: 'Rhyme on an unstressed syllable: "caring/sharing". Creates softness and lilt.' },
  mosaic:   { name: 'Mosaic Rhyme',               instruction: 'One word rhymes with multiple words: "feel it/reveal it/conceal it". Creates density.' },
  internal: { name: 'Internal Rhyme',             instruction: 'Rhyme occurs within a single line rather than at line end.' },
  compound: { name: 'Compound Rhyme (Multi-syllabic)', instruction: 'Rhyme across multiple syllables: "never be/melody". Hip-hop and rap staple.' },
};

const METER_INSTRUCTIONS = {
  free:      { name: 'Free Verse',          instruction: 'No fixed syllable count or stress pattern. Let emotional content determine line length.' },
  iambic:    { name: 'Iambic (da-DUM)',     instruction: 'Unstressed + stressed syllable pairs. Natural English speech rhythm.' },
  trochaic:  { name: 'Trochaic (DUM-da)',   instruction: 'Stressed + unstressed. Forward momentum, urgency.' },
  anapestic: { name: 'Anapestic (da-da-DUM)',instruction: 'Two unstressed + one stressed. Galloping, forward drive. Common in rap triplets.' },
  syllabic:  { name: 'Syllabic Count',      instruction: 'Fixed syllable count per line regardless of stress. Specify target syllables (8, 10, 12, 16).' },
};

const LINE_WEIGHT_INSTRUCTIONS = {
  front_heavy: { name: 'Front-heavy lines', instruction: 'Put the most important word/syllable EARLY. Impact front-loads.', example: '"BROKEN was all I brought you — nothing more."' },
  back_heavy:  { name: 'Back-heavy lines',  instruction: 'Build toward the END of the line. The key word lands LAST.', example: '"Everything I carried, every scar, every name — yours."' },
  balanced:    { name: 'Balanced lines',    instruction: 'Distribute weight evenly. Thesis/antithesis structure within the line.' },
};

const DICTION_LEVEL_INSTRUCTIONS = {
  elevated: { instruction: 'Use formal, literary vocabulary. Prefer multisyllabic words. Do NOT use contractions.' },
  natural:  { instruction: 'Use everyday conversational vocabulary. Contractions welcome. Educated speech, not performance.' },
  street:   { instruction: 'Use colloquial, vernacular, neighbourhood-specific language. Grammar may be intentionally broken. Authenticity over correctness.' },
  mixed:    { instruction: 'Alternate between registers — elevated in reflective moments, street in reactive moments.' },
  poetic:   { instruction: 'Compressed, imagistic language. Every word earns its place. Prefer concrete nouns over abstract ones.' },
};

const GRAMMAR_INTENTIONALITY_INSTRUCTIONS = {
  strict:             { instruction: 'Follow standard grammar rules. No sentence fragments. No intentional errors.' },
  intentional_breaks: { instruction: 'Grammar may be deliberately broken for effect: fragments ("Gone. Just gone."), double negatives as dialectal authenticity ("I ain\'t got nothing left").' },
  dialectal:          { instruction: 'Use the grammatical patterns of the speaker\'s cultural/regional dialect. This is not error — it is voice. Consistency is key.' },
};

const MOMENTUM_INSTRUCTIONS = {
  build:   { instruction: 'This section should ACCELERATE — increase line length, syllable density, or emotional intensity as it progresses.' },
  sustain: { instruction: 'This section maintains consistent energy level throughout. Steady pressure.' },
  release: { instruction: 'This section should DECELERATE — pull back from peak intensity. Use space, shorter lines, or quieter imagery.' },
  peak:    { instruction: 'This section IS the highest point of energy in the song. Everything before builds to this.' },
  valley:  { instruction: 'This is the quietest point — intentional contrast with surrounding intensity.' },
};

const RESOLUTION_INSTRUCTIONS = {
  resolved:   { instruction: 'This section ends with emotional/narrative closure. The question is answered. The tension released.' },
  unresolved: { instruction: 'This section ends open — no closure. The tension hangs. Creates pull toward the next section.' },
  ambiguous:  { instruction: 'This section ends with deliberate ambiguity — the resolution could be read multiple ways.' },
  deferred:   { instruction: 'Partial resolution — the tension is acknowledged but consciously deferred to later in the song.' },
};

const NARRATOR_MORALITY_INSTRUCTIONS = {
  righteous:   { instruction: 'The narrator believes they are morally right. Speak with conviction and certainty. No apology.' },
  morally_grey:{ instruction: 'The narrator acknowledges they have done wrong AND been wronged. Neither pure victim nor villain.' },
  repentant:   { instruction: 'The narrator is seeking absolution or forgiveness. The song is a confession or apology.' },
  amoral:      { instruction: 'The narrator does not judge their own actions through a moral lens.' },
  witnessing:  { instruction: 'The narrator observes rather than participates. The moral judgment is left entirely to the listener.' },
};

const STANCE_INSTRUCTIONS = {
  subjective: { instruction: 'Write entirely from the speaker\'s internal experience. Feelings and perceptions as truth.' },
  objective:  { instruction: 'Describe events, behaviors, and observable facts without editorial judgment.' },
  split:      { instruction: 'Alternate — some lines from inside (subjective), some from outside (objective).' },
};

const THEME_SENSITIVITY_INSTRUCTIONS = {
  low:    { instruction: 'Handle all themes directly, without softening. Approach sensitive subjects head-on.' },
  medium: { instruction: 'Acknowledge sensitive themes with appropriate weight — not sanitized, but not gratuitous.' },
  high:   { instruction: 'Approach sensitive themes with care and indirection. Imagery and metaphor carry the weight.' },
};

const CONVO_FILLER_INSTRUCTIONS = {
  allow:   'Authentic spoken-language fillers are permitted: "like", "you know", "I mean", "honestly", "listen" — these create intimacy and realism.',
  prohibit:'No conversational fillers. Every word must be intentional.',
};

function buildRestraintInstructions(restraint = {}) {
  const lines = [];
  if (restraint.noRepetition)                   lines.push('RESTRAINT: Do NOT repeat any phrase used in a previous section verbatim.');
  if (restraint.maxDevices && restraint.maxDevices <= 2) lines.push(`RESTRAINT: Use at most ${restraint.maxDevices} rhetorical device(s) per section.`);
  if (restraint.avoidPadding)                   lines.push('RESTRAINT: Avoid filler lines. Every line must advance the narrative or sharpen the image.');
  if (restraint.noCliches)                      lines.push('RESTRAINT: Avoid clichés. "broken heart", "tears in the rain", "pick yourself up" — banned.');
  if (restraint.underStatement)                 lines.push('RESTRAINT: Prefer understatement. Say less than you mean. Trust the listener.');
  return lines.join('\n');
}

/**
 * Build the full craft context block for the AI prompt.
 * @param {object} craftConfig - from cockpit overrides.craft
 * @param {string} sectionType - current section type
 * @returns {string} prompt block
 */
function buildCraftBlock(craftConfig = {}, sectionType = 'verse') {
  if (!craftConfig || Object.keys(craftConfig).length === 0) return '';

  const lines = ['\n─── CRAFT & LINGUISTIC PARAMETERS ───'];

  const devices = craftConfig.rhetoricalDevices || [];
  if (devices.length > 0) {
    lines.push('\nRHETORICAL DEVICES TO USE:');
    devices.forEach(d => {
      const def = RHETORICAL_DEVICE_INSTRUCTIONS[d];
      if (def) lines.push(`  • ${def.name}: ${def.instruction}`);
    });
  }

  if (craftConfig.humorType && craftConfig.humorType !== 'none') {
    const hum = HUMOR_TYPE_INSTRUCTIONS[craftConfig.humorType];
    if (hum) {
      lines.push(`\nHUMOR TYPE: ${craftConfig.humorType.toUpperCase()}\n  ${hum.instruction}`);
      if (hum.example) lines.push(`  Example register: ${hum.example}`);
    }
    if (craftConfig.humorIntensity) {
      const h = craftConfig.humorIntensity;
      lines.push(`  Humor intensity: ${h}/100 — ${h < 40 ? 'subtle undercurrent' : h < 70 ? 'present and noticeable' : 'dominant tone'}`);
    }
  }

  if (craftConfig.rhymeType) {
    const rt = RHYME_TYPE_INSTRUCTIONS[craftConfig.rhymeType];
    if (rt) lines.push(`\nRHYME TYPE: ${rt.name} — ${rt.instruction}`);
  }

  if (craftConfig.meter && craftConfig.meter !== 'free') {
    const met = METER_INSTRUCTIONS[craftConfig.meter];
    if (met) lines.push(`\nMETER: ${met.name} — ${met.instruction}`);
  }
  if (craftConfig.syllableTarget) lines.push(`TARGET SYLLABLES PER LINE: approximately ${craftConfig.syllableTarget}`);

  if (craftConfig.lineWeight && craftConfig.lineWeight !== 'balanced') {
    const lw = LINE_WEIGHT_INSTRUCTIONS[craftConfig.lineWeight];
    if (lw) lines.push(`\nLINE WEIGHT: ${lw.name} — ${lw.instruction}`);
  }

  if (craftConfig.dictionLevel) {
    const dl = DICTION_LEVEL_INSTRUCTIONS[craftConfig.dictionLevel];
    if (dl) lines.push(`\nDICTION REGISTER: ${craftConfig.dictionLevel.toUpperCase()} — ${dl.instruction}`);
  }

  if (craftConfig.grammarIntentionality && craftConfig.grammarIntentionality !== 'strict') {
    const gi = GRAMMAR_INTENTIONALITY_INSTRUCTIONS[craftConfig.grammarIntentionality];
    if (gi) lines.push(`\nGRAMMAR: ${gi.instruction}`);
  }

  if (craftConfig.convoFillers === 'allow')    lines.push(`\nCONVO FILLERS: ${CONVO_FILLER_INSTRUCTIONS.allow}`);
  if (craftConfig.convoFillers === 'prohibit') lines.push(`\nCONVO FILLERS: ${CONVO_FILLER_INSTRUCTIONS.prohibit}`);
  if (craftConfig.doubleNegatives === 'use')   lines.push('\nDOUBLE NEGATIVES: Permitted and encouraged for dialectal authenticity.');
  if (craftConfig.doubleNegatives === 'avoid') lines.push('\nDOUBLE NEGATIVES: Avoid. Use standard negation.');

  if (craftConfig.momentum && craftConfig.momentum !== 'sustain') {
    const mom = MOMENTUM_INSTRUCTIONS[craftConfig.momentum];
    if (mom) lines.push(`\nMOMENTUM: ${craftConfig.momentum.toUpperCase()} — ${mom.instruction}`);
  }

  if (craftConfig.resolution) {
    const res = RESOLUTION_INSTRUCTIONS[craftConfig.resolution];
    if (res) lines.push(`\nRESOLUTION: ${craftConfig.resolution.toUpperCase()} — ${res.instruction}`);
  }

  if (craftConfig.narratorMorality) {
    const mor = NARRATOR_MORALITY_INSTRUCTIONS[craftConfig.narratorMorality];
    if (mor) lines.push(`\nNARRATOR MORALITY: ${craftConfig.narratorMorality.toUpperCase()} — ${mor.instruction}`);
  }

  if (craftConfig.stance) {
    const st = STANCE_INSTRUCTIONS[craftConfig.stance];
    if (st) lines.push(`\nSTANCE: ${craftConfig.stance.toUpperCase()} — ${st.instruction}`);
  }

  if (craftConfig.themeSensitivity) {
    const ts = THEME_SENSITIVITY_INSTRUCTIONS[craftConfig.themeSensitivity];
    if (ts) lines.push(`\nTHEME SENSITIVITY: ${craftConfig.themeSensitivity.toUpperCase()} — ${ts.instruction}`);
  }

  const restraintBlock = buildRestraintInstructions(craftConfig.restraint || {});
  if (restraintBlock) lines.push('\n' + restraintBlock);

  lines.push('─── END CRAFT PARAMETERS ───');
  return lines.join('\n') + '\n';
}

module.exports = {
  buildCraftBlock,
  RHETORICAL_DEVICE_INSTRUCTIONS,
  HUMOR_TYPE_INSTRUCTIONS,
  RHYME_TYPE_INSTRUCTIONS,
  METER_INSTRUCTIONS,
  LINE_WEIGHT_INSTRUCTIONS,
  DICTION_LEVEL_INSTRUCTIONS,
  GRAMMAR_INTENTIONALITY_INSTRUCTIONS,
  MOMENTUM_INSTRUCTIONS,
  RESOLUTION_INSTRUCTIONS,
  NARRATOR_MORALITY_INSTRUCTIONS,
  STANCE_INSTRUCTIONS,
  THEME_SENSITIVITY_INSTRUCTIONS,
};
