export function VotingSection({ activePlayers, username, votedFor, setVotedFor, handleVote }) {
  return (
    <div>
      <select value={votedFor} onChange={(e) => setVotedFor(e.target.value)}>
        <option value="">Select a player</option>
        {activePlayers
          .filter(player => player.name !== username)
          .map((player, index) => (
            <option key={index} value={player.name}>{player.name}</option>
          ))}
      </select>
      <button onClick={handleVote} className="button">Vote</button>
    </div>
  );
}