# SCI Songwriting Engine — Habitat Upgrade Progress

## Branch: `v2-cockpit-ml`

---

## What is the Habitat Upgrade?

The engine is being refactored from a **flat questionnaire input model** into a
**staged, phase-aware identity construction interface** — mirroring the way
Habitat-Lab exposes agent state: surface inferences, allow human correction,
maintain a live schema-validated property bag throughout.

---

## Completed

### Engine Layer
- `engine/identitySchema.js` — single source of truth for all identity properties.
  Types, ranges, defaults, UI control hints, and engine targets.
- `engine/propertyTensionEngine.js` — cross-property tension detection.
  Flags contradictions (e.g. high certainty + high confusion), surfaces tension summary.
- `engine/identityParser.js` — updated (v3) to use schema defaults, pass craft/identityConfig.
- `backend/server.js` — v3: wires craft + identityConfig overrides through to promptBuilder.

### Frontend Components
| Component | Status | Purpose |
|---|---|---|
| `EmotionGrid.jsx` | ✅ Done | Phase 2 emotion selector — primary + up to 3 secondary |
| `IdentitySliders.jsx` | ✅ Done | Phase 3 mixing board — rawness, certainty, fault, exposure |
| `InferencePreview.jsx` | ✅ Done | Engine inference display — clickable override chips |
| `IdentityRadar.jsx` | ✅ Done | Hexagonal SVG radar — 6-angle identity visualization |

### Pages
| Page | Status | Notes |
|---|---|---|
| `Cockpit.jsx` | ✅ Done (v3) | Refactored to 4-phase flow. See below. |

---

## Cockpit v3 — 4-Phase Flow

```
Phase 1: SPEAK
  Core message · Emotional truth · Social conflict · Sub-themes · Reference text
  → POST /api/analyze
  ↓
Phase 2: FEEL
  InferencePreview (engine detections, clickable overrides)
  EmotionGrid (confirm / correct primary + secondary emotions)
  ↓
Phase 3: KNOW
  IdentitySliders (mixing board: rawness, certainty, fault, exposure)
  IdentityRadar (live hexagonal output — 6-angle identity × temporal weights)
  ↓
Phase 4: CRAFT
  Archetype · Energy/Rawness knobs · Language mix · Perspective · Rhyme scheme
  Config summary + mini radar
  → IGNITE → onDone()
```

**onDone() payload** (unchanged contract, extended):
```js
{
  mainIdea, emotionalTruth, socialConflict, referenceText,
  overrides: {
    rawness, energyValue, rhymeScheme, perspective, languageMix,
    archetype, subThemes,
    primaryEmotion, secondaryEmotions,   // NEW
    identitySliders: { rawness, decisiveness, attribution, vulnerability_level }  // NEW
  },
  analyzed: <raw /api/analyze response>   // NEW — avoids re-analysis downstream
}
```

---

## IdentityRadar — Architecture

The radar maps the **6-angle identity framework** onto a hexagonal SVG:

| Axis | Source |
|---|---|
| Past · Real | `temporalProfile.temporal.past × attribution` |
| Past · Shadow | `temporalProfile.temporal.past × (1 - attribution)` |
| Now · Real | `temporalProfile.temporal.present × decisiveness` |
| Now · Shadow | `temporalProfile.temporal.present × (1 - decisiveness)` |
| Future · Vision | `temporalProfile.temporal.future × (1 - conflictScore)` |
| Future · Fear | `temporalProfile.temporal.future × conflictScore` |

Values re-derive live as the user moves the IdentitySliders. The radar
updates in Phase 3 and shows a mini version in Phase 4's config sidebar.

---

## Still To Do

- [ ] `InferencePreview` override → modal UI (currently logs to console)
- [ ] Phase 2 → `identityParser.js` override injection (let user corrections
      flow back into the next `/api/analyze` call)
- [ ] Mobile layout: Phase nav wraps, knowGrid collapses to 1-col
- [ ] `IdentityRadar` — add tooltip on dot hover showing axis name + value
- [ ] `PERSIST_KEY` migration: clear old `sci_cockpit_v2` on load

---

## Session History

| Date | Work |
|---|---|
| Session N-2 | Built engine layer: identitySchema, propertyTensionEngine, altEgoEngine, identityConfig |
| Session N-1 | Built frontend components: EmotionGrid, IdentitySliders, InferencePreview |
| Session N   | Built IdentityRadar, refactored Cockpit to 4-phase flow, wrote this doc, committed |

