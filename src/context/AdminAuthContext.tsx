import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { tokenStorage, type AuthUser } from '../../../mtse-shared/src/auth';

interface AdminAuthContextType {
  user: AuthUser | null;
  login: (email: string, role: 'platform_admin' | 'merchant') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check simulated local storage (now cookies)
    const stored = tokenStorage.getUser();
    if (stored && (stored.roles.includes('platform_admin') || stored.roles.includes('merchant'))) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, roleFallback: 'platform_admin' | 'merchant') => {
    try {
      const response = await axios.post('http://localhost:3000/auth/login', {
        email,
        role: roleFallback === 'platform_admin' ? 'admin' : 'merchant'
      });
      
      const { access_token, user: apiUser } = response.data;
      
      // Enrich user with role for the admin dashboard
      const authUser: AuthUser = { 
        ...apiUser, 
        roles: [roleFallback],
        tenantId: email.includes('merchant') ? `${email.split('@')[0]}_store` : undefined
      };

      setUser(authUser);
      tokenStorage.setTokens({ accessToken: access_token });
      tokenStorage.setUser(authUser);
    } catch (error) {
      console.error('Admin login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    tokenStorage.clearTokens();
    setUser(null);
  };

  if (isLoading) return <div>Loading Application...</div>;

  return (
    <AdminAuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return context;
};
