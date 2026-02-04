import { useState } from 'react';
import type { Room, Player, GameState, Rank } from '@/types';
import { PlayingCard, CardStack } from '@/components/cards/PlayingCard';
import { PlayerAvatar } from '@/components/game/PlayerAvatar';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AlertTriangle, ThumbsUp } from 'lucide-react';

interface BullshitGameProps {
  room: Room;
  currentPlayer: Player | null;
  gameState: GameState;
}

const RANK_ORDER: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function BullshitGame({ gameState, currentPlayer }: BullshitGameProps) {
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [showRankPicker, setShowRankPicker] = useState(false);
  const [pileCount, setPileCount] = useState(0);
  const [lastPlay, setLastPlay] = useState<{ player: string; count: number; claimedRank: Rank } | null>(null);
  const [showChallenge, setShowChallenge] = useState(false);

  const players = gameState.players;
  const currentPlayerIndex = gameState.currentPlayerIndex;
  const activePlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === activePlayer?.id;

  // Finde meinen Spieler
  const myPlayer = players.find(p => p.id === currentPlayer?.id);
  const myHand = myPlayer?.hand || [];

  // Nächster erwarteter Wert (z.B. nach "3" kommt "4")
  const expectedRank = lastPlay 
    ? RANK_ORDER[(RANK_ORDER.indexOf(lastPlay.claimedRank) + 1) % RANK_ORDER.length]
    : 'A';

  const handleCardSelect = (index: number) => {
    if (!isMyTurn) return;
    
    setSelectedCards(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  const handlePlayCards = () => {
    if (!isMyTurn || selectedCards.length === 0) return;
    
    setShowRankPicker(true);
  };

  const confirmPlay = (rank: Rank) => {
    if (!myPlayer) return;

    // Entferne gespielte Karten
    myPlayer.hand = myPlayer.hand.filter((_, i) => !selectedCards.includes(i));
    
    // Füge zum Stapel hinzu
    setPileCount(prev => prev + selectedCards.length);
    setLastPlay({
      player: myPlayer.name,
      count: selectedCards.length,
      claimedRank: rank,
    });
    
    toast.success(`${selectedCards.length} Karte(n) als ${rank} gespielt`);
    
    setSelectedCards([]);
    setShowRankPicker(false);
    nextPlayer();
  };

  const handleChallenge = () => {
    if (!lastPlay) return;
    
    setShowChallenge(true);
    
    // Prüfe ob es ein Bluff war (simuliert)
    const wasBluff = Math.random() > 0.5;
    
    setTimeout(() => {
      if (wasBluff) {
        toast.success('Richtig! Es war ein Bluff!');
        const bluffer = players.find(p => p.name === lastPlay.player);
        if (bluffer) {
          toast.info(`${bluffer.name} muss den Stapel aufnehmen`);
        }
      } else {
        toast.error('Falsch! Kein Bluff.');
        if (myPlayer) {
          toast.info(`${myPlayer.name} muss den Stapel aufnehmen`);
        }
      }
      setShowChallenge(false);
      setPileCount(0);
    }, 1500);
  };

  const nextPlayer = () => {
    const playerCount = players.length;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % playerCount;
    
    // Prüfe auf Gewinner
    if (myPlayer && myPlayer.hand.length === 0) {
      gameState.winner = myPlayer.id;
      gameState.status = 'finished';
      toast.success(`${myPlayer.name} hat gewonnen!`);
    }
  };

  // Andere Spieler
  const otherPlayers = players.filter(p => p.id !== currentPlayer?.id);

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Andere Spieler (oben) */}
      <div className="flex justify-center gap-6 mb-6">
        {otherPlayers.map((player) => (
          <div key={player.id} className="text-center">
            <PlayerAvatar
              player={player}
              isCurrentTurn={players[currentPlayerIndex]?.id === player.id}
              cardCount={player.hand.length}
              size="md"
            />
          </div>
        ))}
      </div>

      {/* Spielfeld (Mitte) */}
      <div className="flex-1 flex flex-col items-center justify-center mb-6">
        {/* Stapel */}
        <div className="relative">
          <CardStack count={pileCount} size="lg" />
          {pileCount > 0 && (
            <motion.div 
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              {pileCount}
            </motion.div>
          )}
        </div>
        
        {/* Letzter Zug */}
        {lastPlay && (
          <motion.div 
            className="mt-4 p-3 bg-amber-50 rounded-lg text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-slate-600">
              <span className="font-semibold">{lastPlay.player}</span> legte{' '}
              <span className="font-bold text-amber-600">{lastPlay.count}</span> Karte(n) als{' '}
              <span className="font-bold text-amber-600">{lastPlay.claimedRank}</span>
            </p>
          </motion.div>
        )}
        
        {/* Bullshit Button */}
        {lastPlay && !isMyTurn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4"
          >
            <Button
              variant="destructive"
              size="lg"
              onClick={handleChallenge}
              className="gap-2 animate-pulse"
            >
              <AlertTriangle className="w-5 h-5" />
              BULLSHIT!
            </Button>
          </motion.div>
        )}
      </div>

      {/* Status */}
      <div className="text-center mb-4">
        {isMyTurn ? (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <p className="text-green-600 font-semibold">Du bist dran!</p>
            <p className="text-sm text-slate-500">
              Erwartet: <span className="font-bold text-amber-600">{expectedRank}</span>
            </p>
          </motion.div>
        ) : (
          <p className="text-slate-500">
            {activePlayer?.name} ist dran...
          </p>
        )}
      </div>

      {/* Meine Hand */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600">
            Deine Karten ({myHand.length})
          </span>
          {selectedCards.length > 0 && (
            <span className="text-sm text-amber-600">
              {selectedCards.length} ausgewählt
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 mb-4">
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
              <PlayingCard card={card} size="md" />
            </motion.div>
          ))}
        </div>
        
        {isMyTurn && selectedCards.length > 0 && (
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button onClick={handlePlayCards} className="gap-2">
              <ThumbsUp className="w-4 h-4" />
              Als {expectedRank} spielen
            </Button>
          </motion.div>
        )}
      </div>

      {/* Rang-Auswahl Dialog */}
      {showRankPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-xl p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">
              Welchen Wert behauptest du?
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {RANK_ORDER.map((rank) => (
                <button
                  key={rank}
                  className={cn(
                    "w-12 h-16 rounded-lg font-bold text-lg transition-all",
                    rank === expectedRank
                      ? "bg-amber-500 text-white shadow-lg"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                  onClick={() => confirmPlay(rank)}
                >
                  {rank}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Challenge Animation */}
      {showChallenge && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-center"
          >
            <div className="text-8xl mb-4">🃏</div>
            <h2 className="text-4xl font-bold text-white">BULLSHIT!</h2>
            <p className="text-white/80 mt-2">Prüfe die Karten...</p>
          </motion.div>
        </div>
      )}

      {/* Gewinner */}
      {gameState.winner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-xl p-8 text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {players.find(p => p.id === gameState.winner)?.name} gewinnt!
            </h2>
            <p className="text-slate-600 mb-6">Herzlichen Glückwunsch!</p>
            <Button onClick={() => window.location.reload()}>
              Neues Spiel
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
