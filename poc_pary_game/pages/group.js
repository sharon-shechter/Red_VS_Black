import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import styles from '../styles/Group.module.css';
import { GameInfo } from './GameInfo';
import { VotingSection } from './VotingSection';
import { SayHeyButton } from './SayHeyButton';

let socket;

export default function Group() {
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [gameState, setGameState] = useState(null);
  const [phase, setPhase] = useState('waiting');
  const [playingTimer, setPlayingTimer] = useState(30);
  const [votingTimer, setVotingTimer] = useState(15);
  const [votedFor, setVotedFor] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [showPlayerList, setShowPlayerList] = useState(false);
  const [round, setRound] = useState(1); // Added round state here
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
      setVotingTimer(15);
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
    socket.on('round start', ({ round }) => handleRoundStart(round));
    socket.on('voting start', () => {setPhase('voting');setVotingTimer(15);});
    socket.on('player eliminated', ({ eliminatedPlayer }) => handlePlayerElimination(eliminatedPlayer));
    socket.on('game over', ({ winner }) => setError(`Game Over! ${winner} wins!`));
    socket.on('hello message', ({ from }) => alert('You got a hello message!'));
  };

  const handleGameStart = (state) => {
    setGameState(state);
    setPhase('playing');
    setPlayingTimer(30);
  };

  const handleRoundStart = (round) => {
    setRound(round); // Now round is properly updated
    setPlayingTimer(30);
    setPhase('playing');
    setVotedFor('');
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

  const handleSayHey = () => {
    if (groupId && selectedPlayer) {
      socket.emit('say hey', { groupId, targetPlayer: selectedPlayer });
      setShowPlayerList(false);
    }
  };

  const myPlayer = gameState?.players.find((player) => player.name === username);
  const activePlayers = gameState?.players.filter((player) => !player.eliminated) || [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Group {groupId}</h1>
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
          {phase !== 'waiting' && (<GameInfo round={round} timer={phase === 'playing' ? playingTimer : votingTimer} myPlayer={myPlayer} phase={phase}/>)}
          {phase === 'voting' && !myPlayer?.eliminated && (
          <VotingSection activePlayers={activePlayers} username={username} votedFor={votedFor} setVotedFor={setVotedFor} handleVote={handleVote} />)}
          {myPlayer?.color === 'red' && phase === 'playing' && (
            <SayHeyButton 
              activePlayers={activePlayers} 
              selectedPlayer={selectedPlayer} 
              setSelectedPlayer={setSelectedPlayer} 
              handleSayHey={handleSayHey}
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
