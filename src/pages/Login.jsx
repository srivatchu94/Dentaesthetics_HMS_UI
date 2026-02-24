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
    // Always redirect to home page after login
    navigate('/');
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
