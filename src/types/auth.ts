import type { Schema } from "../../amplify/data/resource";

// The shape of a User from DynamoDB
export type User = Schema["User"]["type"];

// App mode - driver or rider
export type AppMode = "driver" | "rider";

// What the auth context provides to consumers
export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signOut: () => Promise<void>;
    // App mode
    mode: AppMode;
    isDriver: boolean;
    isRider: boolean;
    toggleMode: () => void;
}
