import { useState, useCallback } from "react";
import { client } from "../lib/amplifyClient";

interface UseDriverAssignmentReturn {
    loading: boolean;
    error: string | null;
    assignDriver: (rideID: string) => Promise<boolean>;
}

export function useDriverAssignment(): UseDriverAssignmentReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const assignDriver = useCallback(async (rideID: string): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Call the secure Lambda-backed GraphQL mutation
            // Driver ID is determined server-side from the authenticated identity
            const { data, errors } = await client.mutations.assignDriverToRide({
                rideID,
            });

            if (errors || !data?.success) {
                throw new Error(data?.error || errors?.[0]?.message || "Failed to assign driver");
            }

            return true;
        } catch (err: any) {
            console.error("Error assigning driver:", err);
            setError(err.message || "Failed to assign driver");
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        assignDriver,
    };
}
