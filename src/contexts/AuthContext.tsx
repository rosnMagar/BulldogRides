import { getCurrentUser, signOut as amplifySignOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import type { AuthContextType, User } from "../types/auth";

// Initialize DynamoDB client
const client = generateClient<Schema>();

// Export the context so the useAuth hook can consume it
export const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    signOut: async () => { },
});

// 2. PROVIDER COMPONENT (fills the bucket with real data)
//    This wraps your app and provides auth state to all children
interface AuthProviderProps {
    children: ReactNode;  // Whatever components are wrapped by this provider
}

export function AuthProvider({ children }: AuthProviderProps) {
    // Local state - this is the ACTUAL data that will be shared
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check auth status when the app loads
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Listen to Amplify Hub auth events (signedIn, signedOut, etc.)
    // This ensures AuthContext updates when user logs in via the Authenticator component
    useEffect(() => {
        const hubListener = Hub.listen('auth', ({ payload }) => {
            switch (payload.event) {
                case 'signedIn':
                    checkAuthStatus();
                    break;
                case 'signedOut':
                    setUser(null);
                    setIsAuthenticated(false);
                    break;
            }
        });

        // Cleanup listener on unmount
        return () => hubListener();
    }, []);

    // This function checks if there's an existing session (JWT in localStorage)
    const checkAuthStatus = async () => {
        try {
            // Amplify caches the session - this doesn't hit the server every time
            const cognitoUser = await getCurrentUser();

            // User is authenticated via Cognito - mark as authenticated immediately
            setIsAuthenticated(true);

            // Try to fetch the database user (your User model in DynamoDB)
            // This might not exist yet if the post-confirmation Lambda is still running
            const { data: dbUser } = await client.models.User.get({ id: cognitoUser.userId });

            if (dbUser) {
                setUser(dbUser);
            }
            // Note: Even if dbUser is null, user is still authenticated via Cognito
        } catch (error) {
            // No session found - user is not logged in
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            // Always stop loading, whether success or failure
            setIsLoading(false);
        }
    };

    // Sign out function that clears both Amplify session and local state
    const handleSignOut = async () => {
        await amplifySignOut();
        setUser(null);
        setIsAuthenticated(false);
    };

    // The value we're providing to all children
    const contextValue: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        signOut: handleSignOut,
    };

    // Return the Provider with our state as the value
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}