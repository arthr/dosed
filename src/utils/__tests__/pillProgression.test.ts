import { describe, it, expect } from 'vitest'
import {
  lerp,
  getPillChances,
  rollPillType,
  getPillCount,
  PROGRESSION,
  POOL_SCALING,
  type ProgressionConfig,
  type PoolScalingConfig,
} from '../pillProgression'
import {
  generatePillPool,
  countPillTypes,
} from '../pillGenerator'

// ============================================
// Testes de lerp()
// ============================================

describe('lerp', () => {
  it('retorna start quando t = 0', () => {
    expect(lerp(10, 20, 0)).toBe(10)
  })

  it('retorna end quando t = 1', () => {
    expect(lerp(10, 20, 1)).toBe(20)
  })

  it('retorna valor intermediario quando t = 0.5', () => {
    expect(lerp(10, 20, 0.5)).toBe(15)
  })

  it('funciona com valores negativos', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0)
  })
})

// ============================================
// Testes de getPillChances() - Progressao de Tipos
// ============================================

describe('getPillChances', () => {
  it('retorna apenas tipos desbloqueados na rodada 1', () => {
    const chances = getPillChances(1)
    
    // Desbloqueados na rodada 1: SAFE, DMG_LOW, DMG_HIGH
    expect(chances.SAFE).toBeGreaterThan(0)
    expect(chances.DMG_LOW).toBeGreaterThan(0)
    expect(chances.DMG_HIGH).toBeGreaterThan(0)
    
    // Nao desbloqueados: HEAL (rodada 2), FATAL (rodada 4), LIFE (rodada 99)
    expect(chances.HEAL).toBe(0)
    expect(chances.FATAL).toBe(0)
    expect(chances.LIFE).toBe(0)
  })

  it('HEAL aparece a partir da rodada 2', () => {
    expect(getPillChances(1).HEAL).toBe(0)
    expect(getPillChances(2).HEAL).toBeGreaterThan(0)
  })

  it('FATAL aparece a partir da rodada 4', () => {
    expect(getPillChances(3).FATAL).toBe(0)
    expect(getPillChances(4).FATAL).toBeGreaterThan(0)
  })

  it('LIFE desativado por padrao (unlockRound: 99)', () => {
    // LIFE nao aparece em nenhuma rodada razoavel
    for (let round = 1; round <= 50; round++) {
      expect(getPillChances(round).LIFE).toBe(0)
    }
  })

  it('soma das probabilidades e sempre ~100%', () => {
    for (let round = 1; round <= 20; round++) {
      const chances = getPillChances(round)
      const sum = Object.values(chances).reduce((a, b) => a + b, 0)
      // Tolerancia de 0.1% devido a arredondamentos
      expect(sum).toBeCloseTo(100, 0)
    }
  })

  it('probabilidade de SAFE diminui ao longo das rodadas', () => {
    const chancesRound1 = getPillChances(1)
    const chancesRound10 = getPillChances(10)
    const chancesRound15 = getPillChances(15)
    
    expect(chancesRound1.SAFE).toBeGreaterThan(chancesRound10.SAFE)
    expect(chancesRound10.SAFE).toBeGreaterThan(chancesRound15.SAFE)
  })

  it('probabilidade de DMG_HIGH aumenta ao longo das rodadas', () => {
    const chancesRound1 = getPillChances(1)
    const chancesRound10 = getPillChances(10)
    
    expect(chancesRound10.DMG_HIGH).toBeGreaterThan(chancesRound1.DMG_HIGH)
  })

  it('clampeia rodada para minimo 1', () => {
    const chancesNegative = getPillChances(-5)
    const chancesZero = getPillChances(0)
    const chancesOne = getPillChances(1)
    
    // Todas devem ser iguais (tratadas como rodada 1)
    expect(chancesNegative).toEqual(chancesOne)
    expect(chancesZero).toEqual(chancesOne)
  })

  it('clampeia rodada para maxRound', () => {
    const chancesAt15 = getPillChances(15)
    const chancesAt100 = getPillChances(100)
    
    // Ambas devem ser iguais (maxRound = 15)
    expect(chancesAt100).toEqual(chancesAt15)
  })

  it('aceita config customizada', () => {
    const customConfig: ProgressionConfig = {
      maxRound: 5,
      rules: {
        SAFE: { unlockRound: 1, startPct: 100, endPct: 0 },
        DMG_LOW: { unlockRound: 1, startPct: 0, endPct: 100 },
        DMG_HIGH: { unlockRound: 99, startPct: 0, endPct: 0 },
        FATAL: { unlockRound: 99, startPct: 0, endPct: 0 },
        HEAL: { unlockRound: 99, startPct: 0, endPct: 0 },
        LIFE: { unlockRound: 99, startPct: 0, endPct: 0 },
      },
    }
    
    const chancesRound1 = getPillChances(1, customConfig)
    expect(chancesRound1.SAFE).toBe(100)
    expect(chancesRound1.DMG_LOW).toBe(0)
    
    const chancesRound5 = getPillChances(5, customConfig)
    expect(chancesRound5.SAFE).toBe(0)
    expect(chancesRound5.DMG_LOW).toBe(100)
  })
})

// ============================================
// Testes de rollPillType()
// ============================================

describe('rollPillType', () => {
  it('nunca retorna tipo bloqueado na rodada 1', () => {
    // Roda 100 vezes para ter confianca estatistica
    for (let i = 0; i < 100; i++) {
      const type = rollPillType(1)
      expect(['SAFE', 'DMG_LOW', 'DMG_HIGH']).toContain(type)
      expect(['HEAL', 'FATAL', 'LIFE']).not.toContain(type)
    }
  })

  it('nunca retorna LIFE (desativado por padrao)', () => {
    for (let round = 1; round <= 20; round++) {
      for (let i = 0; i < 50; i++) {
        const type = rollPillType(round)
        expect(type).not.toBe('LIFE')
      }
    }
  })

  it('pode retornar HEAL a partir da rodada 2', () => {
    // Roda varias vezes ate encontrar HEAL
    let foundHeal = false
    for (let i = 0; i < 500; i++) {
      if (rollPillType(2) === 'HEAL') {
        foundHeal = true
        break
      }
    }
    expect(foundHeal).toBe(true)
  })

  it('pode retornar FATAL a partir da rodada 4', () => {
    let foundFatal = false
    for (let i = 0; i < 500; i++) {
      if (rollPillType(4) === 'FATAL') {
        foundFatal = true
        break
      }
    }
    expect(foundFatal).toBe(true)
  })

  it('retorna fallback SAFE se algo der errado', () => {
    // Config com todos os tipos desativados
    const emptyConfig: ProgressionConfig = {
      maxRound: 1,
      rules: {
        SAFE: { unlockRound: 99, startPct: 0, endPct: 0 },
        DMG_LOW: { unlockRound: 99, startPct: 0, endPct: 0 },
        DMG_HIGH: { unlockRound: 99, startPct: 0, endPct: 0 },
        FATAL: { unlockRound: 99, startPct: 0, endPct: 0 },
        HEAL: { unlockRound: 99, startPct: 0, endPct: 0 },
        LIFE: { unlockRound: 99, startPct: 0, endPct: 0 },
      },
    }
    
    // Deve retornar SAFE como fallback
    const type = rollPillType(1, emptyConfig)
    expect(type).toBe('SAFE')
  })
})

// ============================================
// Testes de getPillCount() - Pool Scaling
// ============================================

describe('getPillCount', () => {
  it('retorna baseCount na rodada 1', () => {
    expect(getPillCount(1)).toBe(6)
  })

  it('mantem valor dentro do ciclo (rodadas 1-3 = 6)', () => {
    expect(getPillCount(1)).toBe(6)
    expect(getPillCount(2)).toBe(6)
    expect(getPillCount(3)).toBe(6)
  })

  it('aumenta apos completar ciclo (rodada 4 = 7)', () => {
    expect(getPillCount(4)).toBe(7)
    expect(getPillCount(5)).toBe(7)
    expect(getPillCount(6)).toBe(7)
  })

  it('continua aumentando a cada ciclo', () => {
    expect(getPillCount(7)).toBe(8)
    expect(getPillCount(10)).toBe(9)
    expect(getPillCount(13)).toBe(10)
    expect(getPillCount(16)).toBe(11)
  })

  it('respeita maxCap (12)', () => {
    expect(getPillCount(19)).toBe(12)
    expect(getPillCount(50)).toBe(12)
    expect(getPillCount(100)).toBe(12)
  })

  it('clampeia rodada para minimo 1', () => {
    expect(getPillCount(0)).toBe(6)
    expect(getPillCount(-5)).toBe(6)
  })

  it('funciona com config customizada', () => {
    const customConfig: PoolScalingConfig = {
      baseCount: 3,
      increaseBy: 2,
      frequency: 2,
      maxCap: 10,
    }
    
    expect(getPillCount(1, customConfig)).toBe(3)
    expect(getPillCount(2, customConfig)).toBe(3)
    expect(getPillCount(3, customConfig)).toBe(5) // 3 + 1*2
    expect(getPillCount(5, customConfig)).toBe(7) // 3 + 2*2
    expect(getPillCount(100, customConfig)).toBe(10) // cap
  })

  it('funciona sem maxCap definido', () => {
    const noCapConfig: PoolScalingConfig = {
      baseCount: 5,
      increaseBy: 1,
      frequency: 3,
    }
    
    // Sem cap, deve continuar crescendo
    expect(getPillCount(1, noCapConfig)).toBe(5)
    expect(getPillCount(100, noCapConfig)).toBe(38) // 5 + 33*1
  })
})

// ============================================
// Testes de configuracao PROGRESSION
// ============================================

describe('PROGRESSION config', () => {
  it('tem maxRound definido', () => {
    expect(PROGRESSION.maxRound).toBe(15)
  })

  it('LIFE esta desativado por padrao', () => {
    expect(PROGRESSION.rules.LIFE.unlockRound).toBe(99)
    expect(PROGRESSION.rules.LIFE.startPct).toBe(0)
    expect(PROGRESSION.rules.LIFE.endPct).toBe(0)
  })

  it('SAFE, DMG_LOW, DMG_HIGH desbloqueiam na rodada 1', () => {
    expect(PROGRESSION.rules.SAFE.unlockRound).toBe(1)
    expect(PROGRESSION.rules.DMG_LOW.unlockRound).toBe(1)
    expect(PROGRESSION.rules.DMG_HIGH.unlockRound).toBe(1)
  })

  it('HEAL desbloqueia antes de FATAL', () => {
    expect(PROGRESSION.rules.HEAL.unlockRound).toBeLessThan(
      PROGRESSION.rules.FATAL.unlockRound
    )
  })
})

// ============================================
// Testes de configuracao POOL_SCALING
// ============================================

describe('POOL_SCALING config', () => {
  it('tem valores padrao corretos', () => {
    expect(POOL_SCALING.baseCount).toBe(6)
    expect(POOL_SCALING.increaseBy).toBe(1)
    expect(POOL_SCALING.frequency).toBe(3)
    expect(POOL_SCALING.maxCap).toBe(12)
  })

  it('e retrocompativel (comeca com 6)', () => {
    expect(POOL_SCALING.baseCount).toBe(6)
  })
})

// ============================================
// Testes de Integracao - generatePillPool
// ============================================

describe('generatePillPool - Integracao', () => {
  // TASK-PP-042: Verificar geracao de pilulas na rodada 1
  describe('rodada 1', () => {
    it('gera exatamente 6 pilulas', () => {
      const pills = generatePillPool(1)
      expect(pills).toHaveLength(6)
    })

    it('nao contem FATAL (desbloqueia rodada 4)', () => {
      // Roda 50 vezes para ter confianca estatistica
      for (let i = 0; i < 50; i++) {
        const pills = generatePillPool(1)
        const counts = countPillTypes(pills)
        expect(counts.FATAL).toBe(0)
      }
    })

    it('nao contem HEAL (desbloqueia rodada 2)', () => {
      for (let i = 0; i < 50; i++) {
        const pills = generatePillPool(1)
        const counts = countPillTypes(pills)
        expect(counts.HEAL).toBe(0)
      }
    })

    it('nao contem LIFE (desativado)', () => {
      for (let i = 0; i < 50; i++) {
        const pills = generatePillPool(1)
        const counts = countPillTypes(pills)
        expect(counts.LIFE).toBe(0)
      }
    })

    it('contem apenas SAFE, DMG_LOW e DMG_HIGH', () => {
      for (let i = 0; i < 50; i++) {
        const pills = generatePillPool(1)
        for (const pill of pills) {
          expect(['SAFE', 'DMG_LOW', 'DMG_HIGH']).toContain(pill.type)
        }
      }
    })
  })

  // TASK-PP-043: Verificar geracao de pilulas na rodada 4
  describe('rodada 4', () => {
    it('gera exatamente 7 pilulas', () => {
      const pills = generatePillPool(4)
      expect(pills).toHaveLength(7)
    })

    it('pode conter FATAL (desbloqueia rodada 4)', () => {
      // Roda varias vezes ate encontrar FATAL
      let foundFatal = false
      for (let i = 0; i < 200; i++) {
        const pills = generatePillPool(4)
        const counts = countPillTypes(pills)
        if (counts.FATAL > 0) {
          foundFatal = true
          break
        }
      }
      expect(foundFatal).toBe(true)
    })

    it('pode conter HEAL (desbloqueia rodada 2)', () => {
      let foundHeal = false
      for (let i = 0; i < 200; i++) {
        const pills = generatePillPool(4)
        const counts = countPillTypes(pills)
        if (counts.HEAL > 0) {
          foundHeal = true
          break
        }
      }
      expect(foundHeal).toBe(true)
    })

    it('nao contem LIFE (desativado)', () => {
      for (let i = 0; i < 50; i++) {
        const pills = generatePillPool(4)
        const counts = countPillTypes(pills)
        expect(counts.LIFE).toBe(0)
      }
    })
  })

  // TASK-PP-066: Verificar quantidade de pilulas aumenta entre rodadas
  describe('escalonamento de quantidade', () => {
    it('quantidade aumenta conforme a rodada', () => {
      expect(generatePillPool(1)).toHaveLength(6)
      expect(generatePillPool(2)).toHaveLength(6)
      expect(generatePillPool(3)).toHaveLength(6)
      expect(generatePillPool(4)).toHaveLength(7)
      expect(generatePillPool(7)).toHaveLength(8)
      expect(generatePillPool(10)).toHaveLength(9)
      expect(generatePillPool(13)).toHaveLength(10)
      expect(generatePillPool(16)).toHaveLength(11)
      expect(generatePillPool(19)).toHaveLength(12)
    })

    it('respeita cap de 12 pilulas', () => {
      expect(generatePillPool(50)).toHaveLength(12)
      expect(generatePillPool(100)).toHaveLength(12)
    })
  })

  // Testes de propriedades das pilulas geradas
  describe('propriedades das pilulas', () => {
    it('todas pilulas comecam com isRevealed = false', () => {
      const pills = generatePillPool(5)
      for (const pill of pills) {
        expect(pill.isRevealed).toBe(false)
      }
    })

    it('todas pilulas tem id unico', () => {
      const pills = generatePillPool(10)
      const ids = pills.map(p => p.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(pills.length)
    })

    it('todas pilulas tem stats definidos', () => {
      const pills = generatePillPool(5)
      for (const pill of pills) {
        expect(pill.stats).toBeDefined()
        expect(typeof pill.stats.damage).toBe('number')
        expect(typeof pill.stats.heal).toBe('number')
        expect(typeof pill.stats.isFatal).toBe('boolean')
        expect(typeof pill.stats.livesRestore).toBe('number')
      }
    })
  })
})
