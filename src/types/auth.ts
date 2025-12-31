import type { Schema } from "../../amplify/data/resource";

// The shape of a User from DynamoDB
export type User = Schema["User"]["type"];

// What the auth context provides to consumers
export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signOut: () => Promise<void>;
}
