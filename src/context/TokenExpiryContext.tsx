import React, { createContext, useContext, useState } from 'react';

interface TokenExpiryContextType {
  showTokenExpiryModal: boolean;
  setShowTokenExpiryModal: (show: boolean) => void;
  previousLocation: string | null;
  setPreviousLocation: (location: string | null) => void;
}

const TokenExpiryContext = createContext<TokenExpiryContextType | undefined>(undefined);

export const TokenExpiryProvider = ({ children }: { children: React.ReactNode }) => {
  const [showTokenExpiryModal, setShowTokenExpiryModal] = useState(false);
  const [previousLocation, setPreviousLocation] = useState<string | null>(null);

  return (
    <TokenExpiryContext.Provider
      value={{
        showTokenExpiryModal,
        setShowTokenExpiryModal,
        previousLocation,
        setPreviousLocation
      }}
    >
      {children}
    </TokenExpiryContext.Provider>
  );
};

export const useTokenExpiry = (): TokenExpiryContextType => {
  const context = useContext(TokenExpiryContext);
  if (context === undefined) {
    throw new Error('useTokenExpiry must be used within TokenExpiryProvider');
  }
  return context;
};
