import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  role?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [authError, setAuthError] = useState<string | null>(null);
  
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/user', {
          credentials: 'include',
        });
        
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }
        
        return await res.json();
      } catch (err) {
        return null;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthError(null);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Login failed');
      }
      
      const data = await res.json();
      queryClient.setQueryData(['/api/auth/user'], data);
      return data;
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    }
  }, [queryClient]);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      setAuthError(null);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Registration failed');
      }
      
      return await res.json();
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.clear();
    } catch (err) {
      console.error('Logout failed', err);
    }
  }, [queryClient]);

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    error: authError || (error as Error)?.message,
  };
}
