import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { GameType, Room, Player, GameState, GameAction } from '@/types';
import { toast } from 'sonner';

const SOCKET_URL = window.location.origin;

interface SocketStore {
  // Socket-Verbindung
  socket: Socket | null;
  isConnected: boolean;
  
  // Aktueller Spieler
  currentPlayer: Player | null;
  currentPlayerId: string | null;
  
  // Aktueller Raum
  currentRoom: Room | null;
  roomCode: string | null;
  
  // Spiel-Auswahl
  selectedGame: GameType | null;
  
  // Spielzustand
  gameState: GameState | null;
  
  // Custom Rules
  customRules: Record<string, boolean>;
  
  // Chat
  chatMessages: { sender: string; message: string; time: number }[];
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  createRoom: (playerName: string, gameType: GameType, settings?: Record<string, boolean>) => Promise<boolean>;
  joinRoom: (roomCode: string, playerName: string) => Promise<boolean>;
  leaveRoom: () => void;
  startGame: () => void;
  sendGameAction: (action: GameAction) => void;
  updateGameState: (gameState: GameState) => void;
  sendChatMessage: (message: string) => void;
  setCustomRules: (rules: Record<string, boolean>) => void;
  setSelectedGame: (game: GameType | null) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  // Initial State
  socket: null,
  isConnected: false,
  currentPlayer: null,
  currentPlayerId: null,
  currentRoom: null,
  roomCode: null,
  selectedGame: null,
  gameState: null,
  customRules: {},
  chatMessages: [{ sender: 'System', message: 'Willkommen!', time: Date.now() }],

  // Verbindung herstellen
  connect: () => {
    const { socket: existingSocket } = get();
    if (existingSocket?.connected) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Mit Server verbunden');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('Vom Server getrennt');
      set({ isConnected: false });
    });

    socket.on('connect_error', (error) => {
      console.error('Verbindungsfehler:', error);
      toast.error('Verbindung zum Server fehlgeschlagen');
    });

    // Spieler ist einem Raum beigetreten
    socket.on('player-joined', ({ player }) => {
      const { currentRoom } = get();
      if (!currentRoom) return;

      // Prüfe ob Spieler bereits existiert
      const exists = currentRoom.players.find(p => p.id === player.id);
      if (exists) return;

      const updatedRoom = {
        ...currentRoom,
        players: [...currentRoom.players, player]
      };
      
      set({ currentRoom: updatedRoom });
      toast.success(`${player.name} ist beigetreten!`);
    });

    // Spieler hat Raum verlassen
    socket.on('player-left', ({ playerId, players }) => {
      const { currentRoom, currentPlayer } = get();
      if (!currentRoom) return;

      const leftPlayer = currentRoom.players.find(p => p.id === playerId);
      
      set({ 
        currentRoom: { ...currentRoom, players }
      });
      
      if (leftPlayer && leftPlayer.id !== currentPlayer?.id) {
        toast.info(`${leftPlayer.name} hat den Raum verlassen`);
      }
    });

    // Spieler disconnected
    socket.on('player-disconnected', ({ playerId }) => {
      const { currentRoom } = get();
      if (!currentRoom) return;

      const player = currentRoom.players.find(p => p.id === playerId);
      if (player) {
        toast.warning(`${player.name} hat die Verbindung verloren`);
      }
    });

    // Spiel gestartet
    socket.on('game-started', ({ gameState }) => {
      const { currentRoom } = get();
      if (!currentRoom) return;

      set({ 
        gameState,
        currentRoom: { ...currentRoom, status: 'playing' }
      });
      toast.success('Spiel wurde gestartet!');
    });

    // Spielaktion empfangen
    socket.on('game-action', ({ action }) => {
      console.log('Spielaktion empfangen:', action);
    });

    // Spielzustand aktualisiert
    socket.on('game-state-updated', ({ gameState }) => {
      set({ gameState });
    });

    // Chat-Nachricht empfangen
    socket.on('chat-message', ({ sender, message, time }) => {
      set(state => ({
        chatMessages: [...state.chatMessages, { sender, message, time }]
      }));
    });

    set({ socket });
  },

  // Verbindung trennen
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  // Raum erstellen
  createRoom: async (playerName, gameType, settings = {}) => {
    const { socket } = get();
    if (!socket) {
      toast.error('Nicht mit Server verbunden');
      return false;
    }

    return new Promise((resolve) => {
      socket.emit('create-room', { playerName, gameType, settings }, (response: any) => {
        if (response.success) {
          set({
            currentRoom: response.room,
            roomCode: response.room.code,
            currentPlayerId: response.playerId,
            currentPlayer: response.room.players.find((p: Player) => p.id === response.playerId),
            selectedGame: gameType,
            chatMessages: [{ sender: 'System', message: 'Raum erstellt! Warte auf Spieler...', time: Date.now() }]
          });
          toast.success(`Raum erstellt! Code: ${response.room.code}`);
          resolve(true);
        } else {
          toast.error(response.error || 'Fehler beim Erstellen des Raums');
          resolve(false);
        }
      });
    });
  },

  // Raum beitreten
  joinRoom: async (roomCode, playerName) => {
    const { socket } = get();
    if (!socket) {
      toast.error('Nicht mit Server verbunden');
      return false;
    }

    return new Promise((resolve) => {
      socket.emit('join-room', { roomCode, playerName }, (response: any) => {
        if (response.success) {
          set({
            currentRoom: response.room,
            roomCode: response.room.code,
            currentPlayerId: response.playerId,
            currentPlayer: response.room.players.find((p: Player) => p.id === response.playerId),
            selectedGame: response.room.gameType,
            chatMessages: [{ sender: 'System', message: `Willkommen in ${response.room.name}!`, time: Date.now() }]
          });
          toast.success('Raum beigetreten!');
          resolve(true);
        } else {
          toast.error(response.error || 'Fehler beim Beitreten');
          resolve(false);
        }
      });
    });
  },

  // Raum verlassen
  leaveRoom: () => {
    const { socket, roomCode } = get();
    if (socket && roomCode) {
      socket.emit('leave-room', { roomCode });
    }
    
    set({
      currentRoom: null,
      roomCode: null,
      currentPlayer: null,
      currentPlayerId: null,
      gameState: null,
      selectedGame: null,
      chatMessages: [{ sender: 'System', message: 'Willkommen!', time: Date.now() }]
    });
  },

  // Spiel starten
  startGame: () => {
    const { socket, roomCode, currentRoom } = get();
    if (!socket || !roomCode) return;

    if (!currentRoom?.players || currentRoom.players.length < 2) {
      toast.error('Mindestens 2 Spieler benötigt');
      return;
    }

    socket.emit('start-game', { roomCode }, (response: any) => {
      if (!response.success) {
        toast.error(response.error || 'Fehler beim Starten');
      }
    });
  },

  // Spielaktion senden
  sendGameAction: (action) => {
    const { socket, roomCode } = get();
    if (socket && roomCode) {
      socket.emit('game-action', { roomCode, action });
    }
  },

  // Spielzustand aktualisieren
  updateGameState: (gameState) => {
    const { socket, roomCode } = get();
    if (socket && roomCode) {
      socket.emit('update-game-state', { roomCode, gameState });
    }
    set({ gameState });
  },

  // Chat-Nachricht senden
  sendChatMessage: (message) => {
    const { socket, roomCode } = get();
    if (socket && roomCode && message.trim()) {
      socket.emit('chat-message', { roomCode, message });
    }
  },

  setCustomRules: (rules) => set({ customRules: rules }),
  
  setSelectedGame: (game) => set({ selectedGame: game }),
}));
