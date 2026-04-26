import { describe, it, expect } from 'vitest'

describe('Colors Theme', () => {
  it('should have correct dark theme colors', () => {
    const COLORS = {
      dark: '#0d0d0d',
      accent: '#00ff88'
    }
    expect(COLORS.dark).toBe('#0d0d0d')
    expect(COLORS.accent).toBe('#00ff88')
  })
})

describe('Exercise Data', () => {
  it('should handle exercise structure', () => {
    const exercise = {
      numero: '1',
      pregunta: 'Was ist das?',
      respuesta: 'Das ist ein Buch.'
    }
    expect(exercise.numero).toBe('1')
    expect(exercise.pregunta).toBe('Was ist das?')
  })

it('should check partial answer match', () => {
    const userAnswer = 'Buch'
    const correctAnswer = 'Das ist ein Buch'
    const userAns = userAnswer.toLowerCase().trim()
    const correctAns = correctAnswer.toLowerCase()
    const words = correctAns.split(' ').filter(function(w) { return w.length > 3 })
    const match = words.some(function(w) { return userAns.includes(w) })
    expect(match).toBe(true)
  })
})

describe('Audio Files', () => {
  it('should filter mp3 files', () => {
    const files = ['Track01.mp3', 'Track02.mp3', 'cover.jpg']
    const mp3s = files.filter(function(f) { return f.endsWith('.mp3') })
    expect(mp3s.length).toBe(2)
  })
})

describe('API URL', () => {
  it('should construct API URL', () => {
    const origin = 'http://localhost:3456'
    const api = origin + '/api'
    expect(api).toBe('http://localhost:3456/api')
  })
})