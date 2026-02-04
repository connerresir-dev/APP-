import { useEffect, useState } from 'react';
import { useSocketStore } from '@/store/socketStore';
import type { GameType } from '@/types';
import { GAMES } from '@/data/games';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Screens
import { HomeScreen } from '@/screens/HomeScreen';
import { LobbyScreen } from '@/screens/LobbyScreen';
import { GameScreen } from '@/screens/GameScreen';
import { RulesModal } from '@/components/game/RulesModal';

// Styles
import './App.css';

function App() {
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesGameType, setRulesGameType] = useState<GameType | null>(null);
  
  const { 
    connect,
    disconnect,
    isConnected,
    currentRoom, 
    currentPlayer,
    roomCode,
    gameState,
    customRules,
    setCustomRules,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
  } = useSocketStore();

  // Verbindung beim Start herstellen
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  // Verbindungsstatus anzeigen
  useEffect(() => {
    if (!isConnected) {
      toast.warning('Verbindung zum Server verloren...', {
        duration: 5000,
      });
    }
  }, [isConnected]);

  const handleCreateRoom = async (gameType: GameType, playerName: string) => {
    const success = await createRoom(playerName, gameType, customRules);
    if (!success) {
      toast.error('Raum konnte nicht erstellt werden');
    }
  };

  const handleJoinRoom = async (roomCode: string, playerName: string) => {
    const success = await joinRoom(roomCode, playerName);
    if (!success) {
      toast.error('Raum konnte nicht beigetreten werden');
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    toast.info('Du hast den Raum verlassen');
  };

  const handleStartGame = () => {
    if (!currentRoom) return;
    
    const gameInfo = currentRoom.gameType ? GAMES[currentRoom.gameType] : null;
    if (!gameInfo) return;

    if (currentRoom.players.length < gameInfo.minPlayers) {
      toast.error(`Mindestens ${gameInfo.minPlayers} Spieler benötigt`);
      return;
    }

    startGame();
  };

  const handleShowRules = (gameType: GameType) => {
    setRulesGameType(gameType);
    setShowRulesModal(true);
  };

  const handleCustomRuleChange = (ruleId: string, value: boolean) => {
    setCustomRules({ ...customRules, [ruleId]: value });
  };

  // Bestimme aktuellen Screen
  const getCurrentScreen = () => {
    if (gameState && currentRoom?.status === 'playing') {
      return 'game';
    }
    if (currentRoom) {
      return 'lobby';
    }
    return 'home';
  };

  const currentScreen = getCurrentScreen();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl shadow-md">
              🃏
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">Kartenspiele</h1>
              <p className="text-xs text-slate-500">
                {isConnected ? '🟢 Online' : '🔴 Offline'}
              </p>
            </div>
          </div>
          
          {currentRoom && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-lg">
                <span className="text-xs text-amber-700 font-medium">Raum-Code:</span>
                <span className="text-sm font-bold text-amber-800 tracking-wider">{roomCode}</span>
              </div>
              <button
                onClick={handleLeaveRoom}
                className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
              >
                Verlassen
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {currentScreen === 'home' && (
          <HomeScreen 
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onShowRules={handleShowRules}
          />
        )}
        
        {currentScreen === 'lobby' && currentRoom && (
          <LobbyScreen 
            room={currentRoom}
            currentPlayer={currentPlayer}
            onStartGame={handleStartGame}
            onShowRules={handleShowRules}
          />
        )}
        
        {currentScreen === 'game' && currentRoom && gameState && (
          <GameScreen 
            room={currentRoom}
            currentPlayer={currentPlayer}
            gameState={gameState}
          />
        )}
      </main>

      {/* Rules Modal */}
      {rulesGameType && (
        <RulesModal
          gameType={rulesGameType}
          isOpen={showRulesModal}
          onClose={() => setShowRulesModal(false)}
          customRules={customRules}
          onCustomRuleChange={handleCustomRuleChange}
        />
      )}

      {/* Toast Container */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e2e8f0',
          },
        }}
      />
    </div>
  );
}

export default App;
