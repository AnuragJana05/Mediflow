import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  isAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  canApprove: boolean;
  canOverridePriority: boolean;
  canManageBeds: boolean;
  canChangeBedStatus: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('mediflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('mediflow_token');
      if (storedToken) {
        try {
          const me = await api.getMe();
          setUser(me);
          setToken(storedToken);
        } catch {
          // If token expired, auto-login as doctor for seamless demo
          await autoLoginDefault();
        }
      } else {
        await autoLoginDefault();
      }
      setIsLoading(false);
    };

    const autoLoginDefault = async () => {
      try {
        const res = await api.login('dr.smith@mediflow.health', 'doctor123');
        localStorage.setItem('mediflow_token', res.access_token);
        setToken(res.access_token);
        setUser({
          id: res.user_id,
          name: res.name,
          email: res.email,
          role: res.role as UserRole,
          status: 'active',
          department: 'Intensive Care & Emergency Medicine',
        });
      } catch {
        // Fallback offline object
        setUser({
          id: 2,
          name: 'Dr. Marcus Smith, MD',
          email: 'dr.smith@mediflow.health',
          role: 'doctor',
          status: 'active',
          department: 'Intensive Care & Emergency Medicine',
        });
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('mediflow_token', res.access_token);
      setToken(res.access_token);
      const me = await api.getMe();
      setUser(me);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mediflow_token');
    setToken(null);
    setUser(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const credentials: Record<UserRole, { email: string; pass: string }> = {
        admin: { email: 'admin@mediflow.health', pass: 'admin123' },
        doctor: { email: 'dr.smith@mediflow.health', pass: 'doctor123' },
        nurse: { email: 'nurse.clara@mediflow.health', pass: 'nurse123' },
      };
      const { email, pass } = credentials[role];
      const res = await api.login(email, pass);
      localStorage.setItem('mediflow_token', res.access_token);
      setToken(res.access_token);
      const me = await api.getMe();
      setUser(me);
    } catch (err) {
      console.error("Failed to switch role:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const role = user?.role;
  const isAdmin = role === 'admin';
  const isDoctor = role === 'doctor';
  const isNurse = role === 'nurse';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        switchDemoRole,
        isAdmin,
        isDoctor,
        isNurse,
        canApprove: isAdmin || isDoctor,
        canOverridePriority: isAdmin || isDoctor,
        canManageBeds: isAdmin,
        canChangeBedStatus: isAdmin || isDoctor || isNurse,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
