import { useState } from 'react';
import type { GameType } from '@/types';
import { GAMES } from '@/data/games';
import { GameCard } from '@/components/game/GameCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Plus, Users, ArrowRight, Gamepad2 } from 'lucide-react';

interface HomeScreenProps {
  onCreateRoom: (gameType: GameType, playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onShowRules: (gameType: GameType) => void;
}

export function HomeScreen({ onCreateRoom, onJoinRoom, onShowRules }: HomeScreenProps) {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'join'>('create');

  const handleGameSelect = (gameType: GameType) => {
    setSelectedGame(gameType);
    setDialogMode('create');
    setShowNameDialog(true);
  };

  const handleJoinClick = () => {
    setDialogMode('join');
    setShowNameDialog(true);
  };

  const handleSubmit = () => {
    if (!playerName.trim()) return;

    if (dialogMode === 'create' && selectedGame) {
      onCreateRoom(selectedGame, playerName);
    } else if (dialogMode === 'join') {
      onJoinRoom(roomCode.toUpperCase(), playerName);
    }
    
    setShowNameDialog(false);
    setPlayerName('');
    setRoomCode('');
  };

  const gameList = Object.values(GAMES);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.section 
        className="text-center py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">
          Dein virtueller <span className="text-amber-600">Spieleabend</span>
        </h2>
        <p className="text-slate-600 max-w-xl mx-auto">
          Spiele klassische Kartenspiele mit Freunden - ganz ohne Casino-Flair, 
          dafür mit jeder Menge Spaß und sozialem Miteinander.
        </p>
      </motion.section>

      {/* Quick Actions */}
      <motion.section 
        className="flex flex-wrap justify-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => {
            setSelectedGame('uno');
            setDialogMode('create');
            setShowNameDialog(true);
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Schnelles Spiel
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="border-amber-300 hover:bg-amber-50"
          onClick={handleJoinClick}
        >
          <Users className="w-5 h-5 mr-2" />
          Raum beitreten
        </Button>
      </motion.section>

      {/* Games Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Wähle dein Spiel</h3>
          <span className="text-sm text-slate-500">{gameList.length} Spiele verfügbar</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gameList.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <GameCard
                game={game}
                onSelect={() => handleGameSelect(game.id)}
                onShowRules={() => onShowRules(game.id)}
              />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features */}
      <motion.section 
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[
          { icon: '🎮', title: 'Echtzeit-Multiplayer', desc: 'Spiele synchron mit Freunden' },
          { icon: '📱', title: 'Cross-Platform', desc: 'Auf allen Geräten spielbar' },
          { icon: '🎯', title: 'Hilfen für Einsteiger', desc: 'Lerne die Spiele Schritt für Schritt' },
        ].map((feature, i) => (
          <div 
            key={i}
            className="text-center p-4 rounded-xl bg-white/50 border border-amber-100"
          >
            <div className="text-3xl mb-2">{feature.icon}</div>
            <h4 className="font-semibold text-slate-800 mb-1">{feature.title}</h4>
            <p className="text-sm text-slate-500">{feature.desc}</p>
          </div>
        ))}
      </motion.section>

      {/* Name/Join Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogMode === 'create' ? (
                <>
                  <Gamepad2 className="w-5 h-5 text-amber-500" />
                  Raum erstellen
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 text-amber-500" />
                  Raum beitreten
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {dialogMode === 'create' && selectedGame && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{GAMES[selectedGame].icon}</span>
                  <div>
                    <p className="font-medium text-slate-800">{GAMES[selectedGame].name}</p>
                    <p className="text-xs text-slate-500">{GAMES[selectedGame].maxPlayers} Spieler max.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="playerName">Dein Name</Label>
              <Input
                id="playerName"
                placeholder="Gib deinen Namen ein"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                maxLength={20}
              />
            </div>

            {dialogMode === 'join' && (
              <div className="space-y-2">
                <Label htmlFor="roomCode">Raum-Code</Label>
                <Input
                  id="roomCode"
                  placeholder="z.B. ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  maxLength={6}
                />
              </div>
            )}

            <Button 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600"
              onClick={handleSubmit}
              disabled={!playerName.trim() || (dialogMode === 'join' && !roomCode.trim())}
            >
              {dialogMode === 'create' ? 'Raum erstellen' : 'Beitreten'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
