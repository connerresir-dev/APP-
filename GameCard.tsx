import type { GameInfo } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Users, Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameCardProps {
  game: GameInfo;
  onSelect: () => void;
  onShowRules: () => void;
  className?: string;
}

export function GameCard({ game, onSelect, onShowRules, className }: GameCardProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white shadow-lg border border-slate-200",
        "hover:shadow-xl transition-shadow duration-300",
        className
      )}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header mit Gradient */}
      <div className={cn(
        "h-24 bg-gradient-to-br p-4 flex items-start justify-between",
        game.color
      )}>
        <div className="text-4xl">{game.icon}</div>
        <div className="flex items-center gap-1 text-white/90 text-sm">
          <Users className="w-4 h-4" />
          <span>{game.minPlayers}-{game.maxPlayers}</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-800 mb-1">{game.name}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4">{game.description}</p>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={onSelect}
            className={cn(
              "flex-1 bg-gradient-to-r text-white",
              game.color
            )}
          >
            <Play className="w-4 h-4 mr-2" />
            Spielen
          </Button>
          <Button 
            variant="outline"
            onClick={onShowRules}
            className="px-3"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Kompakte Game-Card für Lobby
interface CompactGameCardProps {
  game: GameInfo;
  isSelected?: boolean;
  onClick: () => void;
  className?: string;
}

export function CompactGameCard({ game, isSelected, onClick, className }: CompactGameCardProps) {
  return (
    <motion.button
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full",
        isSelected 
          ? cn("border-transparent bg-gradient-to-r text-white", game.color)
          : "border-slate-200 bg-white hover:border-slate-300",
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-2xl">{game.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold truncate",
          isSelected ? "text-white" : "text-slate-800"
        )}>
          {game.name}
        </p>
        <p className={cn(
          "text-xs truncate",
          isSelected ? "text-white/80" : "text-slate-500"
        )}>
          {game.maxPlayers} Spieler max.
        </p>
      </div>
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center"
        >
          <div className="w-2 h-2 rounded-full bg-white" />
        </motion.div>
      )}
    </motion.button>
  );
}
