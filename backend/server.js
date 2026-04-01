/**
 * server.js
 * SCI Songwriting Engine — Express Backend
 * 
 * Routes:
 *   POST /api/analyze     → Parse identity from questionnaire answers
 *   POST /api/generate    → Generate full song from parsed identity
 *   POST /api/section     → Generate a single section (real-time streaming use case)
 *   GET  /api/health      → Health check
 */

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');

// Engine modules
const { parseIdentity }   = require('../engine/identityParser');
const { buildPersona }    = require('../engine/personaBuilder');
const { extractMessage }  = require('../engine/messageExtractor');
const { planStructure }   = require('../engine/structurePlanner');
const { mapStyle }        = require('../engine/styleMapper');

// AI layer
const { generateFullSong, generateSection, formatSong } = require('../ai/generator');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', engine: 'SCI Songwriting Engine' });
});

// ─── Analyze Identity ──────────────────────────────────────────────────────────
/**
 * POST /api/analyze
 * Body: { answers: { whoAreYouNot, emotionalTruth, socialConflict, ... } }
 * Returns: { persona, message, structure, style }
 */
app.post('/api/analyze', (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ error: 'No answers provided.' });
    }

    // Run engine pipeline (no AI needed here)
    const parsed    = parseIdentity(answers);
    const persona   = buildPersona(parsed);
    const message   = extractMessage(parsed);
    const structure = planStructure(persona, message);
    const style     = mapStyle(persona);

    res.json({
      success: true,
      parsed,
      persona,
      message,
      structure,
      style,
    });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Generate Full Song ────────────────────────────────────────────────────────
/**
 * POST /api/generate
 * Body: { persona, message, structure, style, apiKey, provider }
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { persona, message, structure, style, apiKey, provider = 'claude' } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required.' });
    }

    const sections = await generateFullSong({
      structure,
      persona,
      message,
      style,
      apiKey,
      provider,
    });

    const formatted = formatSong(sections);

    res.json({
      success:  true,
      sections,
      song:     formatted,
      metadata: {
        archetype:    persona.archetype,
        coreMessage:  message.coreMessage,
        structure:    structure.conflictType,
        language:     persona.languageMix,
      },
    });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Generate Single Section ──────────────────────────────────────────────────
/**
 * POST /api/section
 * Body: { section, persona, message, style, previousSections, apiKey, provider }
 */
app.post('/api/section', async (req, res) => {
  try {
    const { section, persona, message, style, previousSections = [], apiKey, provider = 'claude' } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required.' });
    }

    const generated = await generateSection({
      section,
      persona,
      message,
      style,
      previousSections,
      apiKey,
      provider,
    });

    res.json({ success: true, section: generated });
  } catch (err) {
    console.error('Section generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎵 SCI Songwriting Engine running at http://localhost:${PORT}`);
  console.log(`   Engine: Rule-based identity parser + AI generation`);
  console.log(`   Docs:   ../docs/architecture.md\n`);
});
