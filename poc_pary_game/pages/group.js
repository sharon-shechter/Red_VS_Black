import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import styles from '../styles/Group.module.css';

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
    <div className={styles.container}>
      <h1 className={styles.title}>Group {groupId}</h1>
      {!joined && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>Join Group</button>
        </form>
      )}
      <ul className={styles.userList}>
        {users.map((user, index) => (
          <li key={index} className={styles.userListItem}>{user}</li>
        ))}
      </ul>
    </div>
  );
}
