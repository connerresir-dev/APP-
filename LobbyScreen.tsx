import type { Room, Player, GameType } from '@/types';
import { GAMES } from '@/data/games';
import { PlayerList } from '@/components/game/PlayerAvatar';
import { CompactGameCard } from '@/components/game/GameCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { 
  Play, 
  Share2, 
  Copy, 
  Check, 
  Settings,
  Users,
  MessageSquare,
  Crown,
  ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSocketStore } from '@/store/socketStore';

interface LobbyScreenProps {
  room: Room;
  currentPlayer: Player | null;
  onStartGame: () => void;
  onShowRules: (gameType: GameType) => void;
}

export function LobbyScreen({ room, currentPlayer, onStartGame, onShowRules }: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  const { chatMessages, sendChatMessage, roomCode } = useSocketStore();

  const selectedGame = room.gameType ? GAMES[room.gameType] : null;
  const isHost = currentPlayer?.isHost ?? false;
  const canStart = room.players.length >= (selectedGame?.minPlayers ?? 2);
  const isFull = room.players.length >= (selectedGame?.maxPlayers ?? 8);

  const handleCopyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast.success('Code kopiert!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Kartenspiel-Plattform',
      text: `Trete meinem Spiel bei! Raum-Code: ${roomCode}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      handleCopyCode();
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendChatMessage(chatMessage);
      setChatMessage('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Room Info & Players */}
      <motion.div 
        className="lg:col-span-2 space-y-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {/* Room Header */}
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {room.name}
                  {isHost && <Crown className="w-5 h-5 text-amber-500" />}
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Erstellt {new Date(room.createdAt).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
              <div className="flex-1">
                <Label className="text-xs text-amber-700">Raum-Code</Label>
                <p className="text-2xl font-bold text-amber-800 tracking-widest">{roomCode}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyCode}
                className={cn(
                  "gap-2",
                  copied && "bg-green-100 border-green-300 text-green-700"
                )}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Kopiert' : 'Kopieren'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game Selection - Nur für Host wenn noch kein Spiel gewählt */}
        {isHost && !room.gameType && (
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" />
                Spiel wählen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(GAMES).map((game) => (
                  <CompactGameCard
                    key={game.id}
                    game={game}
                    isSelected={room.gameType === game.id}
                    onClick={() => {
                      // Nur lokal ändern, Backend-Update wäre nötig
                      room.gameType = game.id;
                    }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Game Info */}
        {selectedGame && (
          <Card className={cn("border-2 border-amber-200")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center text-3xl",
                  selectedGame.color
                )}>
                  {selectedGame.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800">{selectedGame.name}</h3>
                  <p className="text-sm text-slate-500">{selectedGame.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {selectedGame.minPlayers}-{selectedGame.maxPlayers} Spieler
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => onShowRules(room.gameType!)}
                >
                  Regeln
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Players */}
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Spieler ({room.players.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerList 
              players={room.players}
              currentPlayerId={currentPlayer?.id}
              maxPlayers={selectedGame?.maxPlayers ?? 8}
            />
            
            {isFull && (
              <p className="text-sm text-amber-600 mt-3 text-center">
                Raum ist voll!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Start Button */}
        {isHost && selectedGame && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              size="lg"
              className={cn(
                "w-full text-lg py-6",
                "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              )}
              onClick={onStartGame}
              disabled={!canStart}
            >
              <Play className="w-5 h-5 mr-2" />
              {canStart ? 'Spiel starten' : `Warte auf ${selectedGame.minPlayers - room.players.length} Spieler...`}
            </Button>
            
            {!canStart && (
              <p className="text-sm text-slate-500 text-center mt-2">
                Mindestens {selectedGame.minPlayers} Spieler benötigt
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Right Column - Chat */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card className="border-amber-200 h-[500px] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="space-y-3">
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "text-sm",
                      msg.sender === 'System' && "text-amber-600 italic"
                    )}
                  >
                    {msg.sender !== 'System' && (
                      <span className="font-medium text-slate-700">{msg.sender}: </span>
                    )}
                    <span className={msg.sender === 'System' ? '' : 'text-slate-600'}>
                      {msg.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
              <Input
                placeholder="Nachricht schreiben..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} size="icon">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
