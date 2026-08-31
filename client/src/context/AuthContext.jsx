import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../shared/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('erp_user');
    const token = localStorage.getItem('erp_access_token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('erp_user');
      }
    }
    setLoading(false);

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const loginUser = (authData) => {
    const { accessToken, refreshToken, user: userData } = authData;
    setUser(userData);
    localStorage.setItem('erp_access_token', accessToken);
    if (refreshToken) localStorage.setItem('erp_refresh_token', refreshToken);
    localStorage.setItem('erp_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('erp_access_token');
    localStorage.removeItem('erp_refresh_token');
    localStorage.removeItem('erp_user');
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
