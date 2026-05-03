import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosClient as axios } from '../lib/api';
import { tokenStorage, type AuthUser } from '../../../mtse-shared/src/auth';

interface AdminAuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
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

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', {
        email,
        password,
      });
      
      const { access_token, user: apiUser } = response.data;
      
      // Use the role provided by the backend to determine dashboard role
      let assignedRole = 'merchant';
      if (apiUser.role === 'SUPER_ADMIN') {
        assignedRole = 'platform_admin';
      }
      
      const authUser: AuthUser = { 
        ...apiUser, 
        roles: [assignedRole],
        tenantId: apiUser.tenantId
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
