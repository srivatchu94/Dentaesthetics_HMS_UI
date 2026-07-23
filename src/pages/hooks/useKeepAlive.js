import { useEffect } from "react";

const useKeepAlive = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${process.env.REACT_APP_API_URL}/health`)
        .then(() => console.log("Keep-alive ping sent"))
        .catch(err => console.error("Keep-alive failed", err));
    }, 5 * 60 * 1000); // every 5 minutes

    return () => clearInterval(interval);
  }, []);
};

export default useKeepAlive;
