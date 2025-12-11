// Pill types
export type { Pill, PillConfig, PillShape, PillStats, PillType, PillVisuals } from './pill'

// Player types
export type {
  Player,
  PlayerConfig,
  PlayerEffect,
  PlayerEffectResult,
  PlayerEffectType,
  PlayerId,
} from './player'

// Game types
export type {
  DifficultyLevel,
  GameAction,
  GameActionType,
  GameConfig,
  GamePhase,
  GameState,
  GameStats,
  SyncData,
  TurnPhase,
} from './game'

export { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS } from './game'

// AI types
export type {
  AIConfig,
  AIDecisionContext,
  ItemEvaluation,
  PoolRiskAnalysis,
  PoolRiskLevel,
} from './ai'

// Item types
export type {
  InventoryItem,
  ItemCategory,
  ItemDefinition,
  ItemEffectResult,
  ItemTargetType,
  ItemType,
  PlayerInventory,
  TargetSelectionState,
} from './item'

// Quest types
export type { QuestConfig, ShapeQuest } from './quest'

// Store types
export type {
  BoostType,
  CartItem,
  StoreConfig,
  StoreItem,
  StoreItemType,
  StoreState,
} from './store'

// Multiplayer types
export type {
  ConnectionStatus,
  GameMode,
  LocalRole,
  MultiplayerContext,
  Room,
  RoomStatus,
} from './multiplayer'

// Event types
export type {
  CartUpdatedEvent,
  GameEndedEvent,
  GameEvent,
  GameEventBase,
  GameEventType,
  GameStartedEvent,
  ItemDeselectedEvent,
  ItemSelectedEvent,
  ItemUsedEvent,
  PillConsumedEvent,
  PlayerDisconnectedEvent,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  PlayerReconnectedEvent,
  RoomCreatedEvent,
  RoundResetEvent,
  SelectionConfirmedEvent,
  StoreConfirmedEvent,
  TurnEndedEvent,
  WantsStoreToggledEvent,
} from './events'

// Sync types
export type {
  EmitOptions,
  MultiplayerEventEmit,
  RemoteEventHandler,
  SyncState,
} from './sync'

