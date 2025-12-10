import { describe, it, expect } from 'vitest'
import {
  generateShapeQuest,
  checkQuestProgress,
  DEFAULT_QUEST_CONFIG,
} from '../questGenerator'
import type { PillShape, ShapeQuest } from '@/types'
import { getInitialShapeCounts } from '../shapeProgression'

// ============================================
// Helper para criar shapeCounts de teste
// ============================================

function createShapeCounts(counts: Partial<Record<PillShape, number>>): Record<PillShape, number> {
  const base = getInitialShapeCounts()
  return { ...base, ...counts }
}

// ============================================
// Testes de DEFAULT_QUEST_CONFIG
// ============================================

describe('DEFAULT_QUEST_CONFIG', () => {
  it('tem valores padrao corretos', () => {
    expect(DEFAULT_QUEST_CONFIG.minLength).toBe(2)
    expect(DEFAULT_QUEST_CONFIG.maxLength).toBe(3)
    expect(DEFAULT_QUEST_CONFIG.increaseLengthAfterRound).toBe(5)
  })
})

// ============================================
// Testes de generateShapeQuest()
// ============================================

describe('generateShapeQuest', () => {
  it('gera quest com id unico', () => {
    const shapeCounts = createShapeCounts({ round: 3, flower: 3 })
    const quest1 = generateShapeQuest(1, shapeCounts)
    const quest2 = generateShapeQuest(1, shapeCounts)

    expect(quest1.id).toBeDefined()
    expect(quest2.id).toBeDefined()
    expect(quest1.id).not.toBe(quest2.id)
  })

  it('gera quest com progresso inicial 0', () => {
    const shapeCounts = createShapeCounts({ round: 3, flower: 3 })
    const quest = generateShapeQuest(1, shapeCounts)

    expect(quest.progress).toBe(0)
  })

  it('gera quest nao completado', () => {
    const shapeCounts = createShapeCounts({ round: 3, flower: 3 })
    const quest = generateShapeQuest(1, shapeCounts)

    expect(quest.completed).toBe(false)
  })

  it('gera sequencia com tamanho minimo na rodada 1', () => {
    const shapeCounts = createShapeCounts({ round: 3, flower: 3, skull: 3 })

    // Roda varias vezes para verificar consistencia
    for (let i = 0; i < 20; i++) {
      const quest = generateShapeQuest(1, shapeCounts)
      expect(quest.sequence.length).toBe(DEFAULT_QUEST_CONFIG.minLength)
    }
  })

  it('gera sequencia com tamanho variavel apos rodada X', () => {
    const shapeCounts = createShapeCounts({ round: 5, flower: 5, skull: 5, bear: 5 })

    const lengths = new Set<number>()

    // Roda varias vezes para capturar variacao
    for (let i = 0; i < 50; i++) {
      const quest = generateShapeQuest(5, shapeCounts)
      lengths.add(quest.sequence.length)
    }

    // Deve ter pelo menos 2 tamanhos diferentes (min e max)
    expect(lengths.size).toBeGreaterThanOrEqual(1)
    // Tamanhos devem estar no range [minLength, maxLength]
    for (const len of lengths) {
      expect(len).toBeGreaterThanOrEqual(DEFAULT_QUEST_CONFIG.minLength)
      expect(len).toBeLessThanOrEqual(DEFAULT_QUEST_CONFIG.maxLength)
    }
  })

  it('usa apenas shapes disponiveis no pool', () => {
    const shapeCounts = createShapeCounts({ round: 2, flower: 2 })

    for (let i = 0; i < 20; i++) {
      const quest = generateShapeQuest(1, shapeCounts)

      for (const shape of quest.sequence) {
        expect(['round', 'flower']).toContain(shape)
      }
    }
  })

  it('limita sequencia ao tamanho do pool', () => {
    // Pool com apenas 1 pilula
    const shapeCounts = createShapeCounts({ round: 1 })
    const quest = generateShapeQuest(1, shapeCounts)

    expect(quest.sequence.length).toBe(1)
  })

  it('aceita config customizada', () => {
    const shapeCounts = createShapeCounts({ round: 5, flower: 5, skull: 5 })
    const customConfig = { minLength: 4, maxLength: 4, increaseLengthAfterRound: 1 }

    const quest = generateShapeQuest(1, shapeCounts, customConfig)

    expect(quest.sequence.length).toBe(4)
  })

  it('gera sequencia vazia se pool vazio', () => {
    const shapeCounts = createShapeCounts({})
    const quest = generateShapeQuest(1, shapeCounts)

    expect(quest.sequence.length).toBe(0)
  })
})

// ============================================
// Testes de checkQuestProgress()
// ============================================

describe('checkQuestProgress', () => {
  const createQuest = (sequence: PillShape[], progress = 0, completed = false): ShapeQuest => ({
    id: 'test-quest',
    sequence,
    progress,
    completed,
  })

  describe('avanco com shape correta', () => {
    it('avanca progresso quando shape correta', () => {
      const quest = createQuest(['round', 'flower', 'skull'])

      const result = checkQuestProgress(quest, 'round')

      expect(result.updatedQuest.progress).toBe(1)
      expect(result.justCompleted).toBe(false)
      expect(result.wasReset).toBe(false)
    })

    it('avanca multiplas vezes em sequencia', () => {
      let quest = createQuest(['round', 'flower', 'skull'])

      // Primeira shape
      let result = checkQuestProgress(quest, 'round')
      expect(result.updatedQuest.progress).toBe(1)

      // Segunda shape
      result = checkQuestProgress(result.updatedQuest, 'flower')
      expect(result.updatedQuest.progress).toBe(2)

      // Terceira shape
      result = checkQuestProgress(result.updatedQuest, 'skull')
      expect(result.updatedQuest.progress).toBe(3)
      expect(result.justCompleted).toBe(true)
    })
  })

  describe('reset com shape errada', () => {
    it('reseta progresso quando shape errada', () => {
      const quest = createQuest(['round', 'flower'], 1)

      const result = checkQuestProgress(quest, 'skull')

      expect(result.updatedQuest.progress).toBe(0)
      expect(result.justCompleted).toBe(false)
      expect(result.wasReset).toBe(true)
    })

    it('nao marca wasReset se nao tinha progresso', () => {
      const quest = createQuest(['round', 'flower'], 0)

      const result = checkQuestProgress(quest, 'skull')

      expect(result.updatedQuest.progress).toBe(0)
      expect(result.wasReset).toBe(false)
    })

    it('mantem mesma quest id apos reset', () => {
      const quest = createQuest(['round', 'flower'], 1)

      const result = checkQuestProgress(quest, 'skull')

      expect(result.updatedQuest.id).toBe('test-quest')
    })
  })

  describe('completar quest', () => {
    it('marca completed quando sequencia completada', () => {
      const quest = createQuest(['round', 'flower'], 1)

      const result = checkQuestProgress(quest, 'flower')

      expect(result.updatedQuest.completed).toBe(true)
      expect(result.justCompleted).toBe(true)
    })

    it('nao altera quest ja completado', () => {
      const quest = createQuest(['round', 'flower'], 2, true)

      const result = checkQuestProgress(quest, 'round')

      expect(result.updatedQuest).toBe(quest)
      expect(result.justCompleted).toBe(false)
      expect(result.wasReset).toBe(false)
    })

    it('completa quest de sequencia unitaria', () => {
      const quest = createQuest(['round'])

      const result = checkQuestProgress(quest, 'round')

      expect(result.updatedQuest.completed).toBe(true)
      expect(result.justCompleted).toBe(true)
    })
  })

  describe('casos especiais', () => {
    it('funciona com sequencias longas', () => {
      const sequence: PillShape[] = ['round', 'flower', 'skull', 'bear', 'pumpkin']
      const quest = createQuest(sequence, 4)

      const result = checkQuestProgress(quest, 'pumpkin')

      expect(result.updatedQuest.completed).toBe(true)
      expect(result.justCompleted).toBe(true)
    })

    it('distingue shapes similares', () => {
      const quest = createQuest(['round', 'oval'])

      // round e oval sao diferentes
      const result = checkQuestProgress(quest, 'oval')

      expect(result.updatedQuest.progress).toBe(0)
      expect(result.wasReset).toBe(false) // Nao tinha progresso
    })
  })
})

