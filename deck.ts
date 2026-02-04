import type { Card, Suit, Rank, GameType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Standard-Kartendeck (52 Karten)
const STANDARD_SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const STANDARD_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// UNO-Karten
const UNO_COLORS: Suit[] = ['red', 'blue', 'green', 'yellow'];

// Kartenwerte für verschiedene Spiele
const BLACKJACK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 10, 'Q': 10, 'K': 10, 'A': 11,
  '0': 0, 'skip': 0, 'reverse': 0, 'draw2': 0, 'draw4': 0, 'wild': 0,
};

const SCHWIMMEN_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 11,
  '0': 0, 'skip': 0, 'reverse': 0, 'draw2': 0, 'draw4': 0, 'wild': 0,
};

// Erstelle ein Standard-Kartendeck
export function createStandardDeck(): Card[] {
  const deck: Card[] = [];
  
  for (const suit of STANDARD_SUITS) {
    for (const rank of STANDARD_RANKS) {
      deck.push({
        id: uuidv4(),
        suit,
        rank,
        value: BLACKJACK_VALUES[rank],
        isFaceUp: false,
      });
    }
  }
  
  return shuffleDeck(deck);
}

// Erstelle ein UNO-Deck
export function createUnoDeck(): Card[] {
  const deck: Card[] = [];
  
  // Zahlenkarten (0-9) - 0 nur einmal pro Farbe, 1-9 zweimal
  for (const color of UNO_COLORS) {
    // 0 nur einmal
    deck.push({
      id: uuidv4(),
      suit: color,
      rank: '0',
      value: 0,
      isFaceUp: false,
    });
    
    // 1-9 jeweils zweimal
    for (let i = 1; i <= 9; i++) {
      const rank = i.toString() as Rank;
      for (let j = 0; j < 2; j++) {
        deck.push({
          id: uuidv4(),
          suit: color,
          rank,
          value: i,
          isFaceUp: false,
        });
      }
    }
    
    // Aktionskarten (je zweimal pro Farbe)
    const actionCards: Rank[] = ['skip', 'reverse', 'draw2'];
    for (const action of actionCards) {
      for (let j = 0; j < 2; j++) {
        deck.push({
          id: uuidv4(),
          suit: color,
          rank: action,
          value: action === 'draw2' ? 2 : 0,
          isFaceUp: false,
        });
      }
    }
  }
  
  // Schwarze Aktionskarten (je viermal)
  const wildCards: Rank[] = ['wild', 'draw4'];
  for (const wild of wildCards) {
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: uuidv4(),
        suit: 'wild',
        rank: wild,
        value: wild === 'draw4' ? 4 : 0,
        isFaceUp: false,
      });
    }
  }
  
  return shuffleDeck(deck);
}

// Erstelle ein Deck für das jeweilige Spiel
export function createDeck(gameType: GameType): Card[] {
  switch (gameType) {
    case 'uno':
      return createUnoDeck();
    case 'bullshit':
    case 'schwimmen':
    case 'blackjack':
    case 'poker':
      return createStandardDeck();
    default:
      return createStandardDeck();
  }
}

// Mische das Deck (Fisher-Yates Algorithmus)
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Ziehe Karten vom Deck
export function drawCards(deck: Card[], count: number): { cards: Card[]; remainingDeck: Card[] } {
  const cards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  return { cards, remainingDeck };
}

// Berechne Blackjack-Wert einer Hand
export function calculateBlackjackValue(cards: Card[]): { value: number; isSoft: boolean; isBust: boolean; isBlackjack: boolean } {
  let value = 0;
  let aceCount = 0;
  
  for (const card of cards) {
    if (card.rank === 'A') {
      aceCount++;
      value += 11;
    } else {
      value += BLACKJACK_VALUES[card.rank];
    }
  }
  
  // Asse als 1 zählen, wenn nötig
  while (value > 21 && aceCount > 0) {
    value -= 10;
    aceCount--;
  }
  
  const isSoft = aceCount > 0;
  const isBust = value > 21;
  const isBlackjack = cards.length === 2 && value === 21;
  
  return { value, isSoft, isBust, isBlackjack };
}

// Berechne Schwimmen-Wert einer Hand
export function calculateSchwimmenValue(cards: Card[]): { 
  score: number; 
  is31: boolean; 
  isFire: boolean; 
  bestCombination: string;
} {
  if (cards.length !== 3) {
    return { score: 0, is31: false, isFire: false, bestCombination: '' };
  }
  
  // Prüfe auf Feuer (drei Siebener)
  const allSevens = cards.every(c => c.rank === '7');
  if (allSevens) {
    return { score: 30.5, is31: false, isFire: true, bestCombination: 'Feuer (drei Siebener)' };
  }
  
  // Prüfe auf drei Asse
  const allAces = cards.every(c => c.rank === 'A');
  if (allAces) {
    return { score: 33, is31: true, isFire: false, bestCombination: 'Drei Asse (33)' };
  }
  
  // Prüfe auf gleiche Farbe
  const sameSuit = cards.every(c => c.suit === cards[0].suit);
  
  if (sameSuit) {
    const score = cards.reduce((sum, c) => sum + SCHWIMMEN_VALUES[c.rank], 0);
    return { 
      score, 
      is31: score === 31, 
      isFire: false, 
      bestCombination: `${score} Punkte in ${getSuitName(cards[0].suit)}` 
    };
  }
  
  // Prüfe auf gleichen Wert (Dreierpasch)
  const sameRank = cards.every(c => c.rank === cards[0].rank);
  if (sameRank) {
    return { 
      score: 30.5, 
      is31: false, 
      isFire: false, 
      bestCombination: `Dreierpasch (${cards[0].rank})` 
    };
  }
  
  // Beste Kombination in einer Farbe (falls möglich)
  const suitGroups: Record<string, Card[]> = {};
  for (const card of cards) {
    if (!suitGroups[card.suit]) suitGroups[card.suit] = [];
    suitGroups[card.suit].push(card);
  }
  
  let bestScore = 0;
  let bestSuit = '';
  
  for (const [suit, suitCards] of Object.entries(suitGroups)) {
    if (suitCards.length >= 2) {
      const score = suitCards.reduce((sum, c) => sum + SCHWIMMEN_VALUES[c.rank], 0);
      if (score > bestScore) {
        bestScore = score;
        bestSuit = suit;
      }
    }
  }
  
  // Wenn keine gleiche Farbe, nimm höchste Karte
  if (bestScore === 0) {
    const maxCard = cards.reduce((max, c) => 
      SCHWIMMEN_VALUES[c.rank] > SCHWIMMEN_VALUES[max.rank] ? c : max
    );
    return { 
      score: SCHWIMMEN_VALUES[maxCard.rank], 
      is31: false, 
      isFire: false, 
      bestCombination: `Höchste Karte: ${maxCard.rank}` 
    };
  }
  
  return { 
    score: bestScore, 
    is31: bestScore === 31, 
    isFire: false, 
    bestCombination: `${bestScore} Punkte in ${getSuitName(bestSuit as Suit)}` 
  };
}

// Hilfsfunktion: Farbname auf Deutsch
function getSuitName(suit: Suit): string {
  const names: Record<Suit, string> = {
    hearts: 'Herz',
    diamonds: 'Karo',
    clubs: 'Kreuz',
    spades: 'Pik',
    red: 'Rot',
    blue: 'Blau',
    green: 'Grün',
    yellow: 'Gelb',
    wild: 'Wild',
  };
  return names[suit] || suit;
}

// Format-Karten für Anzeige
export function formatCard(card: Card): string {
  if (!card.isFaceUp) return '🂠';
  
  const suitSymbols: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
    red: '🔴',
    blue: '🔵',
    green: '🟢',
    yellow: '🟡',
    wild: '⬛',
  };
  
  const rankDisplay: Record<Rank, string> = {
    '0': '0', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
    'J': 'B', 'Q': 'D', 'K': 'K', 'A': 'A',
    'skip': '⏸', 'reverse': '🔄', 'draw2': '+2', 'draw4': '+4', 'wild': 'W',
  };
  
  return `${suitSymbols[card.suit]}${rankDisplay[card.rank]}`;
}

// Prüfe ob UNO-Karte spielbar ist
export function isUnoCardPlayable(card: Card, topCard: Card, currentColor: Suit, pendingDrawCards: number): boolean {
  // Wenn +2 oder +4 gespielt wurde und gewartet wird
  if (pendingDrawCards > 0) {
    // Nur weitere +2 oder +4 können gespielt werden (Stapeln)
    return card.rank === 'draw2' || card.rank === 'draw4';
  }
  
  // Wilde Karten können immer gespielt werden
  if (card.suit === 'wild') return true;
  
  // Gleiche Farbe wie aktuelle Farbe
  if (card.suit === currentColor) return true;
  
  // Gleiche Zahl/Aktion wie oberste Karte
  if (card.rank === topCard.rank && card.rank !== 'wild') return true;
  
  return false;
}
