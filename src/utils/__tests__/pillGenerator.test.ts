import { describe, it, expect } from 'vitest'
import {
  createPill,
  createPillWithShape,
  countPillTypes,
  revealPill,
  generatePillPoolWithCount,
} from '../pillGenerator'
import { PILL_HEX_COLORS, HIDDEN_PILL_HEX } from '../constants'
import type { Pill, PillType, PillShape } from '@/types'

// ============================================
// Testes de createPillWithShape()
// ============================================

describe('createPillWithShape', () => {
  it('cria pilula com tipo e shape especificados', () => {
    const pill = createPillWithShape('SAFE', 'flower')

    expect(pill.type).toBe('SAFE')
    expect(pill.visuals.shape).toBe('flower')
  })

  it('gera id unico para cada pilula', () => {
    const pill1 = createPillWithShape('SAFE', 'round')
    const pill2 = createPillWithShape('SAFE', 'round')

    expect(pill1.id).toBeDefined()
    expect(pill2.id).toBeDefined()
    expect(pill1.id).not.toBe(pill2.id)
  })

  it('pilula inicia com isRevealed = false', () => {
    const pill = createPillWithShape('DMG_LOW', 'skull')

    expect(pill.isRevealed).toBe(false)
  })

  it('pilula inicia com cor escondida', () => {
    const pill = createPillWithShape('FATAL', 'heart')

    expect(pill.visuals.color).toBe(HIDDEN_PILL_HEX)
  })

  it('pilula inicia com label ???', () => {
    const pill = createPillWithShape('HEAL', 'star')

    expect(pill.visuals.label).toBe('???')
  })

  describe('stats por tipo', () => {
    it('SAFE tem damage 0, heal 0, isFatal false', () => {
      const pill = createPillWithShape('SAFE', 'round')

      expect(pill.stats.damage).toBe(0)
      expect(pill.stats.heal).toBe(0)
      expect(pill.stats.isFatal).toBe(false)
      expect(pill.stats.livesRestore).toBe(0)
    })

    it('DMG_LOW tem damage 1-2, heal 0, isFatal false', () => {
      // Roda varias vezes para capturar range
      const damages = new Set<number>()
      for (let i = 0; i < 50; i++) {
        const pill = createPillWithShape('DMG_LOW', 'round')
        damages.add(pill.stats.damage)
        expect(pill.stats.heal).toBe(0)
        expect(pill.stats.isFatal).toBe(false)
      }

      // Verifica se encontrou valores no range [1, 2]
      expect(damages.has(1) || damages.has(2)).toBe(true)
      for (const d of damages) {
        expect(d).toBeGreaterThanOrEqual(1)
        expect(d).toBeLessThanOrEqual(2)
      }
    })

    it('DMG_HIGH tem damage 3-4, heal 0, isFatal false', () => {
      const damages = new Set<number>()
      for (let i = 0; i < 50; i++) {
        const pill = createPillWithShape('DMG_HIGH', 'round')
        damages.add(pill.stats.damage)
        expect(pill.stats.heal).toBe(0)
        expect(pill.stats.isFatal).toBe(false)
      }

      for (const d of damages) {
        expect(d).toBeGreaterThanOrEqual(3)
        expect(d).toBeLessThanOrEqual(4)
      }
    })

    it('FATAL tem isFatal true e damage alto', () => {
      const pill = createPillWithShape('FATAL', 'round')

      expect(pill.stats.isFatal).toBe(true)
      expect(pill.stats.damage).toBe(999) // FATAL_DAMAGE
      expect(pill.stats.heal).toBe(0)
    })

    it('HEAL tem heal > 0 e damage 0', () => {
      const pill = createPillWithShape('HEAL', 'round')

      expect(pill.stats.heal).toBeGreaterThan(0)
      expect(pill.stats.damage).toBe(0)
      expect(pill.stats.isFatal).toBe(false)
    })

    it('LIFE tem livesRestore 1', () => {
      const pill = createPillWithShape('LIFE', 'round')

      expect(pill.stats.livesRestore).toBe(1)
      expect(pill.stats.damage).toBe(0)
      expect(pill.stats.heal).toBe(0)
      expect(pill.stats.isFatal).toBe(false)
    })
  })
})

// ============================================
// Testes de createPill() (deprecated)
// ============================================

describe('createPill (deprecated)', () => {
  it('cria pilula com shape round por padrao', () => {
    const pill = createPill('SAFE')

    expect(pill.visuals.shape).toBe('round')
  })

  it('funciona como wrapper para createPillWithShape', () => {
    const pill = createPill('DMG_LOW')

    expect(pill.type).toBe('DMG_LOW')
    expect(pill.isRevealed).toBe(false)
  })
})

// ============================================
// Testes de countPillTypes()
// ============================================

describe('countPillTypes', () => {
  it('conta corretamente pilulas por tipo', () => {
    const pills: Pill[] = [
      createPillWithShape('SAFE', 'round'),
      createPillWithShape('SAFE', 'flower'),
      createPillWithShape('DMG_LOW', 'skull'),
      createPillWithShape('FATAL', 'heart'),
    ]

    const counts = countPillTypes(pills)

    expect(counts.SAFE).toBe(2)
    expect(counts.DMG_LOW).toBe(1)
    expect(counts.DMG_HIGH).toBe(0)
    expect(counts.FATAL).toBe(1)
    expect(counts.HEAL).toBe(0)
    expect(counts.LIFE).toBe(0)
  })

  it('retorna zeros para pool vazio', () => {
    const counts = countPillTypes([])

    expect(counts.SAFE).toBe(0)
    expect(counts.DMG_LOW).toBe(0)
    expect(counts.DMG_HIGH).toBe(0)
    expect(counts.FATAL).toBe(0)
    expect(counts.HEAL).toBe(0)
    expect(counts.LIFE).toBe(0)
  })

  it('conta todos os 6 tipos corretamente', () => {
    const pills: Pill[] = [
      createPillWithShape('SAFE', 'round'),
      createPillWithShape('DMG_LOW', 'round'),
      createPillWithShape('DMG_HIGH', 'round'),
      createPillWithShape('FATAL', 'round'),
      createPillWithShape('HEAL', 'round'),
      createPillWithShape('LIFE', 'round'),
    ]

    const counts = countPillTypes(pills)

    expect(counts.SAFE).toBe(1)
    expect(counts.DMG_LOW).toBe(1)
    expect(counts.DMG_HIGH).toBe(1)
    expect(counts.FATAL).toBe(1)
    expect(counts.HEAL).toBe(1)
    expect(counts.LIFE).toBe(1)
  })
})

// ============================================
// Testes de revealPill()
// ============================================

describe('revealPill', () => {
  it('marca pilula como revelada', () => {
    const pill = createPillWithShape('SAFE', 'round')
    const revealed = revealPill(pill)

    expect(revealed.isRevealed).toBe(true)
  })

  it('atualiza cor para cor real do tipo', () => {
    const pillTypes: PillType[] = ['SAFE', 'DMG_LOW', 'DMG_HIGH', 'FATAL', 'HEAL', 'LIFE']

    for (const type of pillTypes) {
      const pill = createPillWithShape(type, 'round')
      const revealed = revealPill(pill)

      expect(revealed.visuals.color).toBe(PILL_HEX_COLORS[type])
    }
  })

  it('atualiza label para o tipo', () => {
    const pill = createPillWithShape('FATAL', 'skull')
    const revealed = revealPill(pill)

    expect(revealed.visuals.label).toBe('FATAL')
  })

  it('mantem shape original', () => {
    const pill = createPillWithShape('HEAL', 'flower')
    const revealed = revealPill(pill)

    expect(revealed.visuals.shape).toBe('flower')
  })

  it('retorna mesma pilula se ja revelada (imutabilidade)', () => {
    const pill = createPillWithShape('SAFE', 'round')
    const revealed1 = revealPill(pill)
    const revealed2 = revealPill(revealed1)

    expect(revealed2).toBe(revealed1)
  })

  it('nao modifica pilula original (imutabilidade)', () => {
    const pill = createPillWithShape('DMG_LOW', 'heart')
    const revealed = revealPill(pill)

    expect(pill.isRevealed).toBe(false)
    expect(pill.visuals.color).toBe(HIDDEN_PILL_HEX)
    expect(revealed.isRevealed).toBe(true)
  })
})

// ============================================
// Testes de generatePillPoolWithCount()
// ============================================

describe('generatePillPoolWithCount', () => {
  it('gera quantidade especificada de pilulas', () => {
    const pills = generatePillPoolWithCount(10, 1)

    expect(pills).toHaveLength(10)
  })

  it('respeita regras de desbloqueio da rodada', () => {
    const pills = generatePillPoolWithCount(6, 1)
    const counts = countPillTypes(pills)

    // Rodada 1: apenas SAFE, DMG_LOW, DMG_HIGH
    expect(counts.HEAL).toBe(0)
    expect(counts.FATAL).toBe(0)
    expect(counts.LIFE).toBe(0)
  })

  it('pode gerar FATAL na rodada 4+', () => {
    // Com 15 pilulas na rodada 10, FATAL deve aparecer
    const pills = generatePillPoolWithCount(15, 10)
    const counts = countPillTypes(pills)

    expect(counts.FATAL).toBeGreaterThanOrEqual(1)
  })

  it('atribui shapes aleatorias', () => {
    const pills = generatePillPoolWithCount(12, 8)
    const shapes = new Set(pills.map((p) => p.visuals.shape))

    // Com 12 pilulas na rodada 8, deve ter varias shapes
    expect(shapes.size).toBeGreaterThan(1)
  })

  it('embaralha resultado', () => {
    // Dificil testar aleatoriedade, mas podemos verificar que
    // tipos nao estao agrupados
    const pills = generatePillPoolWithCount(12, 5)
    const types = pills.map((p) => p.type)

    // Verifica que nao esta ordenado por tipo
    const sortedTypes = [...types].sort()
    expect(types).not.toEqual(sortedTypes)
  })
})

