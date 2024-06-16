import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useRouter } from 'next/router';
import styles from '../styles/Group.module.css';

let socket;

export default function Group() {
  const router = useRouter();
  const { groupId } = router.query;
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (groupId) {
      socket = io('http://localhost:3001');

      socket.on('update users', (users) => {
        setUsers(users);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [groupId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit('join group', { groupId, username });
    setIsJoined(true);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Group: {groupId}</h1>
      {!isJoined ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className={styles.input}
          />
          <button type="submit" className={styles.button}>Submit</button>
        </form>
      ) : (
        <ul className={styles.userList}>
          {users.map((user, index) => (
            <li key={index} className={styles.userListItem}>{user}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
