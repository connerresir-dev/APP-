import type { Player } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PlayerAvatarProps {
  player: Player;
  isCurrentTurn?: boolean;
  cardCount?: number;
  showCards?: boolean;
  isWinner?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlayerAvatar({ 
  player, 
  isCurrentTurn = false, 
  cardCount,
  showCards = false,
  isWinner = false,
  size = 'md',
  className 
}: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  const statusRingSize = {
    sm: 'ring-2',
    md: 'ring-3',
    lg: 'ring-4',
  };

  return (
    <motion.div 
      className={cn("flex flex-col items-center gap-1", className)}
      animate={isCurrentTurn ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 1.5 }}
    >
      {/* Avatar */}
      <div className="relative">
        <div className={cn(
          "rounded-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 shadow-md border-2 border-amber-300",
          sizeClasses[size],
          isCurrentTurn && cn("ring-green-400 ring-offset-2", statusRingSize[size]),
          isWinner && "ring-yellow-400 ring-offset-2 ring-2"
        )}>
          {player.avatar}
        </div>
        
        {/* Host Badge */}
        {player.isHost && (
          <div className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">
            H
          </div>
        )}
        
        {/* Online/Offline Indicator */}
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
          player.isConnected ? "bg-green-500" : "bg-red-500"
        )} />
        
        {/* Winner Crown */}
        {isWinner && (
          <motion.div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl"
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            👑
          </motion.div>
        )}
      </div>
      
      {/* Name */}
      <span className={cn(
        "text-xs font-medium truncate max-w-20 text-center",
        isCurrentTurn ? "text-green-600 font-semibold" : "text-slate-600"
      )}>
        {player.name}
      </span>
      
      {/* Kartenanzahl */}
      {cardCount !== undefined && !showCards && (
        <span className="text-xs text-slate-400">
          {cardCount} {cardCount === 1 ? 'Karte' : 'Karten'}
        </span>
      )}
    </motion.div>
  );
}

// Spieler-Liste für Lobby
interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  maxPlayers: number;
  className?: string;
}

export function PlayerList({ players, currentPlayerId, maxPlayers, className }: PlayerListProps) {
  const emptySlots = maxPlayers - players.length;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Spieler</span>
        <span>{players.length} / {maxPlayers}</span>
      </div>
      
      <div className="space-y-2">
        {players.map((player) => (
          <div 
            key={player.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg border",
              player.id === currentPlayerId 
                ? "bg-green-50 border-green-200" 
                : "bg-white border-slate-200"
            )}
          >
            <span className="text-xl">{player.avatar}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {player.name}
                {player.id === currentPlayerId && (
                  <span className="text-green-600 text-xs ml-1">(Du)</span>
                )}
              </p>
              <p className="text-xs text-slate-400">
                {player.isHost ? 'Host' : 'Spieler'}
              </p>
            </div>
            <div className={cn(
              "w-2 h-2 rounded-full",
              player.isConnected ? "bg-green-500" : "bg-red-500"
            )} />
          </div>
        ))}
        
        {/* Leere Plätze */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div 
            key={`empty-${i}`}
            className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-slate-200 bg-slate-50"
          >
            <span className="text-xl text-slate-300">?</span>
            <span className="text-sm text-slate-400">Warte auf Spieler...</span>
          </div>
        ))}
      </div>
    </div>
  );
}
