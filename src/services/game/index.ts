/**
 * Game Services
 *
 * Servicos relacionados a logica de jogo:
 * - pillService   - Geracao e manipulacao de pilulas
 * - questService  - Geracao e validacao de quests
 *
 * Por enquanto, apenas re-exporta das utils existentes.
 * Na Fase 2+, podemos migrar logica complexa para ca.
 *
 * @see ADR-001-store-decomposition.md
 */

// TODO: Avaliar se vale migrar logica de utils para services
// Por ora, utils/pillGenerator.ts e utils/questGenerator.ts atendem bem

// Re-export de funcoes utilitarias relevantes
export {
  generatePillPool,
  countPillTypes,
  revealPill,
} from '@/utils/pillGenerator'

export {
  generateShapeQuest,
  checkQuestProgress,
} from '@/utils/questGenerator'

