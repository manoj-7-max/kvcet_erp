'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  _id?: string;
  name: string;
  role: string;
  department: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  selectedRole: string | null;
  login: (userData: User, token: string, role: string) => void;
  logout: () => void;
  setSelectedRole: (role: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedRole, setSelectedRoleState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('selectedRole');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const normalizedUser: User = {
          ...parsedUser,
          id: parsedUser.id || parsedUser._id,
          _id: parsedUser.id || parsedUser._id,
        };
        setUser(normalizedUser);
        setToken(storedToken);
        if (storedRole) setSelectedRoleState(storedRole);
      } catch (err) {
        console.error('Failed to parse stored auth user', err);
        // Clear broken storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('selectedRole');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, authToken: string, role: string) => {
    const normalizedUser: User = {
      ...userData,
      id: userData.id || userData._id || '',
      _id: userData.id || userData._id || '',
    };
    setUser(normalizedUser);
    setToken(authToken);
    setSelectedRoleState(role);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('token', authToken);
    localStorage.setItem('selectedRole', role);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSelectedRoleState(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('selectedRole');
    router.push('/');
  };

  const setSelectedRole = (role: string) => {
    setSelectedRoleState(role);
    localStorage.setItem('selectedRole', role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, selectedRole, login, logout, setSelectedRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
