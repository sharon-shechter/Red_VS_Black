import { useState, useEffect } from 'react';  
import { useRouter } from 'next/router';
import styles from '../styles/Group.module.css';
import { CapturePhoto } from '../components/CapturePhoto';
import { JoinForm } from '../components/JoinForm';
import { GameInfo } from '../components/GameInfo';
import { VotingSection } from '../components/VotingSection';
import { GameActionButtons } from '../components/GameActionButtons';
import { GameAnalysis } from '../components/gameAnalysis';
import { useSocket } from '../hooks/useSocket';

export default function Group() {
  const [username, setUsername] = useState('');
  const [photo, setPhoto] = useState(null);
  const [joined, setJoined] = useState(false);
  const [votedFor, setVotedFor] = useState('');
  const [turnRedAbilityUsed, setTurnRedAbilityUsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);  // Add isProcessing state
  
  const router = useRouter();
  const { groupId } = router.query;

  const {
    socket,
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
  } = useSocket(groupId, username, setUsername, setJoined, votedFor, setVotedFor, turnRedAbilityUsed, setTurnRedAbilityUsed, photo, setIsProcessing);  // Correct argument order

  useEffect(() => {
    if (!socket) return;  // Ensure socket is initialized

    // Listen for the 'photo processed' event from the server
    socket.on('photo processed', () => {
      setIsProcessing(false);  // Stop showing the loading indicator when the photo is processed
    });

    // Clean up the event listener when the component unmounts or when socket changes
    return () => {
      socket.off('photo processed');
    };
  }, [socket]);

  const handlePhotoTaken = (photoData) => {
    setPhoto(photoData);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>RED VS BLACK</h1>
      {message && <h2 className={styles.messageHeader}>{message}</h2>}
      {error && <p className={styles.error}>{error}</p>}

      {!joined ? (
        <div className={styles.joinSection}>
          <JoinForm 
            username={username} 
            setUsername={setUsername} 
            handleSubmit={handleSubmit}
          />
          <CapturePhoto onPhotoTaken={handlePhotoTaken} />
        </div>
      ) : (
        <>
          {isProcessing && (
            <div>
              <p>Processing your photo...</p>
              <img src="/loading-icon.gif" alt="Loading" />
            </div>
          )}
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
                <span className={styles.userName}>{user.name}</span>
                {user.photo && <img src={user.photo} alt={`${user.name}'s Photo`} />}
              </li>
            ))}
          </ul>
          <GameAnalysis analysis={analysis} />
        </>
      )}
    </div>
  );
}
