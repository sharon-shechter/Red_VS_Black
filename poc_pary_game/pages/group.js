import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import styles from '../styles/Group.module.css';
import { GameInfo } from './GameInfo';
import { VotingSection } from './VotingSection';
import { TurnRedButton } from './TurnRedButton';

let socket;

export default function Group() {
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [gameState, setGameState] = useState(null);
  const [phase, setPhase] = useState('waiting');
  const [playingTimer, setPlayingTimer] = useState(0);
  const [votingTimer, setVotingTimer] = useState(0);
  const [votedFor, setVotedFor] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [turnRedAbilityUsed, setTurnRedAbilityUsed] = useState(false);
  const [message, setMessage] = useState('');
  const [round, setRound] = useState(1);
  const router = useRouter();
  const { groupId } = router.query;
  useEffect(() => {
    console.log("groupId from query:", groupId);  // Add this log
    if (groupId) {
      socket = io('http://localhost:3001');
      socketEvents();
      return () => socket.disconnect();
    }
  }, [groupId]);


  useEffect(() => {
    let interval;
    // Handle timers for playing and voting phases
    if (phase === 'playing' && playingTimer > 0) {
      interval = setInterval(() => setPlayingTimer(prev => prev - 1), 1000);
    } else if (phase === 'voting' && votingTimer > 0) {
      interval = setInterval(() => setVotingTimer(prev => prev - 1), 1000);
    } else if (playingTimer === 0 && phase === 'playing') {
      clearInterval(interval);
      setPhase('voting');
      setVotingTimer(20);  // 20 seconds for voting
    } else if (votingTimer === 0 && phase === 'voting') {
      clearInterval(interval);
      // Removed the socket.emit('voting ended') as the server now handles this internally
    }
    return () => clearInterval(interval);
  }, [phase, playingTimer, votingTimer, groupId]);

  const socketEvents = () => {
    // Handling all socket events
    socket.on('update users', (users) => setUsers(users));
    socket.on('error', (message) => setError(message));
    socket.on('game started', (state) => handleGameStart(state));
    socket.on('round start', ({ round }) => {
      setRound(round);
      setPlayingTimer(30);  // 30 seconds for playing phase
      setPhase('playing');
      setVotedFor('');
    });
    socket.on('voting start', () => {
      setPhase('voting');
      setVotingTimer(20);  // 20 seconds for voting phase
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
    socket.on('turn red ability used', () => setTurnRedAbilityUsed(true));
    // New event listener for general game state updates
    socket.on('update game state', (newState) => {
      setGameState(newState);
    });
  };

  const handleGameStart = (state) => {
    setGameState(state);
    setPhase('playing');
    setPlayingTimer(30);  // Start the playing timer
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
      setVotedFor('');  // Clear the vote after submission
    }
  };

  const handleTurnRed = () => {
    if (groupId && selectedPlayer && !turnRedAbilityUsed) {
      socket.emit('turn red', { groupId, targetPlayer: selectedPlayer });
      setShowPlayerList(false);
      setTurnRedAbilityUsed(true);
    }
  };

  const myPlayer = gameState?.players.find((player) => player.name === username);
  const activePlayers = gameState?.players.filter((player) => !player.eliminated) || [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Group {groupId}</h1>
      {message && <h2 className={styles.messageHeader}>{message}</h2>}
      {error && <p className={styles.error}>{error}</p>}
      {!joined ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>Join Group</button>
        </form>
      ) : (
        <>
          {phase === 'waiting' && <button onClick={handleStartGame} className={styles.button}>Start the Game</button>}
          {phase !== 'waiting' && (
            <GameInfo 
              round={round} 
              timer={phase === 'playing' ? playingTimer : votingTimer} 
              myPlayer={myPlayer} 
              phase={phase}
            />
          )}
          {phase === 'voting' && !myPlayer?.eliminated && (
            <VotingSection 
              activePlayers={activePlayers} 
              username={username} 
              votedFor={votedFor} 
              setVotedFor={setVotedFor} 
              handleVote={handleVote} 
            />
          )}
         {myPlayer?.color === 'red' && phase === 'playing' && !turnRedAbilityUsed && (
            <TurnRedButton 
              activePlayers={activePlayers.filter(p => p.color !== 'red' && p.name !== username)} 
              selectedPlayer={selectedPlayer} 
              setSelectedPlayer={setSelectedPlayer} 
              handleTurnRed={handleTurnRed}
              showPlayerList={showPlayerList}
              setShowPlayerList={setShowPlayerList}
              turnRedAbilityUsed={turnRedAbilityUsed}
            />
          )}
          <ul className={styles.userList}>
            {users.map((user, index) => (
              <li key={index} className={styles.userListItem}>
                {user}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}