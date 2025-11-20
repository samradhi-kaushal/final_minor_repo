import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// --- Type Definitions ---
interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Auth Provider Component ---
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    username: null,
    accessToken: null,
    refreshToken: null,
  });

  // Clear localStorage on mount/refresh - users should log out on refresh
  // This ensures users are logged out when the page refreshes
  useEffect(() => {
    // Clear all auth data from localStorage on every page refresh
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    // State is already initialized as not authenticated, so no need to update it
  }, []);

  const login = (username: string, accessToken: string, refreshToken: string) => {
    // 1. Store tokens and username
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('username', username);

    // 2. Update state
    setAuthState({
      isAuthenticated: true,
      username: username,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  };

  const logout = () => {
    localStorage.clear(); // Clear all auth data
    setAuthState({ isAuthenticated: false, username: null, accessToken: null, refreshToken: null });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Custom Hook to Consume Context ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};