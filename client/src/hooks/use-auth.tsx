import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { API_BASE_URL } from "@/lib/api";

interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  address?: string; // NAYA FIELD
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<any>; // Changed to return a Promise
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LAST_USER_KEY = "shirur_last_user";

function readLastUser(): User | null {
  try {
    const raw = localStorage.getItem(LAST_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      // Using fetch to get the current user
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: "include" });
      if (!res.ok) {
        // 401/404 = server says there is no valid session: really logged out.
        if (res.status === 401 || res.status === 404) {
          localStorage.removeItem(LAST_USER_KEY);
          return null;
        }
        throw new Error("Failed to fetch user");
      }
      const json = await res.json();
      if (json?.user) localStorage.setItem(LAST_USER_KEY, JSON.stringify(json.user));
      return json;
    },
    // Network drops (app resuming, Render waking up) or 5xx are NOT a logout:
    // retry with backoff instead of bouncing providers to /login.
    retry: 4,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // If the check still couldn't reach the server, keep showing the last known
  // user. The session cookie is still sent, and the server still enforces auth.
  const fallbackUser = isError && data === undefined ? readLastUser() : null;

  // 💥 BUG FIX #2 IS HERE 💥
  // This is the corrected logout mutation logic.
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // We use standard 'fetch' for maximum reliability.
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        // 'credentials: "include"' is essential for sending the session cookie.
        credentials: "include",
      });

      // If the server gives an error, we throw an error to be caught by the caller.
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Logout request failed' }));
        throw new Error(errorData.message || 'Failed to logout');
      }

      // If everything is okay, return the server's response.
      return response.json();
    },
    onSuccess: () => {
      // On success, we manually set the user's data to 'null' in the client's cache.
      // This instantly updates the UI without causing a confusing refetch.
      localStorage.removeItem(LAST_USER_KEY);
      queryClient.setQueryData(["/api/auth/me"], null);
    },
    onError: (error) => {
      // For debugging, we log any errors that occur during the mutation.
      console.error("Logout mutation error:", error);
    }
  });

  const user = data?.user || fallbackUser || null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        // We now export 'mutateAsync' so the header component can 'await' it.
        logout: () => logoutMutation.mutateAsync(),
      }}
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