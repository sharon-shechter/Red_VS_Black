export function GameInfo({ round, timer, myPlayer, phase }) {
  return (
    <div>
      <h2>Round {round}</h2>
      <p>Phase: {phase}</p>
      <p>Time left: {timer} seconds</p>
      {myPlayer && <p>Your color: {myPlayer.color}</p>}
    </div>
  );
}