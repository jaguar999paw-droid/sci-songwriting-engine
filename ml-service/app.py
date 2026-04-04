"""
app.py — SCI ML Microservice
Flask API on port 3002 providing semantic NLP for the SCI songwriting engine.

Endpoints:
  POST /ml/analyze  — full text analysis (emotions, conflicts, traits, language)
  POST /ml/embed    — raw sentence embeddings
  GET  /ml/health   — service status
"""

import os
import sys
import time
from flask import Flask, request, jsonify
from flask_cors import CORS

# Lazy imports — loaded at first request or startup warm-up
from emotion_model  import detect_emotions, get_model
from conflict_model import classify_conflicts
from trait_model    import score_traits
from language_model import detect_language

app = Flask(__name__)
CORS(app)

_startup_time = time.time()
_model_loaded = False

def warm_up():
    """Pre-load the sentence-transformer model at startup (avoids cold-start latency)."""
    global _model_loaded
    try:
        get_model()  # triggers singleton load
        _model_loaded = True
        print(f"[SCI-ML] Model loaded in {time.time() - _startup_time:.1f}s", flush=True)
    except Exception as e:
        print(f"[SCI-ML] Model load failed: {e}", flush=True)


@app.route('/ml/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok' if _model_loaded else 'loading',
        'model': 'paraphrase-MiniLM-L6-v2',
        'loaded': _model_loaded,
        'uptime_s': round(time.time() - _startup_time, 1),
    })


@app.route('/ml/analyze', methods=['POST'])
def analyze():
    """
    Body: { text: string }
    Returns: { emotions, conflicts, traits, languageMix, confidence }
    """
    data = request.get_json(silent=True) or {}
    text = data.get('text', '').strip()

    if not text:
        return jsonify({'error': 'text is required'}), 400
    if not _model_loaded:
        return jsonify({'error': 'model not yet loaded'}), 503

    try:
        emotions   = detect_emotions(text)
        conflicts  = classify_conflicts(text)
        traits     = score_traits(text)
        lang       = detect_language(text)

        # Confidence = average of top emotion score + top conflict score
        top_emotion_score  = emotions[0]['score']  if emotions  else 0
        top_conflict_score = list(conflicts.values())[0] if conflicts else 0
        confidence = round((top_emotion_score + top_conflict_score) / 2, 4)

        return jsonify({
            'emotions':    emotions,
            'conflicts':   conflicts,
            'traits':      traits,
            'languageMix': lang,
            'confidence':  confidence,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/ml/embed', methods=['POST'])
def embed():
    """
    Body: { texts: [string] }
    Returns: { embeddings: [[float]] }
    """
    data  = request.get_json(silent=True) or {}
    texts = data.get('texts', [])
    if not texts or not isinstance(texts, list):
        return jsonify({'error': 'texts array is required'}), 400
    if not _model_loaded:
        return jsonify({'error': 'model not yet loaded'}), 503
    try:
        model  = get_model()
        embeds = model.encode(texts).tolist()
        return jsonify({'embeddings': embeds})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    warm_up()
    port = int(os.environ.get('ML_PORT', 3002))
    print(f"[SCI-ML] Starting on port {port}", flush=True)
    app.run(host='0.0.0.0', port=port, debug=False)
