import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "manager" | "committee" | "gardener";
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

// Function to login user
export async function loginUser(credentials: LoginCredentials): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  return response.json();
}

// Function to register user
export async function registerUser(data: RegisterData): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/register", data);
  return response.json();
}

// Function to logout user
export async function logoutUser(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout", {});
}

// Function to get current authenticated user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch("/api/auth/current-user", {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error("Failed to fetch current user");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}
