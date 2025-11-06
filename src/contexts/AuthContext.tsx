import React, { createContext, useContext, useState, useEffect } from 'react';
import { executeQuery } from '@/lib/database';

interface User {
  id: number;
  email: string;
  role: 'clinician' | 'patient';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isClinicianRole: boolean;
  isPatientRole: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('dermaUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const results = executeQuery(
        'SELECT id, email, role FROM users WHERE email = ? AND password = ?',
        [email, password]
      );

      if (results.length > 0) {
        const userData = results[0] as User;
        setUser(userData);
        localStorage.setItem('dermaUser', JSON.stringify(userData));
        console.log('Login successful:', userData);
        return true;
      }
      
      console.log('Login failed: Invalid credentials');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dermaUser');
    console.log('User logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isClinicianRole: user?.role === 'clinician',
        isPatientRole: user?.role === 'patient',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
