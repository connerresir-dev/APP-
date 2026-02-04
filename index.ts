// Spiel-Typen
export type GameType = 'bullshit' | 'schwimmen' | 'blackjack' | 'poker' | 'uno';

export interface GameInfo {
  id: GameType;
  name: string;
  description: string;
  maxPlayers: number;
  minPlayers: number;
  icon: string;
  color: string;
}

// Spieler-Typen
export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isConnected: boolean;
  joinedAt: number;
}

// Raum-Typen
export interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  players: Player[];
  gameType: GameType | null;
  gameState: GameState | null;
  settings: RoomSettings;
  createdAt: number;
  status: 'waiting' | 'playing' | 'finished';
}

export interface RoomSettings {
  maxPlayers: number;
  customRules: CustomRules;
}

export interface CustomRules {
  // UNO Regeln
  unoStacking?: boolean;
  unoJumpIn?: boolean;
  unoDrawTillPlay?: boolean;
  // Schwimmen Regeln
  schwimmenThreeAces?: boolean;
  schwimmenFire?: boolean;
  // Bullshit Regeln
  bullshitMultipleCards?: boolean;
  // Blackjack Regeln
  blackjackSurrender?: boolean;
  blackjackInsurance?: boolean;
  // Poker Regeln
  pokerStraddle?: boolean;
  pokerRunItTwice?: boolean;
}

// Spielzustand
export interface GameState {
  currentPlayerIndex: number;
  players: GamePlayer[];
  deck: Card[];
  discardPile: Card[];
  round: number;
  status: 'waiting' | 'playing' | 'finished';
  winner: string | null;
  direction: 1 | -1; // für UNO
  lastAction: GameAction | null;
}

export interface GamePlayer extends Player {
  hand: Card[];
  score: number;
  isActive: boolean;
  hasCalledUno?: boolean;
  bet?: number;
  folded?: boolean;
  chips?: number;
}

// Karten-Typen
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '0' | 'skip' | 'reverse' | 'draw2' | 'draw4' | 'wild';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  isFaceUp: boolean;
  isPlayable?: boolean;
}

// Spielaktionen
export type GameAction = 
  | { type: 'play'; playerId: string; cards: Card[]; claimedRank?: Rank }
  | { type: 'draw'; playerId: string; count: number }
  | { type: 'call'; playerId: string; callType: 'bullshit' | 'uno' | 'blackjack' }
  | { type: 'bet'; playerId: string; amount: number }
  | { type: 'fold'; playerId: string }
  | { type: 'check'; playerId: string }
  | { type: 'stand'; playerId: string }
  | { type: 'hit'; playerId: string }
  | { type: 'double'; playerId: string }
  | { type: 'split'; playerId: string }
  | { type: 'swap'; playerId: string; cardIndices: number[] }
  | { type: 'knock'; playerId: string };

// UI-Typen
export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

// Poker-spezifisch
export type PokerHandRank = 
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush';

export interface PokerHandEvaluation {
  rank: PokerHandRank;
  name: string;
  strength: number;
  cards: Card[];
}

// Blackjack-spezifisch
export interface BlackjackHand {
  cards: Card[];
  value: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
}

// Schwimmen-spezifisch
export interface SchwimmenHand {
  cards: Card[];
  score: number;
  is31: boolean;
  isFire: boolean;
  bestCombination: string;
}

// UNO-spezifisch
export interface UnoGameState extends GameState {
  currentColor: Suit;
  pendingDrawCards: number;
  challengeActive: boolean;
}
