// src/components/ConnectionStatus.jsx
import styles from './ConnectionStatus.module.css';

const ConnectionStatus = ({ connected, connecting, clients, latency }) => {
  const dot = connected ? styles.dotGreen : connecting ? styles.dotYellow : styles.dotRed;
  const label = connected ? 'Conectado' : connecting ? 'Conectando...' : 'Desconectado';

  return (
    <div className={styles.wrapper}>
      <span className={`${styles.dot} ${dot}`} />
      <span className={styles.label}>{label}</span>
      {connected && (
        <>
          <span className={styles.sep}>|</span>
          <span className={styles.meta}>👥 {clients} cliente{clients !== 1 ? 's' : ''}</span>
          {latency !== null && (
            <>
              <span className={styles.sep}>|</span>
              <span className={styles.meta}>⚡ {latency}ms</span>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;
