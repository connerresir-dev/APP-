import { useState } from 'react';
import type { Room, Player, GameState, Suit, Card } from '@/types';
import { PlayingCard, CardStack, DiscardPile } from '@/components/cards/PlayingCard';
import { PlayerAvatar } from '@/components/game/PlayerAvatar';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { isUnoCardPlayable, drawCards } from '@/utils/deck';
import { toast } from 'sonner';

interface UnoGameProps {
  room: Room;
  currentPlayer: Player | null;
  gameState: GameState;
}

const SUIT_COLORS: Record<Suit, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  wild: 'bg-slate-800',
  hearts: 'bg-red-500',
  diamonds: 'bg-red-500',
  clubs: 'bg-slate-800',
  spades: 'bg-slate-800',
};

const SUIT_NAMES: Record<Suit, string> = {
  red: 'Rot',
  blue: 'Blau',
  green: 'Grün',
  yellow: 'Gelb',
  wild: 'Wild',
  hearts: 'Herz',
  diamonds: 'Karo',
  clubs: 'Kreuz',
  spades: 'Pik',
};

export function UnoGame({ currentPlayer, gameState }: UnoGameProps) {
  const [selectedColor, setSelectedColor] = useState<Suit | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);
  const [saidUno, setSaidUno] = useState(false);

  const currentPlayerIndex = gameState.currentPlayerIndex;
  const isMyTurn = currentPlayer?.id === gameState.players[currentPlayerIndex]?.id;
  
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const currentColor = selectedColor || topCard?.suit || 'red';
  const pendingDrawCards = (gameState as { pendingDrawCards?: number }).pendingDrawCards || 0;

  // Finde meinen Spieler-Index
  const myPlayerIndex = gameState.players.findIndex(p => p.id === currentPlayer?.id);
  const myPlayer = myPlayerIndex >= 0 ? gameState.players[myPlayerIndex] : null;
  const myHand = myPlayer?.hand || [];

  // Markiere spielbare Karten
  const handWithPlayable = myHand.map(card => ({
    ...card,
    isPlayable: isMyTurn && isUnoCardPlayable(card, topCard, currentColor, pendingDrawCards),
  }));

  const handlePlayCard = (card: Card & { isPlayable?: boolean }) => {
    if (!isMyTurn || !card.isPlayable) return;

    // Bei wilder Karte: Farbe wählen
    if (card.suit === 'wild') {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }

    playCard(card);
  };

  const playCard = (card: Card, chosenColor?: Suit) => {
    if (!myPlayer) return;

    // Entferne Karte aus Hand
    myPlayer.hand = myPlayer.hand.filter(c => c.id !== card.id);
    
    // Füge zu Ablagestapel hinzu
    gameState.discardPile.push({ ...card, isFaceUp: true });
    
    // Aktionskarten-Effekte
    if (card.rank === 'reverse') {
      gameState.direction = gameState.direction === 1 ? -1 : 1;
    }
    
    if (card.rank === 'skip') {
      // Überspringe nächsten Spieler
      const playerCount = gameState.players.length;
      gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.direction + playerCount) % playerCount;
    }
    
    if (card.rank === 'draw2') {
      (gameState as { pendingDrawCards?: number }).pendingDrawCards = (pendingDrawCards || 0) + 2;
    }
    
    if (card.rank === 'draw4') {
      (gameState as { pendingDrawCards?: number }).pendingDrawCards = (pendingDrawCards || 0) + 4;
      if (chosenColor) {
        setSelectedColor(chosenColor);
      }
    }
    
    // Nächster Spieler
    const playerCount = gameState.players.length;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.direction + playerCount) % playerCount;
    
    // Prüfe auf Gewinner
    if (myPlayer.hand.length === 0) {
      gameState.winner = myPlayer.id;
      gameState.status = 'finished';
      toast.success(`${myPlayer.name} hat gewonnen!`);
    }
    
    // Force re-render
    setShowColorPicker(false);
    setPendingWildCard(null);
  };

  const handleDrawCard = () => {
    if (!isMyTurn || !myPlayer) return;

    if (pendingDrawCards > 0) {
      // Muss Karten ziehen
      const { cards, remainingDeck } = drawCards(gameState.deck, pendingDrawCards);
      myPlayer.hand.push(...cards.map(c => ({ ...c, isFaceUp: true })));
      gameState.deck = remainingDeck;
      (gameState as { pendingDrawCards?: number }).pendingDrawCards = 0;
      
      toast.info(`Du hast ${pendingDrawCards} Karten gezogen`);
    } else {
      // Normales Ziehen
      const { cards, remainingDeck } = drawCards(gameState.deck, 1);
      myPlayer.hand.push(...cards.map(c => ({ ...c, isFaceUp: true })));
      gameState.deck = remainingDeck;
    }
    
    // Nächster Spieler
    const playerCount = gameState.players.length;
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + gameState.direction + playerCount) % playerCount;
    
    // Force re-render
    setSaidUno(false);
  };

  const handleSayUno = () => {
    if (myPlayer && myPlayer.hand.length === 2) {
      setSaidUno(true);
      toast.success('UNO!');
    }
  };

  // Andere Spieler anzeigen
  const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer?.id);

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Gegner (oben) */}
      <div className="flex justify-center gap-4 mb-6">
        {otherPlayers.map((player) => (
          <PlayerAvatar
            key={player.id}
            player={player}
            isCurrentTurn={gameState.players[currentPlayerIndex]?.id === player.id}
            cardCount={player.hand.length}
            size="sm"
          />
        ))}
      </div>

      {/* Spielfeld (Mitte) */}
      <div className="flex-1 flex items-center justify-center gap-8 mb-6">
        {/* Nachziehstapel */}
        <div className="flex flex-col items-center gap-2">
          <CardStack 
            count={gameState.deck.length} 
            onClick={isMyTurn ? handleDrawCard : undefined}
          />
          <span className="text-xs text-slate-500">Ziehen</span>
        </div>

        {/* Aktuelle Farbe */}
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            "w-12 h-12 rounded-full border-4 border-white shadow-lg",
            SUIT_COLORS[currentColor]
          )} />
          <span className="text-xs text-slate-500">{SUIT_NAMES[currentColor]}</span>
        </div>

        {/* Ablagestapel */}
        <div className="flex flex-col items-center gap-2">
          <DiscardPile cards={gameState.discardPile} />
          <span className="text-xs text-slate-500">Ablage</span>
        </div>
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
            {gameState.players[currentPlayerIndex]?.name} ist dran...
          </p>
        )}
        
        {pendingDrawCards > 0 && (
          <p className="text-red-500 text-sm mt-1">
            +{pendingDrawCards} Karten warten!
          </p>
        )}
      </div>

      {/* Meine Hand (unten) */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-600">
            Deine Karten ({myHand.length})
          </span>
          {myHand.length === 2 && !saidUno && (
            <Button 
              size="sm"
              onClick={handleSayUno}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              UNO!
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap justify-center gap-2">
          {handWithPlayable.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PlayingCard
                card={card}
                onClick={() => handlePlayCard(card)}
                disabled={!card.isPlayable}
                size="md"
              />
            </motion.div>
          ))}
        </div>
        
        {isMyTurn && handWithPlayable.every(c => !c.isPlayable) && (
          <div className="text-center mt-4">
            <Button onClick={handleDrawCard} variant="outline">
              Karte ziehen
            </Button>
          </div>
        )}
      </div>

      {/* Farbwahl-Dialog */}
      {showColorPicker && pendingWildCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-xl p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">
              Wähle eine Farbe
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(['red', 'blue', 'green', 'yellow'] as Suit[]).map((color) => (
                <button
                  key={color}
                  className={cn(
                    "w-20 h-20 rounded-xl shadow-lg transition-transform hover:scale-105",
                    SUIT_COLORS[color]
                  )}
                  onClick={() => playCard(pendingWildCard, color)}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Gewinner-Anzeige */}
      {gameState.winner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-xl p-8 text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {gameState.players.find(p => p.id === gameState.winner)?.name} gewinnt!
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
