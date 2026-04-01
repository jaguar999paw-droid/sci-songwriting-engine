/**
 * promptBuilder.js
 * 
 * Constructs structured prompts for the AI layer.
 * Each section gets its own focused prompt — preventing freeform generation.
 * 
 * Prompt strategy based on SONG_QUESTIONAIRE.md WH-questions and SCI philosophy.
 */

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a structured songwriting engine called SCI (Structured Creative Intelligence).

Your role is to write ONE SECTION of a song at a time, exactly as instructed.

RULES YOU MUST FOLLOW:
1. Write ONLY the requested section (verse / hook / bridge / pre-hook / intro / outro)
2. Follow the specified rhyme scheme exactly
3. Match the persona's voice, tone, and perspective
4. Use the language blend as instructed (English / Kiswahili / Sheng)
5. Serve the stated GOAL of the section — don't drift
6. Do NOT include section labels (e.g., don't write "Verse 1:" in the lyrics)
7. Do NOT explain your choices or add commentary — only output the lyrics
8. Keep line count close to the specified number (±1 line is acceptable)
9. Use the imagery style to ground the writing in concrete, sensory language
10. The core message is the spine — every section must connect back to it

You are not a general-purpose writer. You are a disciplined songwriting intelligence.`;

// ─── Section Prompt Builder ────────────────────────────────────────────────────

/**
 * Build a full prompt for one section
 * @param {object} section - from structurePlanner output
 * @param {object} persona - from personaBuilder
 * @param {object} message - from messageExtractor
 * @param {object} style   - from styleMapper
 * @param {Array}  previousSections - array of { type, goal, lyrics } for context
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildSectionPrompt(section, persona, message, style, previousSections = []) {
  // Build context block from previously generated sections
  let contextBlock = '';
  if (previousSections.length > 0) {
    contextBlock = '\n\n--- PREVIOUSLY WRITTEN SECTIONS (for continuity) ---\n';
    contextBlock += previousSections.map(s =>
      `[${s.type.toUpperCase()} — ${s.goal}]\n${s.lyrics}`
    ).join('\n\n');
    contextBlock += '\n--- END OF PREVIOUS SECTIONS ---';
  }

  const userPrompt = `
SONG BRIEF
----------
Core Message: ${message.coreMessage}
Sub-Themes: ${(message.subThemes || []).join(', ') || 'none'}

PERSONA
-------
Archetype:    ${persona.archetype}
Voice:        ${persona.voice}
Perspective:  ${persona.perspective} person
Tone:         ${persona.tone}
Energy:       ${persona.energy}
Emotions:     ${persona.primaryEmotion}${persona.secondaryEmotions.length ? ', ' + persona.secondaryEmotions.join(', ') : ''}

STYLE RULES
-----------
Rhyme Scheme: ${style.rhymeScheme} — ${style.rhymeDescription}
Flow:         ${style.flowStyle}
Language:     ${style.languageInstructions}
Imagery:      ${style.imageryStyle}
Devices:      ${style.lyricalDevices.join(', ')}

SECTION TO WRITE
----------------
Type:         ${section.type.toUpperCase()}
Goal:         ${section.goal} — ${section.description}
Line Count:   approximately ${section.lines} lines
Hook Style:   ${section.type === 'hook' ? style.hookStyle : 'N/A'}
Bridge Style: ${section.type === 'bridge' ? style.bridgeStyle : 'N/A'}
${contextBlock}

Now write ONLY this ${section.type.toUpperCase()} section. Output lyrics only. No labels, no commentary.
`.trim();

  return { systemPrompt: SYSTEM_PROMPT, userPrompt };
}

/**
 * Build a full song prompt for a single-pass generation (simpler use case)
 */
function buildFullSongPrompt(structure, persona, message, style) {
  const sectionList = structure.sections.map(s =>
    `Section ${s.index}: ${s.type.toUpperCase()} — Goal: ${s.goal}`
  ).join('\n');

  const userPrompt = `
SONG BRIEF
----------
Core Message: ${message.coreMessage}

PERSONA
-------
Archetype: ${persona.archetype} | Voice: ${persona.voice}
Perspective: ${persona.perspective} person | Tone: ${persona.tone}

STYLE
-----
Rhyme: ${style.rhymeScheme} | Language: ${persona.languageMix}
Flow: ${style.flowStyle}

STRUCTURE
---------
${sectionList}

Write the complete song following this structure exactly. 
Label each section clearly (e.g., [VERSE 1], [HOOK], [BRIDGE]).
Lyrics only — no explanations.
`.trim();

  return { systemPrompt: SYSTEM_PROMPT, userPrompt };
}

module.exports = { buildSectionPrompt, buildFullSongPrompt, SYSTEM_PROMPT };
