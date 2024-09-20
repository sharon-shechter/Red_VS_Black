import { useEffect, useState } from 'react';
import io from 'socket.io-client';

let socket;

export const useSocket = (groupId, username, setUsername, setJoined, votedFor, setVotedFor, turnRedAbilityUsed, setTurnRedAbilityUsed) => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [gameState, setGameState] = useState(null);
  const [phase, setPhase] = useState('waiting');
  const [playingTimer, setPlayingTimer] = useState(0);
  const [votingTimer, setVotingTimer] = useState(0);
  const [message, setMessage] = useState('');
  const [round, setRound] = useState(1);
  const [analysis, setAnalysis] = useState('');

  

  useEffect(() => {
    if (groupId) {
      socket = io('http://localhost:3001');
      socketEvents();
      return () => socket.disconnect();
    }
  }, [groupId]);

  useEffect(() => {
    let interval;
    if (phase === 'playing' && playingTimer > 0) {
      interval = setInterval(() => setPlayingTimer(prev => prev - 1), 1000);
    } else if (phase === 'voting' && votingTimer > 0) {
      interval = setInterval(() => setVotingTimer(prev => prev - 1), 1000);
    } else if (playingTimer === 0 && phase === 'playing') {
      setPhase('voting');
      setVotingTimer(20);
    } else if (votingTimer === 0 && phase === 'voting') {
      setPhase('end');
    }
    return () => clearInterval(interval);
  }, [phase, playingTimer, votingTimer]);

  const socketEvents = () => {
    socket.on('update users', (users) => setUsers(users));
    socket.on('error', (message) => setError(message));
    socket.on('game started', (state) => handleGameStart(state));
    socket.on('round start', ({ round }) => {
      setRound(round);
      setPlayingTimer(30);
      setPhase('playing');
      setVotedFor('');
    });
    socket.on('voting start', () => {
      setPhase('voting');
      setVotingTimer(20);
    });
    socket.on('player eliminated', ({ eliminatedPlayer }) => handlePlayerElimination(eliminatedPlayer));
    socket.on('game over', ({ winner }) => setError(`Game Over! ${winner} wins!`));
    socket.on('turn red message', ({ from }) => {
      setMessage(`${from} turned you into a red player!`);
      setTimeout(() => setMessage(''), 10000);
    });
    socket.on('player color changed', ({ player, newColor }) => {
      setGameState((prevState) => ({
        ...prevState,
        players: prevState.players.map((p) =>
          p.name === player ? { ...p, color: newColor } : p
        ),
      }));
    });
    
    // Fix here: Ensure setTurnRedAbilityUsed is called
    socket.on('turn red ability used', () => {
      console.log('Red ability used!');
      setTurnRedAbilityUsed(true);  // Ensure this function is available
    });
    
    // Add event listener for 'game analysis'
    socket.on('game analysis', ({ analysis }) => {
        setAnalysis(analysis);  // Store analysis in the analysis state
      });

    socket.on('update game state', (newState) => setGameState(newState));
  };

  const handleGameStart = (state) => {
    setGameState(state);
    setPhase('playing');
    setPlayingTimer(30);
  };

  const handlePlayerElimination = (eliminatedPlayer) => {
    setError(`${eliminatedPlayer} has been eliminated!`);
    setGameState((prevState) => ({
      ...prevState,
      players: prevState.players.map((player) =>
        player.name === eliminatedPlayer ? { ...player, eliminated: true } : player
      ),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && groupId) {
      socket.emit('join group', { groupId, username });
      setJoined(true);
    }
  };

  const handleStartGame = () => {
    if (groupId) {
      socket.emit('start game', { groupId });
    }
  };

  const handleVote = () => {
    if (groupId && votedFor) {
      socket.emit('submit vote', { groupId, votedFor });
      setVotedFor('');
    }
  };

  const handleTurnRed = (targetPlayer) => {
    if (groupId && targetPlayer) {
      socket.emit('turn red', { groupId, targetPlayer });
      console.log(`Attempting to turn ${targetPlayer} red`);
    }
  };

  const myPlayer = gameState?.players.find((player) => player.name === username);
  const activePlayers = gameState?.players.filter((player) => !player.eliminated) || [];

  return {
    gameState,
    users,
    error,
    message,
    phase,
    round,
    playingTimer,
    votingTimer,
    handleSubmit,
    handleStartGame,
    handleVote,
    handleTurnRed,
    myPlayer,
    activePlayers,
    analysis 
  };
};
