import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      // Using fetch to get the current user
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        // If the status is 401 (not authenticated), we don't throw an error,
        // we just return null because it's an expected state.
        if (res.status === 401) {
          return null;
        }
        throw new Error("Failed to fetch user");
      }
      return res.json();
    },
    retry: false, // Don't retry on failure
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 💥 BUG FIX #2 IS HERE 💥
  // This is the corrected logout mutation logic.
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // We use standard 'fetch' for maximum reliability.
      const response = await fetch("/api/auth/logout", {
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
      queryClient.setQueryData(["/api/auth/me"], null);
    },
    onError: (error) => {
      // For debugging, we log any errors that occur during the mutation.
      console.error("Logout mutation error:", error);
    }
  });

  const user = data?.user || null;
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