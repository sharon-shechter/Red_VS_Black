export function TurnRedButton({ 
  activePlayers, 
  selectedPlayer, 
  setSelectedPlayer, 
  handleTurnRed,
  showPlayerList,
  setShowPlayerList,
  turnRedAbilityUsed
}) {
  if (turnRedAbilityUsed) {
    return null; // Don't render the button if the ability has been used
  }

  return (
    <div>
      <button onClick={() => setShowPlayerList(true)} className="button">Turn Red</button>
      {showPlayerList && (
        <div>
          <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
            <option value="">Select a player</option>
            {activePlayers.map((player, index) => (
              <option key={index} value={player.name}>{player.name}</option>
            ))}
          </select>
          <button onClick={handleTurnRed} className="button">Turn Red</button>
        </div>
      )}
    </div>
  );
}