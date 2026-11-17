'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState({
    name: 'Alex Mercer',
    email: 'alex.mercer@cyber-ops.internal',
    role: 'Lead Security Analyst',
    badgeId: 'SEC-8942',
    avatar: '🛡️',
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const login = useCallback((name, role) => {
    setUser((prev) => ({
      ...prev,
      name: name || 'Security Analyst',
      role: role || 'Junior Analyst',
    }));
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const switchRole = useCallback((role) => {
    setUser((prev) => ({ ...prev, role }));
  }, []);

  const value = {
    user,
    isAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    login,
    logout,
    switchRole,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

