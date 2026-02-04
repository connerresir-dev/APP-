import { useState, useEffect } from 'react';
import type { Room, Player, GameState } from '@/types';
import { PlayingCard } from '@/components/cards/PlayingCard';
import { PlayerAvatar } from '@/components/game/PlayerAvatar';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { evaluatePokerHand, getGermanHandName, getHandStrengthPercentage } from '@/utils/poker';
import { drawCards } from '@/utils/deck';
import { toast } from 'sonner';
import { Coins, Eye, Check, TrendingUp, X } from 'lucide-react';

interface PokerGameProps {
  room: Room;
  currentPlayer: Player | null;
  gameState: GameState;
}

type BettingRound = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

export function PokerGame({ gameState, currentPlayer }: PokerGameProps) {
  const [communityCards, setCommunityCards] = useState<typeof gameState.players[0]['hand']>([]);
  const [bettingRound, setBettingRound] = useState<BettingRound>('pre-flop');
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [showHandStrength, setShowHandStrength] = useState(true);

  const players = gameState.players;
  const currentPlayerIndex = gameState.currentPlayerIndex;
  const activePlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === activePlayer?.id;

  // Finde meinen Spieler
  const myPlayer = players.find(p => p.id === currentPlayer?.id);
  const myHand = myPlayer?.hand || [];

  // Community Cards je nach Runde
  useEffect(() => {
    if (bettingRound === 'pre-flop' && communityCards.length === 0) {
      // Initial: keine Community Cards
    } else if (bettingRound === 'flop' && communityCards.length === 0) {
      const { cards, remainingDeck } = drawCards(gameState.deck, 3);
      setCommunityCards(cards.map(c => ({ ...c, isFaceUp: true })));
      gameState.deck = remainingDeck;
    } else if ((bettingRound === 'turn' || bettingRound === 'river') && communityCards.length < 5) {
      const { cards, remainingDeck } = drawCards(gameState.deck, 1);
      setCommunityCards(prev => [...prev, ...cards.map(c => ({ ...c, isFaceUp: true }))]);
      gameState.deck = remainingDeck;
    }
  }, [bettingRound, communityCards.length, gameState.deck]);

  // Bewerte meine Hand
  const handEvaluation = myHand.length === 2 
    ? evaluatePokerHand(myHand, communityCards)
    : null;

  const handleBet = (amount: number) => {
    if (!isMyTurn || !myPlayer) return;
    
    if (myPlayer.chips && myPlayer.chips >= amount) {
      myPlayer.chips -= amount;
      myPlayer.bet = (myPlayer.bet || 0) + amount;
      setPot(prev => prev + amount);
      setCurrentBet(Math.max(currentBet, myPlayer.bet || 0));
      nextPlayer();
    } else {
      toast.error('Nicht genug Chips!');
    }
  };

  const handleCheck = () => {
    if (!isMyTurn) return;
    nextPlayer();
  };

  const handleFold = () => {
    if (!isMyTurn || !myPlayer) return;
    myPlayer.folded = true;
    toast.info(`${myPlayer.name} foldet`);
    nextPlayer();
  };

  const nextPlayer = () => {
    const activePlayers = players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
      // Gewinner!
      gameState.winner = activePlayers[0].id;
      gameState.status = 'finished';
      toast.success(`${activePlayers[0].name} gewinnt ${pot} Chips!`);
      return;
    }

    // Nächste Runde?
    const allBetsEqual = activePlayers.every(p => p.bet === currentBet);
    if (allBetsEqual) {
      if (bettingRound === 'pre-flop') setBettingRound('flop');
      else if (bettingRound === 'flop') setBettingRound('turn');
      else if (bettingRound === 'turn') setBettingRound('river');
      else if (bettingRound === 'river') setBettingRound('showdown');
      
      setCurrentBet(0);
      players.forEach(p => p.bet = 0);
    }

    // Nächster Spieler
    let nextIndex = (currentPlayerIndex + 1) % players.length;
    while (players[nextIndex]?.folded) {
      nextIndex = (nextIndex + 1) % players.length;
    }
    gameState.currentPlayerIndex = nextIndex;
  };

  // Andere Spieler
  const otherPlayers = players.filter(p => p.id !== currentPlayer?.id);

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Gegner (oben) */}
      <div className="flex justify-center gap-4 mb-4">
        {otherPlayers.map((player) => (
          <div key={player.id} className="text-center">
            <PlayerAvatar
              player={player}
              isCurrentTurn={players[currentPlayerIndex]?.id === player.id}
              size="sm"
            />
            {player.folded && (
              <p className="text-xs text-red-500 mt-1">Gefoldet</p>
            )}
            {player.chips !== undefined && (
              <p className="text-xs text-amber-600 mt-1">
                {player.chips} 💰
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Community Cards */}
      <div className="flex-1 flex flex-col items-center justify-center mb-4">
        <div className="text-center mb-3">
          <p className="text-sm text-slate-500 mb-1">Community Cards</p>
          <p className="text-xs text-amber-600 font-medium">
            {bettingRound === 'pre-flop' && 'Pre-Flop'}
            {bettingRound === 'flop' && 'Flop'}
            {bettingRound === 'turn' && 'Turn'}
            {bettingRound === 'river' && 'River'}
            {bettingRound === 'showdown' && 'Showdown'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Platzhalter für nicht aufgedeckte Karten */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              {communityCards[i] ? (
                <PlayingCard card={communityCards[i]} size="lg" />
              ) : (
                <div className="w-16 h-22 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50" />
              )}
            </div>
          ))}
        </div>

        {/* Pot */}
        <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
          <Coins className="w-5 h-5 text-amber-600" />
          <span className="font-bold text-amber-800">{pot} Chips</span>
        </div>
      </div>

      {/* Hand Strength Anzeige */}
      {handEvaluation && showHandStrength && (
        <motion.div 
          className="mx-auto mb-4 p-3 bg-gradient-to-r from-violet-100 to-purple-100 rounded-lg border border-violet-200 max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-violet-800">
              {getGermanHandName(handEvaluation.rank)}
            </span>
            <TrendingUp className="w-4 h-4 text-violet-600" />
          </div>
          <div className="w-full h-2 bg-violet-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${getHandStrengthPercentage(handEvaluation)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-violet-600 mt-1 text-center">
            Stärke: {Math.round(getHandStrengthPercentage(handEvaluation))}%
          </p>
        </motion.div>
      )}

      {/* Status */}
      <div className="text-center mb-4">
        {isMyTurn ? (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <p className="text-green-600 font-semibold">Du bist dran!</p>
            {currentBet > 0 && <p className="text-sm text-slate-500">(Einsatz: {currentBet})</p>}
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
          <div>
            <span className="text-sm font-medium text-slate-600">Deine Karten</span>
            {myPlayer?.chips !== undefined && (
              <p className="text-xs text-amber-600">
                {myPlayer.chips} Chips
              </p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowHandStrength(!showHandStrength)}
          >
            <Eye className="w-4 h-4 mr-1" />
            {showHandStrength ? 'Hilfe aus' : 'Hilfe an'}
          </Button>
        </div>
        
        <div className="flex justify-center gap-3 mb-4">
          {myHand.map((card) => (
            <PlayingCard key={card.id} card={card} size="lg" />
          ))}
        </div>

        {/* Aktions-Buttons */}
        {isMyTurn && (
          <motion.div 
            className="flex justify-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button variant="outline" onClick={handleFold} className="gap-2 text-red-600">
              <X className="w-4 h-4" />
              Fold
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCheck}
              disabled={currentBet > (myPlayer?.bet || 0)}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Check
            </Button>
            <Button 
              onClick={() => handleBet(10)}
              className="gap-2 bg-amber-500 hover:bg-amber-600"
            >
              <Coins className="w-4 h-4" />
              Bet 10
            </Button>
            <Button 
              onClick={() => handleBet(20)}
              className="gap-2 bg-amber-600 hover:bg-amber-700"
            >
              <Coins className="w-4 h-4" />
              Bet 20
            </Button>
          </motion.div>
        )}
      </div>

      {/* Showdown / Gewinner */}
      {bettingRound === 'showdown' && (
        <motion.div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">
              Showdown!
            </h3>
            
            <div className="space-y-3 mb-6">
              {players.filter(p => !p.folded).map((player) => {
                const eval_ = evaluatePokerHand(player.hand, communityCards);
                return (
                  <div 
                    key={player.id}
                    className="p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{player.avatar}</span>
                        <span className="font-medium">{player.name}</span>
                      </div>
                      <span className="text-sm text-violet-600">
                        {getGermanHandName(eval_.rank)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {player.hand.map((c, i) => (
                        <PlayingCard key={i} card={c} size="sm" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Button onClick={() => window.location.reload()} className="w-full">
              Neues Spiel
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
