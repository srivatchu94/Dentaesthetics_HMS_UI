import React, { useState } from 'react';
import LoginModal from '../components/LoginModal';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    navigate('/');
  };

  const handleLoginSuccess = () => {
    // Get return location from state or sessionStorage
    const returnTo = location.state?.returnTo || sessionStorage.getItem('tokenExpiryLocation') || '/';
    
    // Clear the stored location
    sessionStorage.removeItem('tokenExpiryLocation');
    
    // Navigate to the return location
    navigate(returnTo);
  };

  return (
    <div className="min-h-screen">
      <LoginModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Login;
