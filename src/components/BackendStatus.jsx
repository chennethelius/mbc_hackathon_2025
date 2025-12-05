import { useState, useEffect } from 'react';
import './BackendStatus.css';

export default function BackendStatus() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check connection immediately
    checkConnection();

    // Then check every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  async function checkConnection() {
    try {
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      setIsConnected(response.ok);
    } catch (error) {
      setIsConnected(false);
    }
  }

  return (
    <div className="backend-status">
      <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
      <span className="status-text">
        {isConnected ? 'Backend Connected' : 'Backend Offline'}
      </span>
    </div>
  );
}
