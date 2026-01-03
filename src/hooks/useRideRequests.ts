import { useState, useCallback } from "react";
import { client } from "../lib/amplifyClient";

interface UseRideRequestsReturn {
    loading: boolean;
    error: string | null;
    createRequest: (rideID: string, message?: string) => Promise<boolean>;
}

export function useRideRequests(): UseRideRequestsReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createRequest = useCallback(async (
        rideID: string,
        message?: string
    ): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            // Call the secure Lambda-backed GraphQL mutation
            // User ID is determined server-side from the authenticated identity
            const { data, errors } = await client.mutations.joinRide({
                rideID,
                message
            });

            if (errors || !data?.success) {
                throw new Error(data?.error || errors?.[0]?.message || "Failed to join ride");
            }

            return true;
        } catch (err: any) {
            console.error("Error creating ride request:", err);
            setError(err.message || "Failed to send request");
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        createRequest,
    };
}
