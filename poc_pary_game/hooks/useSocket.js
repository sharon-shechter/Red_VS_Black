import { useEffect, useState } from 'react';
import io from 'socket.io-client';

let socket;

export const useSocket = (
  groupId, 
  username, 
  setUsername, 
  setJoined, 
  votedFor, 
  setVotedFor, 
  turnRedAbilityUsed, 
  setTurnRedAbilityUsed,
  photo  
) => {
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
    
    socket.on('turn red ability used', () => {
      setTurnRedAbilityUsed(true);
    });

    socket.on('game analysis', ({ analysis }) => {
      setAnalysis(analysis);
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
    
    setGameState((prevState) => {
      if (!prevState || !prevState.players) {
        return prevState;  // If there are no players or the state is invalid, return the current state
      }
  
      return {
        ...prevState,
        players: prevState.players.map((player) =>
          player.name === eliminatedPlayer ? { ...player, eliminated: true } : player
        ),
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && groupId) {
      // Send the photo along with the username when joining the group
      socket.emit('join group', { groupId, username, photo });
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
    handleSubmit,  // Now the handleSubmit sends the photo
    handleStartGame,
    handleVote,
    handleTurnRed,
    myPlayer,
    activePlayers,
    analysis 
  };
};
