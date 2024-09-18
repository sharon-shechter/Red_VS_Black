import { TurnRedButton } from './TurnRedButton';  // Import the TurnRedButton component

export const GameActionButtons = ({
    phase,
    handleStartGame,
    myPlayer,
    turnRedAbilityUsed,
    activePlayers,
    selectedPlayer,
    setSelectedPlayer,
    handleTurnRed,
    showPlayerList,
    setShowPlayerList
  }) => (
    <>
      {phase === 'waiting' && <button onClick={handleStartGame}>Start the Game</button>}
  
      {myPlayer?.color === 'red' && phase === 'playing' && !turnRedAbilityUsed && (
        <TurnRedButton 
          activePlayers={activePlayers} 
          selectedPlayer={selectedPlayer} 
          setSelectedPlayer={setSelectedPlayer} 
          handleTurnRed={handleTurnRed} 
          showPlayerList={showPlayerList} 
          setShowPlayerList={setShowPlayerList} 
        />
      )}
    </>
  );
  