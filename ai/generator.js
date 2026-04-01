/**
 * generator.js
 * 
 * AI Layer — Section-by-section song generation using the Anthropic Claude API.
 * Uses structured prompts from promptBuilder.js — NO freeform generation.
 * 
 * Supports:
 * - Section-by-section generation (recommended)
 * - Single-pass full song generation (fallback)
 * - Provider abstraction (easy to swap to OpenAI)
 */

const { buildSectionPrompt, buildFullSongPrompt } = require('./promptBuilder');

// ─── Provider Abstraction ──────────────────────────────────────────────────────

/**
 * Call the Claude API (Anthropic)
 * @param {string} systemPrompt 
 * @param {string} userPrompt 
 * @param {string} apiKey 
 * @returns {Promise<string>}
 */
async function callClaude(systemPrompt, userPrompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':         'application/json',
      'x-api-key':            apiKey,
      'anthropic-version':    '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-opus-4-5',
      max_tokens: 1024,
      system:     systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Claude API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0]?.text?.trim() || '';
}

/**
 * Call the OpenAI API (optional alternative)
 * @param {string} systemPrompt 
 * @param {string} userPrompt 
 * @param {string} apiKey 
 * @returns {Promise<string>}
 */
async function callOpenAI(systemPrompt, userPrompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:    'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens:  1024,
      temperature: 0.85,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`OpenAI API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

// ─── Core Generator ────────────────────────────────────────────────────────────

/**
 * Generate a single song section
 * @param {object} params
 * @returns {Promise<{ type, goal, lyrics }>}
 */
async function generateSection({ section, persona, message, style, previousSections = [], apiKey, provider = 'claude' }) {
  const { systemPrompt, userPrompt } = buildSectionPrompt(section, persona, message, style, previousSections);

  let lyrics;
  if (provider === 'openai') {
    lyrics = await callOpenAI(systemPrompt, userPrompt, apiKey);
  } else {
    lyrics = await callClaude(systemPrompt, userPrompt, apiKey);
  }

  return {
    type:   section.type,
    goal:   section.goal,
    index:  section.index,
    lyrics,
  };
}

/**
 * Generate a complete song section-by-section
 * @param {object} params
 * @returns {Promise<Array<{ type, goal, lyrics }>>}
 */
async function generateFullSong({ structure, persona, message, style, apiKey, provider = 'claude', onProgress }) {
  const generatedSections = [];

  for (const section of structure.sections) {
    // Pass previously generated sections for narrative continuity
    const generated = await generateSection({
      section,
      persona,
      message,
      style,
      previousSections: generatedSections,
      apiKey,
      provider,
    });

    generatedSections.push(generated);

    // Optional progress callback for real-time UI updates
    if (typeof onProgress === 'function') {
      onProgress({
        completed: generatedSections.length,
        total:     structure.sections.length,
        latest:    generated,
      });
    }
  }

  return generatedSections;
}

/**
 * Format generated sections into a readable song string
 * @param {Array<{ type, goal, lyrics }>} sections 
 * @returns {string}
 */
function formatSong(sections) {
  return sections.map(s => {
    const label = `[${s.type.toUpperCase()}]`;
    return `${label}\n${s.lyrics}`;
  }).join('\n\n');
}

module.exports = { generateSection, generateFullSong, formatSong };
