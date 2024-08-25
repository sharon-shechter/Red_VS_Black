import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import styles from '../styles/Group.module.css';

let socket;

export default function Group() {
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [gameState, setGameState] = useState(null);
  const [phase, setPhase] = useState('waiting');
  const [timer, setTimer] = useState(0);
  const [round, setRound] = useState(0);
  const [votedFor, setVotedFor] = useState('');
  const router = useRouter();
  const { groupId } = router.query;

  useEffect(() => {
    socket = io('http://localhost:3001');

    socket.on('update users', (users) => {
      setUsers(users);
    });

    socket.on('error', (message) => {
      setError(message);
    });

    socket.on('game started', (state) => {
      setGameState(state);
      setPhase('playing');
    });

    socket.on('round start', ({ round }) => {
      setRound(round);
      setTimer(30);
      setPhase('playing');
      setVotedFor(''); // Reset vote at the start of each round
    });

    socket.on('voting start', () => {
      setPhase('voting');
      setTimer(20); // Changed to 20 seconds as per server update
    });

    socket.on('player eliminated', ({ eliminatedPlayer }) => {
      setError(`${eliminatedPlayer} has been eliminated!`);
      setGameState(prevState => ({
        ...prevState,
        players: prevState.players.map(player => 
          player.name === eliminatedPlayer ? {...player, eliminated: true} : player
        )
      }));
    });

    socket.on('game over', ({ winner }) => {
      setError(`Game Over! ${winner} wins!`);
      setPhase('gameOver');
    });

    const interval = setInterval(() => {
      setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
    }, 1000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

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
      setVotedFor(''); // Reset vote after submission
    }
  };

  const myPlayer = gameState?.players.find(player => player.name === username);
  const activePlayers = gameState?.players.filter(player => !player.eliminated) || [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Group {groupId}</h1>
      {error && <p className={styles.error}>{error}</p>}
      {!joined && (
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
      )}
      {joined && phase === 'waiting' && (
        <button onClick={handleStartGame} className={styles.button}>Start the Game</button>
      )}
      {phase !== 'waiting' && (
        <div>
          <h2>Round {round}</h2>
          <p>Time left: {timer} seconds</p>
          {myPlayer && <p>Your color: {myPlayer.color}</p>}
        </div>
      )}
      {phase === 'voting' && !myPlayer?.eliminated && (
        <div>
          <select value={votedFor} onChange={(e) => setVotedFor(e.target.value)}>
            <option value="">Select a player</option>
            {activePlayers
              .filter(player => player.name !== username && !player.eliminated)
              .map((player, index) => (
                <option key={index} value={player.name}>{player.name}</option>
              ))}
          </select>
          <button onClick={handleVote} className={styles.button}>Vote</button>
        </div>
      )}
      <ul className={styles.userList}>
        {activePlayers.map((player, index) => (
          <li key={index} className={styles.userListItem}>
            {player.name} {player.eliminated ? '(Eliminated)' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
