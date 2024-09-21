import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Group.module.css';
import { CapturePhoto } from '../components/CapturePhoto';  // Import the CapturePhoto component
import { JoinForm } from '../components/JoinForm';  // Assuming this is your existing form component
import { GameInfo } from '../components/GameInfo';
import { VotingSection } from '../components/VotingSection';
import { GameActionButtons } from '../components/GameActionButtons';
import { GameAnalysis } from '../components/gameAnalysis';
import { useSocket } from '../hooks/useSocket';  // Import the custom useSocket hook

export default function Group() {
  const [username, setUsername] = useState('');
  const [photo, setPhoto] = useState(null);  // Add state for the photo
  const [joined, setJoined] = useState(false);
  const [votedFor, setVotedFor] = useState('');
  const [turnRedAbilityUsed, setTurnRedAbilityUsed] = useState(false);

  const router = useRouter();
  const { groupId } = router.query;

  // Use the useSocket hook and pass the necessary props, including photo
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
    analysis
  } = useSocket(groupId, username, setUsername, setJoined, votedFor, setVotedFor, turnRedAbilityUsed, setTurnRedAbilityUsed, photo);  // Pass the photo

  // Capture the photo and store it in the state
  const handlePhotoTaken = (photoData) => {
    setPhoto(photoData);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Group {groupId}</h1>
      {message && <h2 className={styles.messageHeader}>{message}</h2>}
      {error && <p className={styles.error}>{error}</p>}

      {!joined ? (
        <>
          <JoinForm 
            username={username} 
            setUsername={setUsername} 
            handleSubmit={handleSubmit}  // Use the submit handler from the hook
          />
          <CapturePhoto onPhotoTaken={handlePhotoTaken} />  {/* Add CapturePhoto component */}
        </>
      ) : (
        <>
          <GameActionButtons
            phase={phase}
            handleStartGame={handleStartGame}
            myPlayer={myPlayer}
            activePlayers={activePlayers.filter(player => player.name !== username && player.color !== 'red')}
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
                {user.name}
                {user.photo && <img src={user.photo} alt={`${user.name}'s Photo`} width="50" />}
              </li>
            ))}
          </ul>

          <GameAnalysis analysis={analysis} />
        </>
      )}
    </div>
  );
}
