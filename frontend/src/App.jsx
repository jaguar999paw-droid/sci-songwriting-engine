/**
 * App.jsx — v2 Root application component
 *
 * Flow:
 *   Step 0: Landing
 *   Step 1: Cockpit.jsx        — 3-panel spatial identity input (v2)
 *   Step 2: CockpitPreview.jsx — cinematic persona reveal (v2)
 *   Step 3: Generator.jsx      — section-by-section AI generation
 *   Step 4: SongDisplay.jsx    — v2 with per-section regen + save
 *
 * Legacy pages (Questionnaire, PersonaReview) kept but @deprecated.
 */
import { useState } from 'react'
import Landing        from './pages/Landing'
import Cockpit        from './pages/Cockpit'
import CockpitPreview from './pages/CockpitPreview'
import Generator      from './pages/Generator'
import SongDisplay    from './pages/SongDisplay'
import styles         from './App.module.css'

export default function App() {
  const [step,     setStep]     = useState(0)
  const [answers,  setAnswers]  = useState({})
  const [analysis, setAnalysis] = useState(null)
  const [song,     setSong]     = useState(null)
  const [apiKey,   setApiKey]   = useState(localStorage.getItem('sci_api_key') || '')
  const [provider, setProvider] = useState(localStorage.getItem('sci_provider') || 'claude')

  function saveApiKey(key) {
    setApiKey(key)
    localStorage.setItem('sci_api_key', key)
  }

  function saveProvider(p) {
    setProvider(p)
    localStorage.setItem('sci_provider', p)
  }

  function handleAnswersDone(submittedAnswers) {
    setAnswers(submittedAnswers)
    setStep(2)
  }

  function handleAnalysisDone(data) {
    setAnalysis(data)
    setStep(3)
  }

  function handleSongDone(data) {
    setSong(data)
    setStep(4)
  }

  function restart() {
    setStep(1); setAnswers({}); setAnalysis(null); setSong(null)
  }

  return (
    <div className={styles.app}>
      {step === 0 && (
        <Landing
          onStart={() => setStep(1)}
          apiKey={apiKey}
          onSaveApiKey={saveApiKey}
          provider={provider}
          onSetProvider={saveProvider}
        />
      )}
      {step === 1 && (
        <Cockpit onDone={handleAnswersDone} />
      )}
      {step === 2 && (
        <CockpitPreview answers={answers} onAnalysis={handleAnalysisDone} />
      )}
      {step === 3 && analysis && (
        <Generator
          analysis={analysis}
          apiKey={apiKey}
          provider={provider}
          onDone={handleSongDone}
        />
      )}
      {step === 4 && song && (
        <SongDisplay
          song={song}
          analysis={analysis}
          onRestart={restart}
        />
      )}
    </div>
  )
}
