import { useEffect } from "react";
import { API_BASE_URL } from "../../config/apiConfig";

const useKeepAlive = () => {
  useEffect(() => {
    // Keep-alive ping to maintain server session
    // Pings every 3 minutes to prevent backend session timeout (usually 15-20 min)
    const interval = setInterval(() => {
      fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        credentials: 'include', // Include cookies (for session management)
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          if (res.ok) {
            console.log('💚 Keep-alive ping successful - Server session extended');
          } else {
            console.warn(`⚠️ Keep-alive ping failed with status ${res.status}`);
          }
        })
        .catch(err => console.error('❌ Keep-alive ping failed:', err));
    }, 3 * 60 * 1000); // every 3 minutes (reduced from 5)

    return () => clearInterval(interval);
  }, []);
};

export default useKeepAlive;
