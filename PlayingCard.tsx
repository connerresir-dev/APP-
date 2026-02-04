import type { Card } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
  red: '●',
  blue: '●',
  green: '●',
  yellow: '●',
  wild: '★',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-slate-800',
  spades: 'text-slate-800',
  red: 'text-red-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  yellow: 'text-yellow-500',
  wild: 'text-slate-800',
};

const RANK_DISPLAY: Record<string, string> = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  'J': 'J',
  'Q': 'Q',
  'K': 'K',
  'A': 'A',
  'skip': '⊘',
  'reverse': '↻',
  'draw2': '+2',
  'draw4': '+4',
  'wild': 'W',
};

export function PlayingCard({ 
  card, 
  onClick, 
  disabled = false, 
  size = 'md',
  className,
  animate = true,
}: PlayingCardProps) {
  const sizeClasses = {
    sm: 'w-10 h-14 text-xs',
    md: 'w-16 h-22 text-sm',
    lg: 'w-24 h-34 text-lg',
  };

  const isPlayable = card.isPlayable && !disabled;

  const CardContent = () => {
    if (!card.isFaceUp) {
      // Kartenrücken
      return (
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-600 shadow-md flex items-center justify-center overflow-hidden">
          <div className="w-full h-full opacity-20" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              rgba(255,255,255,0.1) 4px,
              rgba(255,255,255,0.1) 8px
            )`,
          }} />
          <div className="absolute inset-2 border border-amber-500/30 rounded-md" />
        </div>
      );
    }

    // Kartenfront
    const isWild = card.suit === 'wild';
    const bgColor = isWild 
      ? 'bg-slate-800' 
      : ['red', 'blue', 'green', 'yellow'].includes(card.suit)
        ? `bg-${card.suit}-100`
        : 'bg-white';

    return (
      <div className={cn(
        "w-full h-full rounded-lg border-2 shadow-md flex flex-col items-center justify-between p-1",
        bgColor,
        isWild ? 'border-slate-600' : 'border-slate-300',
        isPlayable && "ring-2 ring-green-400 ring-offset-2"
      )}>
        {/* Obere linke Ecke */}
        <div className={cn("self-start leading-none font-bold", SUIT_COLORS[card.suit])}>
          <span className="block">{RANK_DISPLAY[card.rank]}</span>
          <span className="text-xs">{SUIT_SYMBOLS[card.suit]}</span>
        </div>

        {/* Mitte */}
        <div className={cn("text-2xl font-bold", SUIT_COLORS[card.suit])}>
          {card.rank === 'skip' && '⊘'}
          {card.rank === 'reverse' && '↻'}
          {card.rank === 'draw2' && '+2'}
          {card.rank === 'draw4' && '+4'}
          {card.rank === 'wild' && '★'}
          {!['skip', 'reverse', 'draw2', 'draw4', 'wild'].includes(card.rank) && SUIT_SYMBOLS[card.suit]}
        </div>

        {/* Untere rechte Ecke (gedreht) */}
        <div className={cn("self-end leading-none font-bold rotate-180", SUIT_COLORS[card.suit])}>
          <span className="block">{RANK_DISPLAY[card.rank]}</span>
          <span className="text-xs">{SUIT_SYMBOLS[card.suit]}</span>
        </div>
      </div>
    );
  };

  if (animate) {
    return (
      <motion.div
        className={cn(
          sizeClasses[size],
          "relative cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={!disabled ? onClick : undefined}
        whileHover={!disabled && isPlayable ? { scale: 1.05, y: -5 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <CardContent />
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        sizeClasses[size],
        "relative cursor-pointer select-none transition-transform",
        disabled && "opacity-50 cursor-not-allowed",
        isPlayable && "hover:-translate-y-1",
        className
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <CardContent />
    </div>
  );
}

// Kartenstapel-Komponente
interface CardStackProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function CardStack({ count, size = 'md', className, onClick }: CardStackProps) {
  const sizeClasses = {
    sm: 'w-10 h-14',
    md: 'w-16 h-22',
    lg: 'w-24 h-34',
  };

  return (
    <div 
      className={cn("relative cursor-pointer", sizeClasses[size], className)}
      onClick={onClick}
    >
      {/* Mehrere Karten für 3D-Effekt */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-600 shadow-sm transform translate-x-0.5 translate-y-0.5" />
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-600 shadow-sm transform translate-x-1 translate-y-1" />
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-600 shadow-md flex items-center justify-center">
        <span className="text-amber-200 text-xs font-bold">{count}</span>
      </div>
    </div>
  );
}

// Ablagestapel-Komponente
interface DiscardPileProps {
  cards: Card[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DiscardPile({ cards, size = 'md', className }: DiscardPileProps) {
  const topCard = cards[cards.length - 1];
  
  if (!topCard) {
    return (
      <div className={cn(
        size === 'sm' ? 'w-10 h-14' : size === 'md' ? 'w-16 h-22' : 'w-24 h-34',
        "rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 flex items-center justify-center",
        className
      )}>
        <span className="text-slate-400 text-xs">Leer</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <PlayingCard card={topCard} size={size} />
      {cards.length > 1 && (
        <div className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-xs px-1.5 py-0.5 rounded-full">
          {cards.length}
        </div>
      )}
    </div>
  );
}
