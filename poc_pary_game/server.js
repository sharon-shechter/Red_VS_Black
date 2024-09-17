const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const GAME_PHASES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  VOTING: 'voting',
  RESULTS: 'results'
};

let groups = {};
let games = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join group', ({ groupId, username }) => {
    if (!groups[groupId]) {
      groups[groupId] = [];
    }
    groups[groupId].push({ id: socket.id, name: username });
    socket.join(groupId);
    io.to(groupId).emit('update users', groups[groupId].map(user => user.name));
  });

  socket.on('start game', ({ groupId }) => {
    if (groups[groupId] && groups[groupId].length < 2) {
      socket.emit('error', 'At least two players are required to start the game.');
    } else {
      startGame(groupId);
    }
  });

  socket.on('submit vote', ({ groupId, votedFor }) => {
    if (games[groupId] && games[groupId].phase === GAME_PHASES.VOTING) {
      const player = games[groupId].players.find(p => p.id === socket.id);
      if (player && !player.eliminated) {
        player.votedFor = votedFor;
      }
    }
  });

  socket.on('turn red', ({ groupId, targetPlayer }) => {
    const game = games[groupId];
    if (!game) return;

    const senderPlayer = game.players.find(p => p.id === socket.id);
    const targetPlayerObj = game.players.find(p => p.name === targetPlayer);

    if (senderPlayer && targetPlayerObj && senderPlayer.color === 'red' && !game.turnRedAbilityUsed) {
      game.turnRedAbilityUsed = true; // Mark the ability as used for the entire game
      targetPlayerObj.color = 'red'; // Turn the target player red

      // Send the updated game state
      io.to(groupId).emit('player color changed', { player: targetPlayerObj.name, newColor: 'red' });
      io.to(groupId).emit('turn red ability used');
      io.to(groupId).emit('update game state', game);

      // Notify the target player that they've been turned red
      io.to(targetPlayerObj.id).emit('turn red message', { from: senderPlayer.name });
    } else {
      socket.emit('error', 'Unable to use turn red ability.');
    }
  });

  socket.on('disconnect', () => {
    for (let groupId in groups) {
      groups[groupId] = groups[groupId].filter(user => user.id !== socket.id);
      io.to(groupId).emit('update users', groups[groupId].map(user => user.name));
    }
  });
});

function startGame(groupId) {
  let players = groups[groupId];
  const redPlayer = _.sample(players);

  games[groupId] = {
    phase: GAME_PHASES.PLAYING,
    round: 1,
    turnRedAbilityUsed: false, // Track if the ability has been used in the game
    players: players.map(player => ({
      id: player.id,
      name: player.name,
      color: player.id === redPlayer.id ? 'red' : 'black',
      score: 0,
      votedFor: null,
      eliminated: false
    }))
  };

  io.to(groupId).emit('game started', games[groupId]);
  runGameLoop(groupId);
}

function runGameLoop(groupId) {
  const game = games[groupId];
  game.phase = GAME_PHASES.PLAYING;
  
  io.to(groupId).emit('round start', { round: game.round });
  
  setTimeout(() => {
    game.phase = GAME_PHASES.VOTING;
    io.to(groupId).emit('voting start');
    
    setTimeout(() => {
      processVotes(groupId);
      eliminatePlayer(groupId);
      
      if (checkWinCondition(groupId)) {
        endGame(groupId);
      } else {
        game.round++;
        resetVotes(groupId);
        runGameLoop(groupId);
      }
    }, 20000);  // 20 seconds for voting
  }, 30000);  // 30 seconds for playing
}

function processVotes(groupId) {
  const game = games[groupId];
  game.players.forEach(player => {
    if (!player.eliminated && player.votedFor) {
      const votedPlayer = game.players.find(p => p.name === player.votedFor && !p.eliminated);
      if (votedPlayer) {
        votedPlayer.score++;
      }
    }
  });
}

function eliminatePlayer(groupId) {
  const game = games[groupId];
  const activePlayers = game.players.filter(p => !p.eliminated);
  const maxScore = Math.max(...activePlayers.map(p => p.score));
  const playersToEliminate = activePlayers.filter(p => p.score === maxScore);

  if (playersToEliminate.length === 1) {
    const eliminatedPlayer = playersToEliminate[0];
    eliminatedPlayer.eliminated = true;
    io.to(groupId).emit('player eliminated', { eliminatedPlayer: eliminatedPlayer.name });
  }
  // If there's a tie, no one gets eliminated this round
}

function checkWinCondition(groupId) {
  const game = games[groupId];
  const redPlayers = game.players.filter(p => p.color === 'red' && !p.eliminated);
  const activePlayers = game.players.filter(p => !p.eliminated);
  return redPlayers.length === 0 || redPlayers.length === activePlayers.length;
}

function endGame(groupId) {
  const game = games[groupId];
  const redPlayers = game.players.filter(p => p.color === 'red' && !p.eliminated);
  const winner = redPlayers.length > 0 ? 'Red team' : 'Black team';
  io.to(groupId).emit('game over', { winner });
  delete games[groupId];
}

function resetVotes(groupId) {
  const game = games[groupId];
  game.players.forEach(player => {
    player.votedFor = null;
    player.score = 0;  // Reset scores each round
  });
}

app.get('/make-group', (req, res) => {
  const groupId = uuidv4();
  res.json({ groupId });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});