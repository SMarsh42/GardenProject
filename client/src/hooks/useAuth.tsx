import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "manager" | "committee" | "gardener";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (userData: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  
  // Query to fetch current user on initial load
  const { isLoading } = useQuery({
    queryKey: ['/api/auth/current-user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/current-user', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            return null;
          }
          throw new Error('Failed to fetch current user');
        }
        
        const userData = await response.json();
        setUser(userData);
        return userData;
      } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      return response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      return response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout', {});
    },
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
    },
  });

  const login = async (username: string, password: string): Promise<User> => {
    return loginMutation.mutateAsync({ username, password });
  };

  const register = async (userData: RegisterData): Promise<User> => {
    return registerMutation.mutateAsync(userData);
  };

  const logout = async (): Promise<void> => {
    return logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider 
      value={
        {
          user,
          loading: isLoading,
          login,
          register,
          logout
        }
      }
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}