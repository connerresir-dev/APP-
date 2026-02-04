import { useState } from 'react';
import type { Room, Player, GameState } from '@/types';
import { PlayingCard } from '@/components/cards/PlayingCard';
import { PlayerAvatar } from '@/components/game/PlayerAvatar';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { calculateSchwimmenValue, drawCards } from '@/utils/deck';
import { toast } from 'sonner';
import { RefreshCw, Hand } from 'lucide-react';

interface SchwimmenGameProps {
  room: Room;
  currentPlayer: Player | null;
  gameState: GameState;
}

export function SchwimmenGame({ gameState, currentPlayer }: SchwimmenGameProps) {
  const [tableCards, setTableCards] = useState<typeof gameState.players[0]['hand']>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [gamePhase, setGamePhase] = useState<'playing' | 'knocked' | 'finished'>('playing');
  const [knocker, setKnocker] = useState<string | null>(null);
  const [showAllCards, setShowAllCards] = useState(false);

  // Initialisiere Tischkarten wenn leer
  if (tableCards.length === 0 && gameState.deck.length > 0) {
    const { cards, remainingDeck } = drawCards(gameState.deck, 3);
    setTableCards(cards.map(c => ({ ...c, isFaceUp: true })));
    gameState.deck = remainingDeck;
  }

  const players = gameState.players;
  const currentPlayerIndex = gameState.currentPlayerIndex;
  const activePlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === activePlayer?.id;

  // Finde meinen Spieler
  const myPlayer = players.find(p => p.id === currentPlayer?.id);
  const myHand = myPlayer?.hand || [];
  const myHandValue = calculateSchwimmenValue(myHand);

  // Andere Spieler
  const otherPlayers = players.filter(p => p.id !== currentPlayer?.id);

  const handleCardSelect = (index: number) => {
    if (!isMyTurn) return;
    
    setSelectedCards(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      if (prev.length < 3) {
        return [...prev, index];
      }
      return prev;
    });
  };

  const handleSwap = () => {
    if (!isMyTurn || !myPlayer || selectedCards.length === 0) return;

    // Tausche ausgewählte Karten mit Tischkarten
    if (selectedCards.length === 3) {
      const oldTable = [...tableCards];
      const oldHand = [...myPlayer.hand];
      
      myPlayer.hand = oldTable;
      setTableCards(oldHand);
      
      toast.success('Karten getauscht!');
    } else if (selectedCards.length === 1) {
      // Einzelner Tausch
      const cardIndex = selectedCards[0];
      const oldTable = [...tableCards];
      const oldHand = [...myPlayer.hand];
      
      myPlayer.hand[cardIndex] = oldTable[0];
      setTableCards([oldHand[cardIndex], ...oldTable.slice(1)]);
      
      toast.success('Karte getauscht!');
    }

    setSelectedCards([]);
    nextPlayer();
  };

  const handleKnock = () => {
    if (!isMyTurn) return;
    
    setKnocker(myPlayer?.id || null);
    setGamePhase('knocked');
    toast.info(`${myPlayer?.name} klopft an! Letzte Runde!`);
    nextPlayer();
  };

  const nextPlayer = () => {
    const playerCount = players.length;
    
    if (gamePhase === 'knocked' && currentPlayerIndex === players.findIndex(p => p.id === knocker)) {
      // Runde beendet
      endRound();
    } else {
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;
    }
  };

  const endRound = () => {
    setGamePhase('finished');
    setShowAllCards(true);
    
    // Finde Verlierer (niedrigste Punktzahl)
    let lowestScore = Infinity;
    let loser: typeof players[0] | null = null;
    
    for (const player of players) {
      const value = calculateSchwimmenValue(player.hand);
      if (value.score < lowestScore) {
        lowestScore = value.score;
        loser = player;
      }
    }
    
    if (loser) {
      toast.error(`${loser.name} verliert diese Runde!`);
    }
  };

  const handleNewRound = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Andere Spieler (oben) */}
      <div className="flex justify-center gap-6 mb-6">
        {otherPlayers.map((player) => (
          <div key={player.id} className="text-center">
            <PlayerAvatar
              player={player}
              isCurrentTurn={players[currentPlayerIndex]?.id === player.id}
              size="md"
            />
            {showAllCards && (
              <div className="mt-2 flex justify-center gap-1">
                {player.hand.map((card, i) => (
                  <PlayingCard key={i} card={{ ...card, isFaceUp: true }} size="sm" />
                ))}
              </div>
            )}
            {!showAllCards && (
              <p className="text-xs text-slate-500 mt-1">
                {player.hand.length} Karten
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Tischkarten (Mitte) */}
      <div className="flex-1 flex flex-col items-center justify-center mb-6">
        <p className="text-sm text-slate-500 mb-3">Tisch (zum Tauschen)</p>
        <div className="flex gap-3">
          {tableCards.map((card) => (
            <motion.div
              key={card.id}
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer"
              onClick={() => isMyTurn && selectedCards.length > 0 && handleSwap()}
            >
              <PlayingCard card={card} size="lg" />
            </motion.div>
          ))}
        </div>
        
        {gamePhase === 'knocked' && (
          <motion.div 
            className="mt-4 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-semibold"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            🔔 Letzte Runde!
          </motion.div>
        )}
      </div>

      {/* Status */}
      <div className="text-center mb-4">
        {isMyTurn ? (
          <motion.p 
            className="text-green-600 font-semibold"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            Du bist dran!
          </motion.p>
        ) : (
          <p className="text-slate-500">
            {activePlayer?.name} ist dran...
          </p>
        )}
      </div>

      {/* Meine Hand */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-medium text-slate-600">
              Deine Hand
            </span>
            {myHandValue && (
              <p className="text-sm text-amber-600 font-semibold">
                {myHandValue.bestCombination}
              </p>
            )}
          </div>
          
          {isMyTurn && gamePhase === 'playing' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleKnock}
                className="gap-2"
              >
                <Hand className="w-4 h-4" />
                Klopfen
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex justify-center gap-3">
          {myHand.map((card, index) => (
            <motion.div
              key={card.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleCardSelect(index)}
              className={cn(
                "cursor-pointer transition-all",
                selectedCards.includes(index) && "ring-4 ring-amber-400 ring-offset-2 rounded-lg"
              )}
            >
              <PlayingCard card={card} size="lg" />
            </motion.div>
          ))}
        </div>
        
        {selectedCards.length > 0 && isMyTurn && (
          <motion.div 
            className="text-center mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button onClick={handleSwap} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {selectedCards.length === 3 ? 'Alle tauschen' : 'Tauschen'}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Ergebnis-Anzeige */}
      {gamePhase === 'finished' && (
        <motion.div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">
              Runde beendet!
            </h3>
            
            <div className="space-y-3 mb-6">
              {players.map((player) => {
                const value = calculateSchwimmenValue(player.hand);
                return (
                  <div 
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>{player.avatar}</span>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <span className="font-bold text-amber-600">
                      {value.score}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <Button onClick={handleNewRound} className="w-full">
              Neue Runde
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
