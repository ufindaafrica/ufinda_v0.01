import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  type: 'user' | 'landlord';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string, type: 'user' | 'landlord') => Promise<boolean>;
  signUp: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string, type: 'user' | 'landlord'): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // For now, use mock authentication for demo purposes
      // TODO: Replace with real API call when backend is connected
      if (email === 'demo@user.com' && password === 'password') {
        const userData: User = {
          id: 'demo-user-id',
          email: 'demo@user.com',
          firstName: 'Demo',
          lastName: 'User',
          type: 'user',
        };
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('auth_token', 'demo-token-user');
        setUser(userData);
        return true;
      } else if (email === 'demo@host.com' && password === 'password') {
        const userData: User = {
          id: 'demo-host-id',
          email: 'demo@host.com',
          firstName: 'Demo',
          lastName: 'Host',
          type: 'landlord',
        };
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('auth_token', 'demo-token-host');
        setUser(userData);
        return true;
      }
      
      // Real API call implementation (commented out for demo)
      /*
      const response = await apiCall(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password, type }),
      });

      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('auth_token', response.token);
      setUser(response.user);
      return true;
      */
      
      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (userData: Omit<User, 'id'> & { password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // For demo purposes, create a mock user
      // TODO: Replace with real API call when backend is connected
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        type: userData.type,
      };

      // Real API call implementation (commented out for demo)
      /*
      const response = await apiCall(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      await AsyncStorage.setItem('auth_token', response.token);
      setUser(response.user);
      */
      
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      await AsyncStorage.setItem('auth_token', `demo-token-${newUser.id}`);
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear local storage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('auth_token');
      
      // Real API call for logout (commented out for demo)
      /*
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        await apiCall(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
        }, token);
      }
      */
      
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};