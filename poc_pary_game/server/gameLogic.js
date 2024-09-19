const axios = require('axios');  
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');
const { GAME_PHASES, groups, games } = require('./gameState');
const { deleteGame } = require('../api/apiService');
const { addPlayerToGame } = require('../api/apiService');  // Import the API function


async function handleJoinGroup(io, socket, { groupId, username }) {
  
  // If the group does not exist, create it
  if (!groups[groupId]) {
    groups[groupId] = [];
  }

  // Add the player to the group locally
  groups[groupId].push({ id: socket.id, name: username });

  // Make the API call to add the player to the game on the Flask server
  try {
    // Assign a color to the player (e.g., randomly or using some logic)
    const playerColor = 'black';  // Set default color for now, you can modify this logic as needed
    
    // Call the Flask API to add the player
    await addPlayerToGame(groupId, username, playerColor);

    console.log(`Player ${username} added to game ${groupId} successfully on the server`);

  } catch (error) {
    console.error('Failed to add player to game:', error);
  }

  // Join the group on the Socket.io server
  socket.join(groupId);

  // Notify all users in the group about the new player
  io.to(groupId).emit('update users', groups[groupId].map(user => user.name));
}
function handleStartGame(io, socket, { groupId }) {
  if (groups[groupId] && groups[groupId].length < 2) {
    socket.emit('error', 'At least two players are required to start the game.');
  } else {
    startGame(io, groupId);
  }
}

function handleSubmitVote(io, socket, { groupId, votedFor }) {
  if (games[groupId] && games[groupId].phase === GAME_PHASES.VOTING) {
    const player = games[groupId].players.find(p => p.id === socket.id);
    if (player && !player.eliminated) {
      player.votedFor = votedFor;
    }
  }
}

function handleTurnRed(io, socket, { groupId, targetPlayer }) {
  const game = games[groupId];
  if (!game) return;

  const senderPlayer = game.players.find(p => p.id === socket.id);
  const targetPlayerObj = game.players.find(p => p.name === targetPlayer);

  if (senderPlayer && targetPlayerObj && senderPlayer.color === 'red' && !game.turnRedAbilityUsed) {
    game.turnRedAbilityUsed = true;
    targetPlayerObj.color = 'red';

    io.to(groupId).emit('player color changed', { player: targetPlayerObj.name, newColor: 'red' });
    io.to(groupId).emit('turn red ability used');
    io.to(groupId).emit('update game state', game);
    io.to(targetPlayerObj.id).emit('turn red message', { from: senderPlayer.name });
  } else {
    socket.emit('error', 'Unable to use turn red ability.');
  }
}

function handleDisconnect(io, socket) {
  for (let groupId in groups) {
    groups[groupId] = groups[groupId].filter(user => user.id !== socket.id);
    io.to(groupId).emit('update users', groups[groupId].map(user => user.name));
  }
}

function startGame(io, groupId) {
  let players = groups[groupId];
  const redPlayer = _.sample(players);

  games[groupId] = {
    phase: GAME_PHASES.PLAYING,
    round: 1,
    turnRedAbilityUsed: false,
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
  runGameLoop(io, groupId);
}

function runGameLoop(io, groupId) {
  const game = games[groupId];
  game.phase = GAME_PHASES.PLAYING;
  
  io.to(groupId).emit('round start', { round: game.round });
  
  setTimeout(() => {
    game.phase = GAME_PHASES.VOTING;
    io.to(groupId).emit('voting start');
    
    setTimeout(() => {
      processVotes(groupId);
      eliminatePlayer(io, groupId);
      
      if (checkWinCondition(groupId)) {
        endGame(io, groupId);
      } else {
        game.round++;
        resetVotes(groupId);
        runGameLoop(io, groupId);
      }
    }, 20000);  // 20 seconds for voting
  }, 30000);  // 30 seconds for playing
}

function processVotes(groupId) {
  const game = games[groupId];
  
  // Initialize an object to hold voting results
  const votingResults = {};

  game.players.forEach(player => {
    if (!player.eliminated && player.votedFor) {
      const votedPlayer = game.players.find(p => p.name === player.votedFor && !p.eliminated);
      if (votedPlayer) {
        votedPlayer.score++;
        
        // Update votingResults hash map
        if (!votingResults[votedPlayer.name]) {
          votingResults[votedPlayer.name] = 0;
        }
        votingResults[votedPlayer.name]++;
      }
    }
  });
}
  

function eliminatePlayer(io, groupId) {
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

async function endGame(io, groupId) {
  const game = games[groupId];
  const redPlayers = game.players.filter(p => p.color === 'red' && !p.eliminated);
  const winner = redPlayers.length > 0 ? 'Red team' : 'Black team';
  
  io.to(groupId).emit('game over', { winner });
  
  // Delete the game from the Flask server
  try {
      await deleteGame(groupId);  // Call the delete API when the game ends
      console.log(`Game ${groupId} deleted successfully from the server`);
  } catch (error) {
      console.error('Failed to delete game:', error);
  }
  
  delete games[groupId];  // Delete the game from the local game state
}

function resetVotes(groupId) {
  const game = games[groupId];
  game.players.forEach(player => {
    player.votedFor = null;
    player.score = 0;  // Reset scores each round
  });
}

module.exports = {
  handleJoinGroup,
  handleStartGame,
  handleSubmitVote,
  handleTurnRed,
  handleDisconnect,
  startGame,
  runGameLoop,
  processVotes,
  eliminatePlayer,
  checkWinCondition,
  endGame,
  resetVotes
};