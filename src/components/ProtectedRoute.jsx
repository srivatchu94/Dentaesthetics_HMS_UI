import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '../services/authService';

/**
 * ProtectedRoute component to guard protected pages
 * If user is not logged in (no auth token), redirects to login page
 * @param {React.ReactNode} children - The protected content to render if authenticated
 * @returns {React.ReactNode} Children if authenticated, otherwise redirects to login
 */
export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      console.warn('🔐 ProtectedRoute: User not authenticated. Redirecting to login...');
      // Redirect to login with return path
      navigate('/login', { 
        state: { returnTo: window.location.pathname },
        replace: true 
      });
    }
  }, [navigate]);

  const token = getAuthToken();
  
  // If no token, don't render children (will redirect)
  if (!token) {
    return null;
  }

  // User is authenticated, render children
  return children;
}
