import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('agrios_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('agrios_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check token validation on load
    if (token) {
      // Decode or verify profile (simple verification)
      localStorage.setItem('agrios_token', token);
    } else {
      localStorage.removeItem('agrios_token');
      localStorage.removeItem('agrios_user');
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.msg || 'Login failed.');
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('agrios_token', data.token);
      localStorage.setItem('agrios_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.msg || 'Registration failed.');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('agrios_token', data.token);
      localStorage.setItem('agrios_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('agrios_token');
    localStorage.removeItem('agrios_user');
  };

  const upgradeSubscription = async (tier) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription_tier: tier })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.msg || 'Failed to update subscription.');
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('agrios_token', data.token);
      localStorage.setItem('agrios_user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      throw err;
    }
  };

  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    upgradeSubscription,
    getAuthHeaders
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
