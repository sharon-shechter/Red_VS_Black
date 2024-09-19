import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Group.module.css';
import { GameInfo } from '../components/GameInfo';
import { VotingSection } from '../components/VotingSection';
import { GameActionButtons } from '../components/GameActionButtons';
import { JoinForm } from '../components/JoinForm';
import { useSocket } from '../hooks/useSocket';
import { GameAnalysis } from '../components/gameAnalysis';  // Import the GameAnalysis component

export default function Group() {
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [votedFor, setVotedFor] = useState('');
  const [turnRedAbilityUsed, setTurnRedAbilityUsed] = useState(false);

  const router = useRouter();
  const { groupId } = router.query;

  const { 
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
    gameAnalysis  // Get game analysis from useSocket
  } = useSocket(groupId, username, setUsername, setJoined, votedFor, setVotedFor, turnRedAbilityUsed, setTurnRedAbilityUsed);

  const turnRedTargetPlayers = activePlayers.filter(player => 
    player.name !== username && player.color !== 'red'
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Group {groupId}</h1>
      {message && <h2 className={styles.messageHeader}>{message}</h2>}
      {error && <p className={styles.error}>{error}</p>}

      {!joined ? (
        <JoinForm 
          username={username} 
          setUsername={setUsername} 
          handleSubmit={handleSubmit} 
        />
      ) : (
        <>
          <GameActionButtons
            phase={phase}
            handleStartGame={handleStartGame}
            myPlayer={myPlayer}
            activePlayers={turnRedTargetPlayers}
            handleTurnRed={handleTurnRed}
            turnRedAbilityUsed={turnRedAbilityUsed}
          />

          <GameInfo 
            round={round} 
            timer={phase === 'playing' ? playingTimer : votingTimer} 
            myPlayer={myPlayer} 
            phase={phase} 
          />

          {phase === 'voting' && !myPlayer?.eliminated && (
            <VotingSection 
              activePlayers={activePlayers}
              username={username}
              votedFor={votedFor} 
              setVotedFor={setVotedFor} 
              handleVote={handleVote} 
            />
          )}

          <ul className={styles.userList}>
            {users.map((user, index) => (
              <li key={index} className={styles.userListItem}>
                {user}
              </li>
            ))}
          </ul>

          {/* Add the GameAnalysis component */}
        </>
      )}
    </div>
  );
}
