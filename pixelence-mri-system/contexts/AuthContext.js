import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

const AuthContext = createContext({});

const COOKIE_NAME = 'pixelence_auth_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for secure cookie on mount
    const storedUser = Cookies.get(COOKIE_NAME);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored session:', error);
        Cookies.remove(COOKIE_NAME);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Save to secure cookie instead of localStorage
    // - secure: true (only sent over HTTPS)
    // - sameSite: 'strict' (prevents CSRF)
    // - expires: 1 day
    Cookies.set(COOKIE_NAME, JSON.stringify(userData), { 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      expires: 1
    });
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove(COOKIE_NAME);
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}