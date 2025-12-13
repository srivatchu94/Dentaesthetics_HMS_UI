import React, { useState } from 'react';
import LoginModal from '../components/LoginModal';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    navigate('/');
  };

  const handleLoginSuccess = () => {
    // Modal will close automatically on success, then navigate
    handleCloseModal();
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
