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
  const [message, setMessage] = useState('');
  const [round, setRound] = useState(1);
  const router = useRouter();
  const { groupId } = router.query;

  useEffect(() => {
    socket = io('http://localhost:3001');
    socketEvents();
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    let interval;
    if (phase === 'playing' && playingTimer > 0) {
      interval = setInterval(() => {
        setPlayingTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (phase === 'voting' && votingTimer > 0) {
      interval = setInterval(() => {
        setVotingTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (playingTimer === 0 && phase === 'playing') {
      clearInterval(interval);
      setPhase('voting');
      setVotingTimer(20);
    } else if (votingTimer === 0 && phase === 'voting') {
      clearInterval(interval);
      socket.emit('voting ended', { groupId });
    }
    return () => clearInterval(interval);
  }, [phase, playingTimer, votingTimer, groupId]);

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
    socket.on('turn red confirmation', ({ to }) => {
      setMessage(`You turned ${to} into a red player!`);
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
  }

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

  const handleTurnRed = () => {
    if (groupId && selectedPlayer && !myPlayer.usedTurnRed) {
      socket.emit('turn red', { groupId, targetPlayer: selectedPlayer });
      setShowPlayerList(false);
      // Update local state to reflect that the ability has been used
      setGameState((prevState) => ({
        ...prevState,
        players: prevState.players.map((p) =>
          p.name === username ? { ...p, usedTurnRed: true } : p
        ),
      }));
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
          {myPlayer?.color === 'red' && phase === 'playing' && !myPlayer.usedTurnRed && (
            <TurnRedButton 
              activePlayers={activePlayers.filter(p => p.color !== 'red' && p.name !== username)} 
              selectedPlayer={selectedPlayer} 
              setSelectedPlayer={setSelectedPlayer} 
              handleTurnRed={handleTurnRed}
              showPlayerList={showPlayerList}
              setShowPlayerList={setShowPlayerList}
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