/**
 * server.js — SCI Songwriting Engine Backend v2
 *
 * Routes:
 *   POST /api/analyze     → Parse identity (ML-enhanced, rule-based fallback)
 *   POST /api/generate    → Generate full song
 *   POST /api/section     → Generate / regenerate a single section
 *   POST /api/save        → Save session to ~/.sci-sessions/[timestamp].json
 *   GET  /api/sessions    → List saved sessions
 *   GET  /api/health      → Health check (includes ML service status)
 *
 * v2 changes:
 *   - /api/analyze now uses async parseIdentity (ML-integrated)
 *   - accepts style overrides: { rawness, rhymeScheme, referenceText }
 *   - /api/section accepts `seed` for regeneration determinism
 *   - /api/save + /api/sessions for session persistence
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');

// Engine modules
const { parseIdentity }      = require('../engine/identityParser');
const { buildPersona }       = require('../engine/personaBuilder');
const { extractMessage }     = require('../engine/messageExtractor');
const { planStructure }      = require('../engine/structurePlanner');
const { mapStyle }           = require('../engine/styleMapper');
const { analyzeReference }   = require('../engine/referenceAnalyzer');

// AI layer
const { generateFullSong, generateSection, formatSong } = require('../ai/generator');

const app  = express();
const PORT = process.env.PORT || 3001;

// Sessions directory
const SESSIONS_DIR = path.join(os.homedir(), '.sci-sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  let mlStatus = 'unavailable';
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 400);
    const r = await fetch('http://localhost:3002/ml/health', { signal: controller.signal });
    if (r.ok) {
      const d = await r.json();
      mlStatus = d.status;
    }
  } catch { /* ML offline */ }

  res.json({
    status:    'ok',
    version:   '2.0.0',
    engine:    'SCI Songwriting Engine',
    mlService: mlStatus,
  });
});

// ── Analyze Identity (v2: async, ML-integrated) ───────────────────────────────
/**
 * POST /api/analyze
 * Body: {
 *   answers: { whoAreYouNot, emotionalTruth, socialConflict, mainIdea, referenceText, ... },
 *   overrides?: { rawness: 0-100, rhymeScheme: 'AABB'|'ABAB'|..., energyValue: 0-100 }
 * }
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { answers, overrides = {} } = req.body;
    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ error: 'No answers provided.' });
    }

    // Analyze reference text if provided
    const referenceProfile = answers.referenceText
      ? analyzeReference(answers.referenceText)
      : { hasReference: false };

    // ML-aware identity parse (async; falls back to rule-based on timeout)
    const parsed  = await parseIdentity(answers);

    // Merge cockpit overrides into parsed for downstream use
    parsed.overrides = overrides;

    const persona   = buildPersona(parsed);

    // Inject energy slider value for emotion-weighted structure
    if (overrides.energyValue !== undefined) {
      persona.energyValue = overrides.energyValue;
    }

    const message   = extractMessage(parsed);
    const structure = planStructure(persona, message);
    const style     = mapStyle(persona, {
      rawness:     overrides.rawness,
      rhymeScheme: overrides.rhymeScheme || referenceProfile.rhymeScheme,
    });

    res.json({
      success: true,
      parsed,
      persona,
      message,
      structure,
      style,
      referenceProfile,
      mlUsed:       parsed.mlUsed,
      mlConfidence: parsed.mlConfidence,
    });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Generate Full Song ────────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  try {
    const { persona, message, structure, style, apiKey, provider = 'claude' } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API key is required.' });

    const sections = await generateFullSong({ structure, persona, message, style, apiKey, provider });
    const formatted = formatSong(sections);

    res.json({
      success:  true,
      sections,
      song:     formatted,
      metadata: {
        archetype:   persona.archetype,
        coreMessage: message.coreMessage,
        structure:   structure.conflictType,
        language:    persona.languageMix,
      },
    });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Generate / Regenerate Single Section ─────────────────────────────────────
/**
 * POST /api/section
 * Body: { section, persona, message, style, previousSections, apiKey, provider, seed? }
 * seed: integer — increment to get a different generation for the same section
 */
app.post('/api/section', async (req, res) => {
  try {
    const {
      section, persona, message, style,
      previousSections = [], apiKey,
      provider = 'claude', seed = 0,
    } = req.body;

    if (!apiKey) return res.status(400).json({ error: 'API key is required.' });

    // Inject seed into style hint so the AI gets a slightly different framing
    const styleWithSeed = seed > 0
      ? { ...style, seedHint: `Variation ${seed} — use a different angle, metaphor, or opening line.` }
      : style;

    const generated = await generateSection({
      section, persona, message,
      style: styleWithSeed,
      previousSections, apiKey, provider,
    });

    res.json({ success: true, section: generated });
  } catch (err) {
    console.error('Section generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Save Session ──────────────────────────────────────────────────────────────
/**
 * POST /api/save
 * Body: { persona, message, structure, style, sections, metadata }
 * Saves to ~/.sci-sessions/[timestamp].json
 */
app.post('/api/save', (req, res) => {
  try {
    const session   = req.body;
    const timestamp = Date.now();
    const filename  = `session-${timestamp}.json`;
    const filepath  = path.join(SESSIONS_DIR, filename);

    const payload = {
      ...session,
      savedAt: new Date().toISOString(),
      id:      timestamp,
    };

    fs.writeFileSync(filepath, JSON.stringify(payload, null, 2));
    res.json({ success: true, id: timestamp, filename, path: filepath });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── List Sessions ─────────────────────────────────────────────────────────────
/**
 * GET /api/sessions
 * Returns list of saved sessions (metadata only, not full lyrics)
 */
app.get('/api/sessions', (req, res) => {
  try {
    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse() // newest first
      .slice(0, 50); // cap at 50

    const sessions = files.map(f => {
      try {
        const raw  = fs.readFileSync(path.join(SESSIONS_DIR, f), 'utf8');
        const data = JSON.parse(raw);
        return {
          id:         data.id,
          savedAt:    data.savedAt,
          archetype:  data.metadata?.archetype,
          coreMessage: data.metadata?.coreMessage,
          structure:  data.metadata?.structure,
          filename:   f,
        };
      } catch {
        return { filename: f, error: 'parse error' };
      }
    });

    res.json({ success: true, sessions, count: sessions.length });
  } catch (err) {
    console.error('Sessions list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎵 SCI Songwriting Engine v2 running at http://localhost:${PORT}`);
  console.log(`   ML Service expected at http://localhost:3002`);
  console.log(`   Sessions dir: ${SESSIONS_DIR}\n`);
});
