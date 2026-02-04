import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  GameType, 
  Room, 
  Player, 
  GameState, 
  GameAction, 
  RoomSettings,
} from '@/types';
import { GAMES } from '@/data/games';
import { createDeck, drawCards } from '@/utils/deck';
import { v4 as uuidv4 } from 'uuid';

interface GameStore {
  // Aktueller Spieler
  currentPlayer: Player | null;
  setCurrentPlayer: (player: Player | null) => void;
  
  // Aktueller Raum
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;
  
  // Spiel-Auswahl
  selectedGame: GameType | null;
  setSelectedGame: (game: GameType | null) => void;
  
  // Raum erstellen
  createRoom: (name: string, gameType: GameType, settings?: Partial<RoomSettings>) => Room;
  
  // Raum beitreten
  joinRoom: (roomCode: string, playerName: string) => boolean;
  
  // Raum verlassen
  leaveRoom: () => void;
  
  // Spiel starten
  startGame: () => void;
  
  // Spielaktion
  performAction: (action: GameAction) => void;
  
  // Spielzustand aktualisieren
  updateGameState: (updater: (state: GameState) => GameState) => void;
  
  // Custom Rules
  customRules: Record<string, boolean>;
  setCustomRules: (rules: Record<string, boolean>) => void;
  
  // Spiel-Historie
  gameHistory: GameAction[];
  addToHistory: (action: GameAction) => void;
  
  // UI State
  showRules: boolean;
  setShowRules: (show: boolean) => void;
}

// Generiere Raum-Code
function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generiere zufälligen Avatar
function getRandomAvatar(): string {
  const avatars = ['🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐙', '🦄', '🦉', '🐺', '🐗', '🐴'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial State
      currentPlayer: null,
      currentRoom: null,
      selectedGame: null,
      customRules: {},
      gameHistory: [],
      showRules: false,

      // Actions
      setCurrentPlayer: (player) => set({ currentPlayer: player }),
      
      setCurrentRoom: (room) => set({ currentRoom: room }),
      
      setSelectedGame: (game) => set({ selectedGame: game }),

      createRoom: (name, gameType, settings = {}) => {
        const playerId = uuidv4();
        const host: Player = {
          id: playerId,
          name: 'Spieler 1',
          avatar: getRandomAvatar(),
          isHost: true,
          isConnected: true,
          joinedAt: Date.now(),
        };

        const room: Room = {
          id: uuidv4(),
          code: generateRoomCode(),
          name,
          hostId: playerId,
          players: [host],
          gameType,
          gameState: null,
          settings: {
            maxPlayers: GAMES[gameType].maxPlayers,
            customRules: settings.customRules || {},
          },
          createdAt: Date.now(),
          status: 'waiting',
        };

        set({ 
          currentPlayer: host,
          currentRoom: room,
          selectedGame: gameType,
        });

        return room;
      },

      joinRoom: (roomCode, playerName) => {
        const { currentRoom } = get();
        
        if (!currentRoom) {
          // Simuliere beitreten zu einem neuen Raum
          const newRoom: Room = {
            id: uuidv4(),
            code: roomCode,
            name: 'Spiel-Raum',
            hostId: 'host-1',
            players: [
              {
                id: 'host-1',
                name: 'Host',
                avatar: '🦊',
                isHost: true,
                isConnected: true,
                joinedAt: Date.now(),
              },
            ],
            gameType: null,
            gameState: null,
            settings: {
              maxPlayers: 8,
              customRules: {},
            },
            createdAt: Date.now(),
            status: 'waiting',
          };

          const newPlayer: Player = {
            id: uuidv4(),
            name: playerName,
            avatar: getRandomAvatar(),
            isHost: false,
            isConnected: true,
            joinedAt: Date.now(),
          };

          newRoom.players.push(newPlayer);
          
          set({ 
            currentRoom: newRoom,
            currentPlayer: newPlayer,
          });
          
          return true;
        }

        // Raum existiert bereits
        if (currentRoom.code !== roomCode) {
          return false;
        }

        if (currentRoom.players.length >= currentRoom.settings.maxPlayers) {
          return false;
        }

        const newPlayer: Player = {
          id: uuidv4(),
          name: playerName,
          avatar: getRandomAvatar(),
          isHost: false,
          isConnected: true,
          joinedAt: Date.now(),
        };

        currentRoom.players.push(newPlayer);
        
        set({ 
          currentRoom: { ...currentRoom },
          currentPlayer: newPlayer,
        });

        return true;
      },

      leaveRoom: () => {
        const { currentRoom, currentPlayer } = get();
        
        if (currentRoom && currentPlayer) {
          const updatedPlayers = currentRoom.players.filter(p => p.id !== currentPlayer.id);
          
          if (updatedPlayers.length === 0) {
            // Raum ist leer
            set({ currentRoom: null, currentPlayer: null, selectedGame: null });
          } else {
            // Wenn Host geht, neuen Host bestimmen
            if (currentPlayer.isHost && updatedPlayers.length > 0) {
              updatedPlayers[0].isHost = true;
              currentRoom.hostId = updatedPlayers[0].id;
            }
            
            currentRoom.players = updatedPlayers;
            set({ 
              currentRoom: { ...currentRoom },
              currentPlayer: null,
              selectedGame: null,
            });
          }
        }
      },

      startGame: () => {
        const { currentRoom, selectedGame } = get();
        
        if (!currentRoom || !selectedGame) return;

        const deck = createDeck(selectedGame);
        
        // Initialisiere Spieler mit leeren Händen
        const gamePlayers = currentRoom.players.map((p) => ({
          ...p,
          hand: [] as Card[],
          score: 0,
          isActive: true,
          chips: selectedGame === 'poker' ? 1000 : undefined,
          folded: selectedGame === 'poker' ? false : undefined,
          bet: 0,
        }));

        // Verteile Karten je nach Spiel
        let remainingDeck = deck;
        
        switch (selectedGame) {
          case 'uno':
            // 7 Karten pro Spieler
            for (const player of gamePlayers) {
              const { cards, remainingDeck: newDeck } = drawCards(remainingDeck, 7);
              player.hand = cards.map(c => ({ ...c, isFaceUp: true }));
              remainingDeck = newDeck;
            }
            break;
            
          case 'schwimmen':
            // 3 Karten pro Spieler
            for (const player of gamePlayers) {
              const { cards, remainingDeck: newDeck } = drawCards(remainingDeck, 3);
              player.hand = cards.map(c => ({ ...c, isFaceUp: true }));
              remainingDeck = newDeck;
            }
            break;
            
          case 'blackjack':
            // 2 Karten pro Spieler
            for (const player of gamePlayers) {
              const { cards, remainingDeck: newDeck } = drawCards(remainingDeck, 2);
              player.hand = cards.map(c => ({ ...c, isFaceUp: true }));
              remainingDeck = newDeck;
            }
            break;
            
          case 'poker':
            // 2 Karten pro Spieler (Hole Cards)
            for (const player of gamePlayers) {
              const { cards, remainingDeck: newDeck } = drawCards(remainingDeck, 2);
              player.hand = cards.map(c => ({ ...c, isFaceUp: true }));
              remainingDeck = newDeck;
            }
            break;
            
          case 'bullshit':
            // Alle Karten gleichmäßig verteilen
            const cardsPerPlayer = Math.floor(deck.length / gamePlayers.length);
            for (const player of gamePlayers) {
              const { cards, remainingDeck: newDeck } = drawCards(remainingDeck, cardsPerPlayer);
              player.hand = cards.map(c => ({ ...c, isFaceUp: true }));
              remainingDeck = newDeck;
            }
            break;
        }

        // Erste Karte für Ablagestapel (außer bei Bullshit)
        let discardPile: Card[] = [];
        if (selectedGame !== 'bullshit') {
          const { cards, remainingDeck: newDeck } = drawCards(remainingDeck, 1);
          discardPile = cards.map(c => ({ ...c, isFaceUp: true }));
          remainingDeck = newDeck;
        }

        const gameState: GameState = {
          currentPlayerIndex: 0,
          players: gamePlayers,
          deck: remainingDeck,
          discardPile,
          round: 1,
          status: 'playing',
          winner: null,
          direction: 1,
          lastAction: null,
        };

        currentRoom.gameState = gameState;
        currentRoom.status = 'playing';

        set({ 
          currentRoom: { ...currentRoom },
          gameHistory: [],
        });
      },

      performAction: (action) => {
        const { currentRoom, addToHistory } = get();
        if (!currentRoom?.gameState) return;

        addToHistory(action);
        
        // Aktualisiere den Spielzustand basierend auf der Aktion
        const { updateGameState } = get();
        updateGameState((state) => {
          const newState = { ...state };
          newState.lastAction = action;
          
          // Nächster Spieler
          if (action.type !== 'bet' && action.type !== 'check') {
            const playerCount = newState.players.length;
            newState.currentPlayerIndex = (newState.currentPlayerIndex + newState.direction + playerCount) % playerCount;
          }
          
          return newState;
        });
      },

      updateGameState: (updater) => {
        const { currentRoom } = get();
        if (!currentRoom) return;

        if (currentRoom.gameState) {
          currentRoom.gameState = updater(currentRoom.gameState);
          set({ currentRoom: { ...currentRoom } });
        }
      },

      setCustomRules: (rules) => set({ customRules: rules }),

      addToHistory: (action) => {
        set((state) => ({
          gameHistory: [...state.gameHistory, action],
        }));
      },

      setShowRules: (show) => set({ showRules: show }),
    }),
    {
      name: 'card-game-storage',
      partialize: (state) => ({
        currentPlayer: state.currentPlayer,
        customRules: state.customRules,
      }),
    }
  )
);

// Type import for Card
type Card = import('@/types').Card;
