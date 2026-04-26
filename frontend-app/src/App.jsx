import { useState, useEffect, useRef } from 'react'
import { BookOpen, Music, Layers, Play, Pause, ArrowLeft, ChevronRight, Volume2, Settings, BookCheck } from 'lucide-react'

const API = 'http://localhost:3456/api'

const COLORS = {
  dark: '#0d0d0d',
  darkGray: '#1a1a1a', 
  mediumGray: '#2d2d2d',
  lightGray: '#3d3d3d',
  accent: '#00ff88',
  accentDim: '#00cc6a',
  text: '#ffffff',
  textMuted: '#888888',
  white: '#ffffff',
  surface: '#141414'
}

function NavItem({ icon, label, active }) {
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: 12, 
      padding: '12px 16px', borderRadius: 8, 
      background: active ? COLORS.mediumGray : 'transparent',
      color: active ? COLORS.accent : COLORS.textMuted,
      cursor: 'pointer', marginBottom: 4
    }}>
      {icon}
      <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function App() {
  const [cursos, setCursos] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch(API + '/cursos').then(r => r.json()).then(data => setCursos(data || []))
  }, [])

  if (selected) return <CourseView curso={selected} goBack={() => setSelected(null)} />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.dark }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: COLORS.darkGray, padding: '24px 0', borderRight: `1px solid ${COLORS.mediumGray}` }}>
        <div style={{ padding: '0 24px', marginBottom: 32 }}>
          <h1 style={{ color: COLORS.accent, fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>DEUTSCH</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>LERNEN PLATFORM</p>
        </div>
        
        <nav style={{ padding: '0 12px' }}>
          <NavItem icon={<BookOpen size={18} />} label="Courses" active />
        </nav>
        
        <div style={{ position: 'absolute', bottom: 24, padding: '0 24px', color: COLORS.textMuted, fontSize: 11 }}>
          v1.0 • Deutsch Lernen
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 40, background: COLORS.dark }}>
        <h2 style={{ color: COLORS.text, fontSize: 28, fontWeight: 600, marginBottom: 32 }}>Courses</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {cursos.map(curso => (
            <div 
              key={curso.id} 
              onClick={() => setSelected(curso)}
              style={{ 
                background: COLORS.mediumGray, 
                borderRadius: 8, 
                padding: 20, 
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: `1px solid ${COLORS.lightGray}`
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.lightGray}
            >
              <span style={{ 
                background: COLORS.accent + '20', 
                color: COLORS.accent, 
                padding: '4px 10px', 
                borderRadius: 4, 
                fontSize: 11, 
                fontWeight: 600 
              }}>
                {curso.nivel}
              </span>
              <h3 style={{ color: COLORS.text, fontSize: 16, fontWeight: 600, marginTop: 12 }}>{curso.nombre}</h3>
              <p style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 8 }}>{curso.descripcion}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function CourseView({ curso, goBack }) {
  const [tab, setTab] = useState('themenkreise')
  const [data, setData] = useState({ kb: null, ab: null, audio: [], cds: [], tks: [] })
  const [loading, setLoading] = useState(true)
  const [selectedCd, setSelectedCd] = useState(null)
  const [currentAudio, setCurrentAudio] = useState(null)
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)

  useEffect(() => { loadContent() }, [curso.id])

  async function loadContent() {
    setLoading(true)
    const [kb, ab, aud, cds, tks] = await Promise.all([
      fetch(API + '/file/' + curso.id + '/kursbuch/1').then(r => r.json()),
      fetch(API + '/file/' + curso.id + '/arbeitsbuch/1').then(r => r.json()),
      fetch(API + '/audio/list/' + curso.id).then(r => r.json()),
      fetch(API + '/audio/cds/' + curso.id).then(r => r.json()),
      fetch(API + '/themenkreise/' + curso.id).then(r => r.json())
    ])
    setData({ kb: kb, ab: ab, audio: aud || [], cds: cds || [], tks: tks || [] })
    if (cds?.length > 0) setSelectedCd(cds[0])
    setLoading(false)
  }

  const isVerbos = curso.nombre?.toLowerCase().includes('yellow')

  function playTrack(track) {
    if (audioRef.current) {
      audioRef.current.src = track.path
      audioRef.current.playbackRate = playbackRate
      audioRef.current.play()
      setCurrentAudio(track)
      setIsPlaying(true)
    }
  }

  function togglePlay() {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()
    setIsPlaying(!isPlaying)
  }

  function handleTimeUpdate() {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime)
      setDuration(audioRef.current.duration || 0)
    }
  }

  function seek(e) {
    if (audioRef.current && duration) {
      const rect = e.target.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percent = x / rect.width
      audioRef.current.currentTime = percent * duration
    }
  }

  function changeSpeed(rate) {
    setPlaybackRate(rate)
    if (audioRef.current) audioRef.current.playbackRate = rate
  }

  function formatTime(s) {
    if (!s) return '0:00'
    const mins = Math.floor(s / 60)
    const secs = Math.floor(s % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const tabs = isVerbos 
    ? [{ id: 'themenkreise', label: 'Übungen', icon: <Layers size={16} /> }]
    : [
        { id: 'themenkreise', label: 'Units', icon: <Layers size={16} /> },
        { id: 'kursbuch', label: 'Kursbuch', icon: <BookOpen size={16} /> },
        { id: 'arbeitsbuch', label: 'Arbeitsbuch', icon: <BookOpen size={16} /> },
        { id: 'ejercicios', label: 'Ejercicios', icon: <BookCheck size={16} /> }
      ].filter(t => t.id !== 'kursbuch' || data.kb?.exists)

  const showAudio = data.cds.length > 0
  const filteredAudio = selectedCd ? data.audio.filter(a => a.cd === selectedCd.label) : data.audio

  const pdfTab = tab === 'kursbuch' ? 'kursbuch' : tab === 'arbeitsbuch' ? 'arbeitsbuch' : null
  const pdfData = pdfTab === 'kursbuch' ? data.kb : data.ab

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.dark }}>
      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} onLoadedMetadata={handleTimeUpdate} />
      
      {/* Sidebar */}
      <aside style={{ width: 260, background: COLORS.darkGray, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 0', borderBottom: `1px solid ${COLORS.mediumGray}` }}>
          <button 
            onClick={goBack}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: '0 24px', fontSize: 14 }}
          >
            <ArrowLeft size={18} />
            <span>Back to Courses</span>
          </button>
        </div>
        
        <div style={{ padding: '24px' }}>
          <h1 style={{ color: COLORS.accent, fontSize: 20, fontWeight: 700 }}>{curso.nombre}</h1>
          <p style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>{curso.nivel}</p>
        </div>
        
        <nav style={{ padding: '0 12px', flex: 1 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 12, 
                width: '100%', padding: '12px 16px', 
                background: tab === t.id ? COLORS.mediumGray : 'transparent',
                border: 'none', borderRadius: 6, cursor: 'pointer',
                color: tab === t.id ? COLORS.accent : COLORS.textMuted,
                fontSize: 14, fontWeight: 500, textAlign: 'left', marginBottom: 4
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        
        <div style={{ padding: 24, borderTop: `1px solid ${COLORS.mediumGray}`, color: COLORS.textMuted, fontSize: 11 }}>
          {curso.descripcion}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 40, background: COLORS.dark, paddingBottom: currentAudio ? 120 : 40 }}>
        {loading ? (
          <div style={{ color: COLORS.textMuted, textAlign: 'center', padding: 60 }}>Loading...</div>
        ) : tab === 'audio' ? (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {data.cds.map(cd => (
                <button 
                  key={cd.label} 
                  onClick={() => setSelectedCd(cd)}
                  style={{ 
                    padding: '8px 16px', borderRadius: 20, border: 'none',
                    background: selectedCd?.label === cd.label ? COLORS.accent : COLORS.mediumGray,
                    color: selectedCd?.label === cd.label ? COLORS.dark : COLORS.text,
                    cursor: 'pointer', fontSize: 13, fontWeight: 500
                  }}
                >
                  {cd.label} ({cd.count})
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {filteredAudio.map((track, i) => (
                <div 
                  key={i} 
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                    background: currentAudio?.file === track.file ? COLORS.mediumGray : COLORS.darkGray,
                    borderRadius: 8, border: `1px solid ${currentAudio?.file === track.file ? COLORS.accent : COLORS.lightGray}`,
                    cursor: 'pointer'
                  }}
                  onClick={() => playTrack(track)}
                >
                  <div style={{ 
                    width: 44, height: 44, borderRadius: '50%', 
                    background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {currentAudio?.file === track.file && isPlaying ? 
                      <Pause size={20} color={COLORS.dark} /> : 
                      <Play size={20} color={COLORS.dark} style={{ marginLeft: 2 }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {track.file}
                    </div>
                    <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>{track.cd}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : tab === 'themenkreise' ? (
          data.tks.length === 0 ? (
            <div style={{ color: COLORS.textMuted, textAlign: 'center', padding: 60 }}>No units available</div>
          ) : (
            <div style={{ display: 'grid', gap: 24 }}>
              {data.tks.map(tk => (
                <div key={tk.id} style={{ background: COLORS.darkGray, borderRadius: 12, padding: 24, border: `1px solid ${COLORS.lightGray}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: COLORS.accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Layers size={18} color={COLORS.accent} />
                    </div>
                    <div>
                      <div style={{ color: COLORS.accent, fontSize: 13, fontWeight: 600 }}>{tk.numero}. {tk.nombre}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: 12 }}>{tk.descripcion}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 8, paddingLeft: 48 }}>
                    {tk.einheiten?.map(unit => (
                      <div key={unit.numero} style={{ 
                        padding: '12px 16px', borderRadius: 8, 
                        background: unit.es_anker ? '#3d3522' : COLORS.mediumGray,
                        border: `1px solid ${unit.es_anker ? '#5a4d22' : COLORS.lightGray}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: COLORS.text, fontWeight: 500 }}>{unit.numero}. {unit.titulo}</span>
                          <span style={{ color: COLORS.textMuted, fontSize: 11, background: COLORS.lightGray, padding: '2px 8px', borderRadius: 4 }}>
                            p. {unit.paginas}
                          </span>
                        </div>
                        <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>{unit.fokus}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'ejercicios' ? (
          <EjerciciosTab cursoId={curso.id} />
        ) : pdfTab && pdfData?.exists ? (
          <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 180px)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <iframe 
                src={'/files/' + pdfData.path.split('Deutsch als Fremdsprache/')[1]} 
                style={{ width: '100%', height: '100%', background: COLORS.white, borderRadius: 12, border: 'none' }} 
              />
            </div>
            {showAudio && (
              <div style={{ width: 340, display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: COLORS.accent, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
                  Audio ({data.audio.length})
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {data.cds.map(cd => (
                    <button 
                      key={cd.label} 
                      onClick={() => setSelectedCd(cd)}
                      style={{ 
                        padding: '6px 12px', borderRadius: 16, border: 'none',
                        background: selectedCd?.label === cd.label ? COLORS.accent : COLORS.mediumGray,
                        color: selectedCd?.label === cd.label ? COLORS.dark : COLORS.text,
                        cursor: 'pointer', fontSize: 12, fontWeight: 500
                      }}
                    >
                      {cd.label}
                    </button>
                  ))}
                </div>
                <div style={{ flex: 1, overflow: 'auto', display: 'grid', gap: 8, alignContent: 'start' }}>
                  {filteredAudio.map((track, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                        background: currentAudio?.file === track.file ? COLORS.mediumGray : COLORS.darkGray,
                        borderRadius: 8, border: `1px solid ${currentAudio?.file === track.file ? COLORS.accent : COLORS.lightGray}`,
                        cursor: 'pointer'
                      }}
                      onClick={() => playTrack(track)}
                    >
                      <div style={{ 
                        width: 36, height: 36, borderRadius: '50%', 
                        background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {currentAudio?.file === track.file && isPlaying ? 
                          <Pause size={16} color={COLORS.dark} /> : 
                          <Play size={16} color={COLORS.dark} style={{ marginLeft: 2 }} />
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ color: COLORS.text, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {track.file}
                        </div>
                        <div style={{ color: COLORS.textMuted, fontSize: 11 }}>{track.cd}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: COLORS.textMuted, textAlign: 'center', padding: 60 }}>Not available</div>
        )}
      </main>

      {/* Audio Player Bar */}
      {currentAudio && (
        <div style={{ 
          position: 'fixed', bottom: 0, left: 260, right: 0, 
          background: COLORS.darkGray, borderTop: `1px solid ${COLORS.accent}`,
          padding: '16px 40px', display: 'flex', alignItems: 'center', gap: 24, zIndex: 100
        }}>
          <button 
            onClick={togglePlay}
            style={{ 
              width: 48, height: 48, borderRadius: '50%', border: 'none',
              background: COLORS.accent, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {isPlaying ? <Pause size={24} color={COLORS.dark} /> : <Play size={24} color={COLORS.dark} style={{ marginLeft: 2 }} />}
          </button>
          
          <div style={{ flex: 1 }}>
            <div style={{ color: COLORS.text, fontSize: 14, fontWeight: 500 }}>{currentAudio.file}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 12 }}>{currentAudio.cd}</div>
            <div 
              style={{ height: 6, background: COLORS.lightGray, borderRadius: 3, marginTop: 12, cursor: 'pointer' }}
              onClick={seek}
            >
              <div style={{ height: '100%', background: COLORS.accent, borderRadius: 3, width: `${(progress / duration) * 100}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: COLORS.textMuted, fontSize: 11, marginTop: 4 }}>
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 4 }}>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
              <button
                key={rate}
                onClick={() => changeSpeed(rate)}
                style={{ 
                  padding: '6px 10px', borderRadius: 4, border: 'none',
                  background: playbackRate === rate ? COLORS.accent : COLORS.mediumGray,
                  color: playbackRate === rate ? COLORS.dark : COLORS.textMuted,
                  cursor: 'pointer', fontSize: 12, fontWeight: 500
                }}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EjerciciosTab({ cursoId }) {
  const [ejercicios, setEjercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [answer, setAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    fetch(API + '/ejercicios/' + cursoId)
      .then(r => r.json())
      .then(data => {
        setEjercicios(data || [])
        setLoading(false)
      })
  }, [cursoId])

  function checkAnswer() {
    if (!selected) return
    const correct = selected.respuesta?.toLowerCase().trim() === answer.toLowerCase().trim()
    setShowAnswer(true)
  }

  if (loading) return <div style={{ color: COLORS.textMuted, textAlign: 'center', padding: 60 }}>Loading exercises...</div>

  if (ejercicios.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ color: COLORS.textMuted, marginBottom: 16 }}>No hay ejercicios disponibles</div>
        <div style={{ color: COLORS.textMuted, fontSize: 12 }}>
          Los ejercicios se están extrayendo de los PDFs... volver más tarde.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <div>
        <h3 style={{ color: COLORS.text, marginBottom: 16 }}>Ejercicios ({ejercicios.length})</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {ejercicios.map((e, i) => (
            <div 
              key={i}
              onClick={() => { setSelected(e); setAnswer(''); setShowAnswer(false) }}
              style={{ 
                padding: 12, borderRadius: 8, cursor: 'pointer',
                background: selected === e ? COLORS.mediumGray : COLORS.darkGray,
                border: `1px solid ${selected === e ? COLORS.accent : COLORS.lightGray}`,
                color: COLORS.text
              }}
            >
              <div style={{ fontSize: 11, color: COLORS.accent }}>Übung {e.numero}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{e.pregunta?.substring(0, 100)}...</div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        {selected ? (
          <div style={{ padding: 24, background: COLORS.darkGray, borderRadius: 12, border: `1px solid ${COLORS.lightGray}` }}>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>Übung {selected.numero}</div>
            <div style={{ color: COLORS.text, fontSize: 16, marginBottom: 24 }}>{selected.pregunta}</div>
            
            <input 
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Tu respuesta..."
              disabled={showAnswer}
              style={{ 
                width: '100%', padding: '12px 16px', borderRadius: 8, border: 'none',
                background: COLORS.mediumGray, color: COLORS.text, fontSize: 14,
                marginBottom: 16
              }}
            />
            
            <button 
              onClick={checkAnswer}
              disabled={showAnswer}
              style={{ 
                padding: '12px 24px', borderRadius: 8, border: 'none',
                background: showAnswer ? (selected.respuesta?.toLowerCase().trim() === answer.toLowerCase().trim() ? COLORS.accent : '#ff4444') : COLORS.accent,
                color: COLORS.dark, fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}
            >
              {showAnswer ? (selected.respuesta?.toLowerCase().trim() === answer.toLowerCase().trim() ? '✓ Correcto!' : '✗ Falso') : 'Verificar'}
            </button>
            
            {showAnswer && (
              <div style={{ marginTop: 24, padding: 16, background: '#1a3d1a', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Respuesta correcta:</div>
                <div style={{ color: COLORS.accent, fontSize: 16, marginTop: 4 }}>{selected.respuesta}</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: COLORS.textMuted, textAlign: 'center', padding: 60 }}>
            Selecciona un ejercicio de la izquierda
          </div>
        )}
      </div>
    </div>
  )
}

export default App
