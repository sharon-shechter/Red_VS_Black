export const JoinForm = ({ username, setUsername, handleSubmit }) => (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter your name"
      />
      <button type="submit">Join Group</button>
    </form>
  );
  