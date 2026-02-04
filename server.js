const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = createServer(app);

// CORS für alle Origins erlauben
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Statische Dateien aus dem dist-Ordner servieren
app.use(express.static(path.join(__dirname, 'dist')));

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// In-Memory Speicher für Räume
const rooms = new Map();

// Hilfsfunktion: Generiere Raum-Code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Hilfsfunktion: Zufälliger Avatar
function getRandomAvatar() {
  const avatars = ['🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐙', '🦄', '🦉', '🐺', '🐗', '🐴'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

// Socket.io Verbindung
io.on('connection', (socket) => {
  console.log('Neuer Client verbunden:', socket.id);

  // Raum erstellen
  socket.on('create-room', ({ playerName, gameType, settings }, callback) => {
    const roomCode = generateRoomCode();
    const playerId = uuidv4();
    
    const room = {
      id: uuidv4(),
      code: roomCode,
      name: `${playerName}'s Spiel`,
      hostId: playerId,
      gameType,
      players: [{
        id: playerId,
        socketId: socket.id,
        name: playerName,
        avatar: getRandomAvatar(),
        isHost: true,
        isConnected: true,
        joinedAt: Date.now()
      }],
      settings: settings || {},
      gameState: null,
      status: 'waiting',
      createdAt: Date.now()
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    
    console.log(`Raum ${roomCode} erstellt von ${playerName}`);
    
    callback({
      success: true,
      room: {
        ...room,
        players: room.players.map(p => ({ ...p, socketId: undefined }))
      },
      playerId
    });
  });

  // Raum beitreten
  socket.on('join-room', ({ roomCode, playerName }, callback) => {
    const room = rooms.get(roomCode.toUpperCase());
    
    if (!room) {
      callback({ success: false, error: 'Raum nicht gefunden' });
      return;
    }

    if (room.players.length >= 10) {
      callback({ success: false, error: 'Raum ist voll' });
      return;
    }

    if (room.status === 'playing') {
      callback({ success: false, error: 'Spiel läuft bereits' });
      return;
    }

    const playerId = uuidv4();
    const player = {
      id: playerId,
      socketId: socket.id,
      name: playerName,
      avatar: getRandomAvatar(),
      isHost: false,
      isConnected: true,
      joinedAt: Date.now()
    };

    room.players.push(player);
    socket.join(roomCode);
    
    console.log(`${playerName} ist Raum ${roomCode} beigetreten`);
    
    // Informiere andere Spieler
    socket.to(roomCode).emit('player-joined', {
      player: { ...player, socketId: undefined }
    });
    
    callback({
      success: true,
      room: {
        ...room,
        players: room.players.map(p => ({ ...p, socketId: undefined }))
      },
      playerId
    });
  });

  // Spiel starten
  socket.on('start-game', ({ roomCode }, callback) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      callback({ success: false, error: 'Raum nicht gefunden' });
      return;
    }

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player || !player.isHost) {
      callback({ success: false, error: 'Nur der Host kann das Spiel starten' });
      return;
    }

    room.status = 'playing';
    room.gameState = {
      currentPlayerIndex: 0,
      players: room.players.map(p => ({
        ...p,
        hand: [],
        score: 0,
        isActive: true
      })),
      deck: [],
      discardPile: [],
      round: 1,
      status: 'playing',
      winner: null,
      direction: 1,
      lastAction: null
    };

    // Informiere alle Spieler
    io.to(roomCode).emit('game-started', {
      gameState: room.gameState
    });
    
    console.log(`Spiel in Raum ${roomCode} gestartet`);
    
    callback({ success: true });
  });

  // Spielaktion
  socket.on('game-action', ({ roomCode, action }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState) return;

    // Aktualisiere Spielzustand
    room.gameState.lastAction = action;
    
    // Weiterleiten an alle anderen Spieler
    socket.to(roomCode).emit('game-action', { action });
  });

  // Spielzustand aktualisieren
  socket.on('update-game-state', ({ roomCode, gameState: newState }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.gameState = newState;
    
    // An alle anderen Spieler senden
    socket.to(roomCode).emit('game-state-updated', { gameState: newState });
  });

  // Chat-Nachricht
  socket.on('chat-message', ({ roomCode, message }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;

    io.to(roomCode).emit('chat-message', {
      sender: player.name,
      message,
      time: Date.now()
    });
  });

  // Raum verlassen
  socket.on('leave-room', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    
    socket.leave(roomCode);
    
    console.log(`${player.name} hat Raum ${roomCode} verlassen`);
    
    // Wenn Host geht, neuen Host bestimmen
    if (player.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].id;
    }
    
    // Wenn Raum leer, löschen
    if (room.players.length === 0) {
      rooms.delete(roomCode);
      console.log(`Raum ${roomCode} gelöscht (leer)`);
    } else {
      // Informiere andere Spieler
      io.to(roomCode).emit('player-left', {
        playerId: player.id,
        players: room.players.map(p => ({ ...p, socketId: undefined }))
      });
    }
  });

  // Verbindung getrennt
  socket.on('disconnect', () => {
    console.log('Client getrennt:', socket.id);
    
    // Finde alle Räume, in denen dieser Spieler ist
    for (const [code, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        player.isConnected = false;
        
        // Informiere andere Spieler
        io.to(code).emit('player-disconnected', {
          playerId: player.id
        });
        
        // Nach 30 Sekunden Spieler entfernen
        setTimeout(() => {
          const currentRoom = rooms.get(code);
          if (currentRoom) {
            const idx = currentRoom.players.findIndex(p => p.id === player.id);
            if (idx !== -1 && !currentRoom.players[idx].isConnected) {
              currentRoom.players.splice(idx, 1);
              
              if (currentRoom.players.length === 0) {
                rooms.delete(code);
              } else {
                io.to(code).emit('player-left', {
                  playerId: player.id,
                  players: currentRoom.players.map(p => ({ ...p, socketId: undefined }))
                });
              }
            }
          }
        }, 30000);
        
        break;
      }
    }
  });
});

// API Endpoints
app.get('/api/rooms/:code', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Raum nicht gefunden' });
  }
  
  res.json({
    ...room,
    players: room.players.map(p => ({ ...p, socketId: undefined }))
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// Fallback für SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`WebSocket bereit für Verbindungen`);
});
