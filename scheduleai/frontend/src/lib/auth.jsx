import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('g-token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('g-user')); } catch { return null; }
  });

  const signIn = (credential, userInfo) => {
    localStorage.setItem('g-token', credential);
    localStorage.setItem('g-user', JSON.stringify(userInfo));
    setToken(credential);
    setUser(userInfo);
  };

  const signOut = () => {
    localStorage.removeItem('g-token');
    localStorage.removeItem('g-user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, signIn, signOut, isSignedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
