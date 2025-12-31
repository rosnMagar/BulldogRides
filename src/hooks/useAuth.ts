import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import type { AuthContextType } from "../types/auth";

/**
 * useAuth - Hook for consuming auth context
 * 
 * Usage:
 *   const { user, isAuthenticated, isLoading, signOut } = useAuth();
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    return context;
}
