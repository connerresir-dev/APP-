import { useState } from 'react';
import type { Room, Player, GameState } from '@/types';
import { PlayingCard } from '@/components/cards/PlayingCard';
import { PlayerAvatar } from '@/components/game/PlayerAvatar';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { calculateBlackjackValue, drawCards } from '@/utils/deck';
import { toast } from 'sonner';
import { AlertTriangle, Check, Hand, Plus } from 'lucide-react';

interface BlackjackGameProps {
  room: Room;
  currentPlayer: Player | null;
  gameState: GameState;
}

type PlayerAction = 'hit' | 'stand' | 'double';

export function BlackjackGame({ currentPlayer, gameState }: BlackjackGameProps) {
  const [dealerHand, setDealerHand] = useState(gameState.players.find(p => p.id === 'dealer')?.hand || []);
  const [gamePhase, setGamePhase] = useState<'player' | 'dealer' | 'finished'>('player');
  const [results, setResults] = useState<Record<string, 'win' | 'lose' | 'push' | 'blackjack'>>({});

  // Dealer ist der letzte Spieler
  const dealer = gameState.players.find(p => p.id === 'dealer') || {
    ...gameState.players[0],
    id: 'dealer',
    name: 'Dealer',
    hand: [],
  };

  // Normale Spieler (ohne Dealer)
  const players = gameState.players.filter(p => p.id !== 'dealer');
  
  // Aktueller Spieler
  const currentPlayerIndex = gameState.currentPlayerIndex;
  const activePlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === activePlayer?.id;

  // Finde meinen Spieler
  const myPlayer = players.find(p => p.id === currentPlayer?.id);
  const myHand = myPlayer?.hand || [];

  // Berechne Hand-Werte
  const myHandValue = calculateBlackjackValue(myHand);
  const dealerValue = calculateBlackjackValue(dealerHand);

  // Zeige nur eine Dealer-Karte (die andere ist verdeckt)
  const visibleDealerHand = gamePhase === 'player' 
    ? [dealerHand[0], { ...dealerHand[1], isFaceUp: false }] 
    : dealerHand;

  const handleAction = (action: PlayerAction) => {
    if (!isMyTurn || !myPlayer) return;

    switch (action) {
      case 'hit':
        const { cards: hitCards, remainingDeck: hitDeck } = drawCards(gameState.deck, 1);
        myPlayer.hand.push(...hitCards.map(c => ({ ...c, isFaceUp: true })));
        gameState.deck = hitDeck;
        
        const newValue = calculateBlackjackValue(myPlayer.hand);
        if (newValue.isBust) {
          toast.error('Bust! Du hast über 21.');
          nextPlayer();
        }
        break;

      case 'stand':
        nextPlayer();
        break;

      case 'double':
        const { cards: doubleCards, remainingDeck: doubleDeck } = drawCards(gameState.deck, 1);
        myPlayer.hand.push(...doubleCards.map(c => ({ ...c, isFaceUp: true })));
        gameState.deck = doubleDeck;
        nextPlayer();
        break;
    }

    // Force re-render
    setGamePhase(gamePhase);
  };

  const nextPlayer = () => {
    const playerCount = players.length;
    
    if (currentPlayerIndex < playerCount - 1) {
      gameState.currentPlayerIndex++;
    } else {
      // Alle Spieler fertig, Dealer ist dran
      setGamePhase('dealer');
      playDealerTurn();
    }
  };

  const playDealerTurn = () => {
    // Dealer deckt seine Karte auf
    const actualDealer = gameState.players.find(p => p.id === 'dealer');
    if (!actualDealer) return;

    // Dealer zieht bis 17
    let currentValue = calculateBlackjackValue(actualDealer.hand);
    
    while (currentValue.value < 17) {
      const { cards, remainingDeck } = drawCards(gameState.deck, 1);
      actualDealer.hand.push(...cards.map(c => ({ ...c, isFaceUp: true })));
      gameState.deck = remainingDeck;
      currentValue = calculateBlackjackValue(actualDealer.hand);
    }

    setDealerHand(actualDealer.hand);
    
    // Ergebnisse berechnen
    const newResults: Record<string, 'win' | 'lose' | 'push' | 'blackjack'> = {};
    
    for (const player of players) {
      const playerValue = calculateBlackjackValue(player.hand);
      
      if (playerValue.isBlackjack) {
        newResults[player.id] = 'blackjack';
      } else if (playerValue.isBust) {
        newResults[player.id] = 'lose';
      } else if (currentValue.isBust) {
        newResults[player.id] = 'win';
      } else if (playerValue.value > currentValue.value) {
        newResults[player.id] = 'win';
      } else if (playerValue.value < currentValue.value) {
        newResults[player.id] = 'lose';
      } else {
        newResults[player.id] = 'push';
      }
    }
    
    setResults(newResults);
    setGamePhase('finished');
  };

  // Hilfe-Anzeige
  const getHelpText = () => {
    if (!myHandValue) return '';
    
    if (myHandValue.isBlackjack) return 'Blackjack! 🎉';
    if (myHandValue.isBust) return 'Bust! 💥';
    if (myHandValue.value >= 17) return 'Gute Hand! Vielleicht Stand?';
    if (myHandValue.value >= 12) return 'Vorsicht! Risiko beim Ziehen.';
    return 'Sicherer Zug: Hit';
  };

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Dealer */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <PlayerAvatar 
            player={dealer} 
            isCurrentTurn={gamePhase === 'dealer'}
            size="md"
          />
          <div>
            <p className="font-semibold text-slate-800">Dealer</p>
            {gamePhase !== 'player' && (
              <p className={cn(
                "text-sm font-bold",
                dealerValue.isBust ? "text-red-500" : "text-slate-600"
              )}>
                {dealerValue.value} {dealerValue.isSoft && 'Soft'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-center gap-2">
          {visibleDealerHand.map((card) => (
            <PlayingCard key={card.id} card={card} size="lg" />
          ))}
        </div>
      </div>

      {/* Spielfeld */}
      <div className="flex-1 flex items-center justify-center">
        {gamePhase === 'finished' && myPlayer && (
          <motion.div 
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className={cn(
              "text-4xl font-bold mb-2",
              results[myPlayer.id] === 'win' && "text-green-500",
              results[myPlayer.id] === 'lose' && "text-red-500",
              results[myPlayer.id] === 'push' && "text-slate-500",
              results[myPlayer.id] === 'blackjack' && "text-amber-500",
            )}>
              {results[myPlayer.id] === 'win' && 'Gewonnen! 🎉'}
              {results[myPlayer.id] === 'lose' && 'Verloren 😔'}
              {results[myPlayer.id] === 'push' && 'Unentschieden 🤝'}
              {results[myPlayer.id] === 'blackjack' && 'Blackjack! 🃏'}
            </div>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Neues Spiel
            </Button>
          </motion.div>
        )}
      </div>

      {/* Spieler */}
      <div className="space-y-4">
        {players.map((player) => {
          const isCurrentPlayer = player.id === activePlayer?.id;
          const playerValue = calculateBlackjackValue(player.hand);
          const isMe = player.id === currentPlayer?.id;
          
          return (
            <motion.div 
              key={player.id}
              className={cn(
                "p-4 rounded-xl",
                isCurrentPlayer ? "bg-amber-50 border-2 border-amber-200" : "bg-slate-50"
              )}
              animate={isCurrentPlayer ? { scale: [1, 1.02, 1] } : {}}
              transition={{ repeat: isCurrentPlayer ? Infinity : 0, duration: 1.5 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <PlayerAvatar 
                    player={player} 
                    isCurrentTurn={isCurrentPlayer}
                    size="sm"
                  />
                  <div>
                    <p className="font-semibold text-slate-800">
                      {player.name} {isMe && '(Du)'}
                    </p>
                    <p className={cn(
                      "text-sm font-bold",
                      playerValue.isBust ? "text-red-500" : "text-slate-600"
                    )}>
                      {playerValue.value} {playerValue.isSoft && 'Soft'}
                      {playerValue.isBlackjack && ' - Blackjack!'}
                      {playerValue.isBust && ' - Bust!'}
                    </p>
                  </div>
                </div>
                
                {isMe && isMyTurn && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Du bist dran!</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center gap-2">
                {player.hand.map((card) => (
                  <PlayingCard 
                    key={card.id} 
                    card={isMe ? card : { ...card, isFaceUp: true }} 
                    size="md" 
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Aktions-Buttons */}
      {isMyTurn && gamePhase === 'player' && (
        <motion.div 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl p-4 border border-amber-200"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <p className="text-center text-sm text-slate-600 mb-3">
            {getHelpText()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleAction('hit')}
              className="gap-2"
              disabled={myHandValue.isBust}
            >
              <Plus className="w-4 h-4" />
              Hit
            </Button>
            <Button
              variant="default"
              onClick={() => handleAction('stand')}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Hand className="w-4 h-4" />
              Stand
            </Button>
            {myHand.length === 2 && (
              <Button
                variant="outline"
                onClick={() => handleAction('double')}
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                Double
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
