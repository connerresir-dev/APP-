import type { Card, Rank, Suit, PokerHandEvaluation, PokerHandRank } from '@/types';

// Rangfolge der Karten (für Vergleich)
const RANK_ORDER: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Konvertiere Rank zu numerischem Wert
function rankToValue(rank: Rank): number {
  return RANK_ORDER.indexOf(rank);
}

// Zähle Vorkommen jedes Ranks
function countRanks(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  return counts;
}

// Prüfe auf Flush (5 gleiche Farben)
function isFlush(cards: Card[]): boolean {
  const suits = new Map<Suit, number>();
  for (const card of cards) {
    suits.set(card.suit, (suits.get(card.suit) || 0) + 1);
  }
  return Array.from(suits.values()).some(count => count >= 5);
}

// Prüfe auf Straight (5 aufeinanderfolgende Werte)
function isStraight(cards: Card[]): { isStraight: boolean; highCard: Rank | null } {
  const uniqueRanks = [...new Set(cards.map(c => c.rank))];
  const values = uniqueRanks.map(rankToValue).sort((a, b) => a - b);
  
  // Spezialfall: A-2-3-4-5 (Wheel)
  if (values.includes(12) && values.includes(0) && values.includes(1) && 
      values.includes(2) && values.includes(3)) {
    return { isStraight: true, highCard: '5' };
  }
  
  // Normale Straßen
  for (let i = 0; i <= values.length - 5; i++) {
    if (values[i + 4] - values[i] === 4) {
      return { isStraight: true, highCard: RANK_ORDER[values[i + 4]] };
    }
  }
  
  return { isStraight: false, highCard: null };
}

// Finde die beste 5-Karten-Hand aus 7 Karten
export function evaluatePokerHand(holeCards: Card[], communityCards: Card[]): PokerHandEvaluation {
  const allCards = [...holeCards, ...communityCards];
  
  // Generiere alle möglichen 5-Karten-Kombinationen
  const combinations = getCombinations(allCards, 5);
  
  let bestHand: PokerHandEvaluation = {
    rank: 'high-card',
    name: 'High Card',
    strength: 0,
    cards: [],
  };
  
  for (const combo of combinations) {
    const evaluation = evaluateFiveCardHand(combo);
    if (evaluation.strength > bestHand.strength) {
      bestHand = evaluation;
    }
  }
  
  return bestHand;
}

// Bewerte eine 5-Karten-Hand
function evaluateFiveCardHand(cards: Card[]): PokerHandEvaluation {
  const rankCounts = countRanks(cards);
  const hasFlush = isFlush(cards);
  const straightResult = isStraight(cards);
  
  // Royal Flush
  if (hasFlush && straightResult.isStraight && straightResult.highCard === 'A') {
    return {
      rank: 'royal-flush',
      name: 'Royal Flush',
      strength: 1000,
      cards: [...cards],
    };
  }
  
  // Straight Flush
  if (hasFlush && straightResult.isStraight) {
    return {
      rank: 'straight-flush',
      name: 'Straight Flush',
      strength: 900 + rankToValue(straightResult.highCard!),
      cards: [...cards],
    };
  }
  
  // Four of a Kind
  const fourOfAKind = Array.from(rankCounts.entries()).find(([_, count]) => count === 4);
  if (fourOfAKind) {
    const kicker = cards.find(c => c.rank !== fourOfAKind[0])!;
    return {
      rank: 'four-of-a-kind',
      name: `Four of a Kind (${fourOfAKind[0]})`,
      strength: 800 + rankToValue(fourOfAKind[0]) * 13 + rankToValue(kicker.rank),
      cards: [...cards],
    };
  }
  
  // Full House
  const threeOfAKind = Array.from(rankCounts.entries()).find(([_, count]) => count === 3);
  const pair = Array.from(rankCounts.entries()).find(([_, count]) => count === 2);
  if (threeOfAKind && pair) {
    return {
      rank: 'full-house',
      name: `Full House (${threeOfAKind[0]} over ${pair[0]})`,
      strength: 700 + rankToValue(threeOfAKind[0]) * 13 + rankToValue(pair[0]),
      cards: [...cards],
    };
  }
  
  // Flush
  if (hasFlush) {
    const sortedCards = [...cards].sort((a, b) => rankToValue(b.rank) - rankToValue(a.rank));
    return {
      rank: 'flush',
      name: 'Flush',
      strength: 600 + sortedCards.reduce((sum, c, i) => sum + rankToValue(c.rank) * Math.pow(13, 4 - i), 0),
      cards: [...cards],
    };
  }
  
  // Straight
  if (straightResult.isStraight) {
    return {
      rank: 'straight',
      name: `Straight (${straightResult.highCard} high)`,
      strength: 500 + rankToValue(straightResult.highCard!),
      cards: [...cards],
    };
  }
  
  // Three of a Kind
  if (threeOfAKind) {
    const kickers = cards.filter(c => c.rank !== threeOfAKind[0]).sort((a, b) => rankToValue(b.rank) - rankToValue(a.rank));
    return {
      rank: 'three-of-a-kind',
      name: `Three of a Kind (${threeOfAKind[0]})`,
      strength: 400 + rankToValue(threeOfAKind[0]) * 169 + rankToValue(kickers[0].rank) * 13 + rankToValue(kickers[1].rank),
      cards: [...cards],
    };
  }
  
  // Two Pair
  const pairs = Array.from(rankCounts.entries()).filter(([_, count]) => count === 2);
  if (pairs.length >= 2) {
    const sortedPairs = pairs.sort((a, b) => rankToValue(b[0]) - rankToValue(a[0]));
    const kicker = cards.find(c => c.rank !== sortedPairs[0][0] && c.rank !== sortedPairs[1][0])!;
    return {
      rank: 'two-pair',
      name: `Two Pair (${sortedPairs[0][0]} and ${sortedPairs[1][0]})`,
      strength: 300 + rankToValue(sortedPairs[0][0]) * 169 + rankToValue(sortedPairs[1][0]) * 13 + rankToValue(kicker.rank),
      cards: [...cards],
    };
  }
  
  // Pair
  if (pair) {
    const kickers = cards.filter(c => c.rank !== pair[0]).sort((a, b) => rankToValue(b.rank) - rankToValue(a.rank));
    return {
      rank: 'pair',
      name: `Pair (${pair[0]})`,
      strength: 200 + rankToValue(pair[0]) * 2197 + 
                rankToValue(kickers[0].rank) * 169 + 
                rankToValue(kickers[1].rank) * 13 + 
                rankToValue(kickers[2].rank),
      cards: [...cards],
    };
  }
  
  // High Card
  const sortedCards = [...cards].sort((a, b) => rankToValue(b.rank) - rankToValue(a.rank));
  return {
    rank: 'high-card',
    name: `High Card (${sortedCards[0].rank})`,
    strength: sortedCards.reduce((sum, c, i) => sum + rankToValue(c.rank) * Math.pow(13, 4 - i), 0),
    cards: [...cards],
  };
}

// Hilfsfunktion: Generiere alle Kombinationen
function getCombinations<T>(array: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (array.length < k) return [];
  
  const result: T[][] = [];
  
  function backtrack(start: number, current: T[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    
    for (let i = start; i < array.length; i++) {
      current.push(array[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  
  backtrack(0, []);
  return result;
}

// Hand-Stärke als Prozentsatz (für UI-Anzeige)
export function getHandStrengthPercentage(evaluation: PokerHandEvaluation): number {
  // Skaliere von 0-100 basierend auf der Hand-Stärke
  const maxStrength = 1000 + 12; // Royal Flush max
  return Math.min(100, (evaluation.strength / maxStrength) * 100);
}

// Hand-Namen auf Deutsch
export function getGermanHandName(rank: PokerHandRank): string {
  const names: Record<PokerHandRank, string> = {
    'high-card': 'Höchste Karte',
    'pair': 'Paar',
    'two-pair': 'Zwei Paar',
    'three-of-a-kind': 'Drilling',
    'straight': 'Straße',
    'flush': 'Flush',
    'full-house': 'Full House',
    'four-of-a-kind': 'Vierling',
    'straight-flush': 'Straight Flush',
    'royal-flush': 'Royal Flush',
  };
  return names[rank];
}
