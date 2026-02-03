import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [hoogsteTafel, setHoogsteTafel] = useState(10)
  const [quizStarted, setQuizStarted] = useState(false)
  const [huidigeSom, setHuidigeSom] = useState(null)
  const [gebruikersAntwoord, setGebruikersAntwoord] = useState('')
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState({ goed: 0, fout: 0 })
  const [tijd, setTijd] = useState(0)
  const [tijdOp, setTijdOp] = useState(false)

  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const autoVolgendeSomRef = useRef(null)

  // Geluid functies met Web Audio API
  const speelGoedGeluid = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 523.25 // C note
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)

    // Tweede toon voor vrolijk effect
    setTimeout(() => {
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      osc2.frequency.value = 659.25 // E note
      osc2.type = 'sine'
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      osc2.start(audioContext.currentTime)
      osc2.stop(audioContext.currentTime + 0.2)
    }, 100)
  }

  const speelFoutGeluid = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 200
    oscillator.type = 'sawtooth'
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.4)
  }

  const speelTijdOpGeluid = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.value = 300
        oscillator.type = 'square'
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.15)
      }, i * 150)
    }
  }

  // Timer effect
  useEffect(() => {
    if (quizStarted && !tijdOp) {
      timerRef.current = setInterval(() => {
        setTijd(prev => {
          if (prev >= 300) { // 5 minuten = 300 seconden
            setTijdOp(true)
            speelTijdOpGeluid()
            clearInterval(timerRef.current)
            return 300
          }
          return prev + 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [quizStarted, tijdOp])

  // Focus op input bij nieuwe som
  useEffect(() => {
    if (huidigeSom && inputRef.current && !tijdOp) {
      inputRef.current.focus()
    }
  }, [huidigeSom, tijdOp])

  // Cleanup auto-volgende-som timer bij unmount
  useEffect(() => {
    return () => {
      if (autoVolgendeSomRef.current) {
        clearTimeout(autoVolgendeSomRef.current)
      }
    }
  }, [])

  const formateerTijd = (seconden) => {
    const minuten = Math.floor(seconden / 60)
    const sec = seconden % 60
    return `${minuten}:${sec.toString().padStart(2, '0')}`
  }

  const genereerNieuweSom = () => {
    // Clear de auto-volgende-som timer als die er is
    if (autoVolgendeSomRef.current) {
      clearTimeout(autoVolgendeSomRef.current)
      autoVolgendeSomRef.current = null
    }

    const getal1 = Math.floor(Math.random() * hoogsteTafel) + 1
    const getal2 = Math.floor(Math.random() * hoogsteTafel) + 1
    setHuidigeSom({ getal1, getal2, antwoord: getal1 * getal2 })
    setGebruikersAntwoord('')
    setFeedback('')
  }

  const startQuiz = () => {
    setQuizStarted(true)
    setScore({ goed: 0, fout: 0 })
    setTijd(0)
    setTijdOp(false)
    genereerNieuweSom()
  }

  const controleerAntwoord = () => {
    if (tijdOp) return

    const antwoord = parseInt(gebruikersAntwoord)

    if (isNaN(antwoord) || gebruikersAntwoord === '') {
      return
    }

    if (antwoord === huidigeSom.antwoord) {
      setFeedback('✓ Goed!')
      setScore(prev => ({ ...prev, goed: prev.goed + 1 }))
      speelGoedGeluid()

      // Na 2 seconden automatisch naar volgende som
      autoVolgendeSomRef.current = setTimeout(() => {
        genereerNieuweSom()
      }, 2000)
    } else {
      setFeedback(`✗ Fout! Het juiste antwoord is ${huidigeSom.antwoord}`)
      setScore(prev => ({ ...prev, fout: prev.fout + 1 }))
      speelFoutGeluid()
    }
  }

  const volgendeSom = () => {
    if (tijdOp) return
    genereerNieuweSom()
  }

  const stopQuiz = () => {
    setQuizStarted(false)
    setHuidigeSom(null)
    setFeedback('')
    setGebruikersAntwoord('')
    setTijd(0)
    setTijdOp(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (autoVolgendeSomRef.current) {
      clearTimeout(autoVolgendeSomRef.current)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (tijdOp) return

      if (feedback === '') {
        controleerAntwoord()
      } else {
        volgendeSom()
      }
    }
  }

  if (!quizStarted) {
    return (
      <div className="container">
        <h1>🧮 Keersom Quiz</h1>
        <div className="setup-card">
          <label htmlFor="hoogsteTafel">
            Hoogste tafeltje:
            <input
              id="hoogsteTafel"
              type="number"
              min="2"
              max="20"
              value={hoogsteTafel}
              onChange={(e) => setHoogsteTafel(parseInt(e.target.value) || 2)}
            />
          </label>
          <p className="info">
            Je oefent met de tafels van 1 tot en met {hoogsteTafel}
          </p>
          <p className="info">
            ⏱️ Je hebt 5 minuten de tijd
          </p>
          <button className="btn-primary" onClick={startQuiz}>
            Start Quiz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🧮 Keersom Quiz</h1>
        <div className="score-container">
          <div className={`timer ${tijd >= 240 ? 'warning' : ''} ${tijdOp ? 'tijdop' : ''}`}>
            ⏱️ {formateerTijd(tijd)} / 5:00
          </div>
          <div className="score">
            <span className="goed">✓ {score.goed}</span>
            <span className="fout">✗ {score.fout}</span>
          </div>
        </div>
      </div>

      {tijdOp ? (
        <div className="quiz-card">
          <div className="tijd-op-melding">
            <h2>⏰ Tijd is op!</h2>
            <div className="eind-score">
              <p>Aantal goed: <strong className="goed">{score.goed}</strong></p>
              <p>Aantal fout: <strong className="fout">{score.fout}</strong></p>
              <p>Totaal: <strong>{score.goed + score.fout}</strong> sommen</p>
              {score.goed + score.fout > 0 && (
                <p>Score: <strong>{Math.round((score.goed / (score.goed + score.fout)) * 100)}%</strong></p>
              )}
            </div>
            <button className="btn-primary" onClick={startQuiz}>
              Opnieuw Proberen
            </button>
            <button className="btn-secondary" onClick={stopQuiz}>
              Terug naar Start
            </button>
          </div>
        </div>
      ) : (
        <div className="quiz-card">
          <div className="som">
            <span className="getal">{huidigeSom.getal1}</span>
            <span className="operator">×</span>
            <span className="getal">{huidigeSom.getal2}</span>
            <span className="operator">=</span>
            <input
              ref={inputRef}
              type="number"
              className="antwoord-input"
              value={gebruikersAntwoord}
              onChange={(e) => setGebruikersAntwoord(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={feedback !== ''}
              autoFocus
            />
          </div>

          {feedback && (
            <div className={`feedback ${feedback.includes('✓') ? 'goed' : 'fout'}`}>
              {feedback}
              {feedback.includes('✓') && <span className="auto-volgende"> (automatisch verder...)</span>}
            </div>
          )}

          <div className="button-group">
            {feedback === '' ? (
              <button className="btn-primary" onClick={controleerAntwoord}>
                Controleer
              </button>
            ) : (
              <button className="btn-primary" onClick={volgendeSom}>
                Volgende Som
              </button>
            )}
            <button className="btn-secondary" onClick={stopQuiz}>
              Stop Quiz
            </button>
          </div>
        </div>
      )}

      <div className="hint">
        💡 Tip: Druk op Enter om te controleren en door te gaan naar de volgende vraag
      </div>
    </div>
  )
}

export default App
