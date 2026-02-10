import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [showOnboardStaffModal, setShowOnboardStaffModal] = useState(false);

  const openOnboardStaffModal = () => {
    setShowOnboardStaffModal(true);
  };

  const closeOnboardStaffModal = () => {
    setShowOnboardStaffModal(false);
  };

  return (
    <ModalContext.Provider
      value={{
        showOnboardStaffModal,
        openOnboardStaffModal,
        closeOnboardStaffModal,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};
