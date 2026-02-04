import type { Room, Player, GameState } from '@/types';
import { GAMES } from '@/data/games';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, RotateCcw, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSocketStore } from '@/store/socketStore';

// Game Components
import { UnoGame } from '@/games/UnoGame';
import { BlackjackGame } from '@/games/BlackjackGame';
import { SchwimmenGame } from '@/games/SchwimmenGame';
import { PokerGame } from '@/games/PokerGame';
import { BullshitGame } from '@/games/BullshitGame';
import { RulesModal } from '@/components/game/RulesModal';

interface GameScreenProps {
  room: Room;
  currentPlayer: Player | null;
  gameState: GameState;
}

export function GameScreen({ room, currentPlayer, gameState }: GameScreenProps) {
  const [showRules, setShowRules] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  
  const { leaveRoom, updateGameState } = useSocketStore();

  const gameInfo = room.gameType ? GAMES[room.gameType] : null;

  if (!gameInfo) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">Spiel wird geladen...</p>
      </div>
    );
  }

  const handleLeaveGame = () => {
    setShowConfirmLeave(true);
  };

  const handleConfirmLeave = () => {
    leaveRoom();
    setShowConfirmLeave(false);
  };

  const handleRestartGame = () => {
    window.location.reload();
  };

  // Rendere das entsprechende Spiel
  const renderGame = () => {
    const commonProps = {
      room,
      currentPlayer,
      gameState,
      onUpdateGameState: updateGameState,
    };

    switch (room.gameType) {
      case 'uno':
        return <UnoGame {...commonProps} />;
      case 'blackjack':
        return <BlackjackGame {...commonProps} />;
      case 'schwimmen':
        return <SchwimmenGame {...commonProps} />;
      case 'poker':
        return <PokerGame {...commonProps} />;
      case 'bullshit':
        return <BullshitGame {...commonProps} />;
      default:
        return <div className="text-center py-20">Spiel nicht implementiert</div>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Game Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLeaveGame}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Verlassen
          </Button>
          
          <div className={cn(
            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-xl",
            gameInfo.color
          )}>
            {gameInfo.icon}
          </div>
          
          <div>
            <h2 className="font-bold text-slate-800">{gameInfo.name}</h2>
            <p className="text-xs text-slate-500">Runde {gameState.round}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowRules(true)}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Regeln
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRestartGame}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Neu starten
          </Button>
        </div>
      </motion.div>

      {/* Game Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-amber-200 min-h-[500px]">
          <CardContent className="p-4">
            {renderGame()}
          </CardContent>
        </Card>
      </motion.div>

      {/* Rules Modal */}
      {room.gameType && (
        <RulesModal
          gameType={room.gameType}
          isOpen={showRules}
          onClose={() => setShowRules(false)}
          customRules={room.settings.customRules as Record<string, boolean>}
          onCustomRuleChange={() => {}}
          readOnly
        />
      )}

      {/* Confirm Leave Dialog */}
      {showConfirmLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-xl p-6 max-w-sm mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-lg font-bold text-slate-800 mb-2">Spiel verlassen?</h3>
            <p className="text-slate-600 mb-4">
              Möchtest du das Spiel wirklich verlassen?
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowConfirmLeave(false)}
              >
                Abbrechen
              </Button>
              <Button 
                variant="destructive"
                className="flex-1"
                onClick={handleConfirmLeave}
              >
                Verlassen
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
