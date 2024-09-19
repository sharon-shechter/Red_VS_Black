import { useEffect, useState } from 'react';
import styles from '../styles/GameAnalysis.module.css';

export const GameAnalysis = ({ socket }) => {
  const [analysis, setAnalysis] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);  // State to show/hide analysis

  useEffect(() => {
    let timeoutId;  // To store the timeout ID for clearing it later

    if (socket) {
      socket.on('game analysis', ({ analysis }) => {
        setAnalysis(analysis);
        setShowAnalysis(true);  // Show the analysis

        // Hide the analysis after 10 seconds
        timeoutId = setTimeout(() => {
          setShowAnalysis(false);  // Hide analysis after 10 seconds
        }, 10000);
      });
    }

    // Clean up the socket listener and timeout on component unmount
    return () => {
      if (socket) {
        socket.off('game analysis');
      }
      clearTimeout(timeoutId);  // Clear the timeout when the component unmounts
    };
  }, [socket]);

  // Conditionally render the analysis pop-up only when `showAnalysis` is true
  return (
    <>
      {showAnalysis && (
        <div className={styles.popup}>
          <p>{analysis}</p>
        </div>
      )}
    </>
  );
};
