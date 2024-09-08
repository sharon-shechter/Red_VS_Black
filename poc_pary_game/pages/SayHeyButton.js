export function SayHeyButton({ 
    activePlayers, 
    selectedPlayer, 
    setSelectedPlayer, 
    handleSayHey,
    showPlayerList,
    setShowPlayerList 
  }) {
    return (
      <div>
        <button onClick={() => setShowPlayerList(true)} className="button">Say Hey</button>
        {showPlayerList && (
          <div>
            <select value={selectedPlayer} onChange={(e) => setSelectedPlayer(e.target.value)}>
              <option value="">Select a player</option>
              {activePlayers.map((player, index) => (
                <option key={index} value={player.name}>{player.name}</option>
              ))}
            </select>
            <button onClick={handleSayHey} className="button">Send Hello</button>
          </div>
        )}
      </div>
    );
  }