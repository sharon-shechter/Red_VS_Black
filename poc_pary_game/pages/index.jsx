import { useRouter } from 'next/router';
import styles from '../styles/Index.module.css';

export default function Index() {
  const router = useRouter();

  const makeGroup = async () => {
    try {
      const response = await fetch('http://localhost:5000/make-group');
      const data = await response.json();
      const groupId = data.groupId;

      if (groupId) {
        localStorage.setItem('groupId', groupId);
        router.push(`/group?groupId=${groupId}`);
      } else {
        console.error('groupId is undefined');
      }
    } catch (error) {
      console.error('Error fetching groupId:', error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.welcome}>BLACK VS RED</h1>
      <button className={styles.startButton} onClick={makeGroup}>Let's Start</button>
    </div>
  );
}
