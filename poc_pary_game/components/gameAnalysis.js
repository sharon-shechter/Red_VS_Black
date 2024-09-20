import { useEffect, useState } from 'react';
import styles from '../styles/GameAnalysis.module.css';

export const GameAnalysis = ({ analysis }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    if (analysis) {
      setShowAnalysis(true);

      // Hide the analysis after 10 seconds
      const timeoutId = setTimeout(() => {
        setShowAnalysis(false);
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [analysis]);

  return (
    showAnalysis && (
      <div className={styles.popup}>
        <h2>Game Analysis</h2>
        <p>{analysis}</p>
      </div>
    )
  );
};
