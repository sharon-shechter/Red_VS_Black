import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';

let socket;

export default function Group() {
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [joined, setJoined] = useState(false);
  const router = useRouter();
  const { groupId } = router.query;

  useEffect(() => {
    socket = io('http://localhost:3001');

    socket.on('update users', (users) => {
      setUsers(users);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && groupId) {
      socket.emit('join group', { groupId, username });
      setJoined(true);
    }
  };

  return (
    <div>
      <h1>Group {groupId}</h1>
      {!joined && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
          />
          <button type="submit">Join Group</button>
        </form>
      )}
      <ul>
        {users.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
    </div>
  );
}
