import { useEffect, useState, useCallback } from "react";
import { client, type Schema } from "../lib/amplifyClient";
import { useAuth } from "./useAuth";

type Ride = Schema["Ride"]["type"];

interface UserRides {
    asCreator: Ride[];
    asDriver: Ride[];
    asPassenger: Ride[];
    all: Ride[];
}

interface UseUserRidesReturn {
    rides: UserRides;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useUserRides(): UseUserRidesReturn {
    const { user } = useAuth();
    const [rides, setRides] = useState<UserRides>({
        asCreator: [],
        asDriver: [],
        asPassenger: [],
        all: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserRides = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            // Use the custom API instead of direct model access
            const { data, errors } = await client.queries.getMyRides({});

            if (errors || !data?.success) {
                throw new Error(data?.error || errors?.[0]?.message || "Failed to fetch rides");
            }

            // Parse JSON fields - they may be stringified or already objects
            const parseJsonField = (field: any): any[] => {
                if (!field) return [];
                if (Array.isArray(field)) return field;
                if (typeof field === 'string') {
                    try {
                        const parsed = JSON.parse(field);
                        return Array.isArray(parsed) ? parsed : [];
                    } catch {
                        return [];
                    }
                }
                return [];
            };

            setRides({
                asCreator: parseJsonField(data.asCreator),
                asDriver: parseJsonField(data.asDriver),
                asPassenger: parseJsonField(data.asPassenger),
                all: parseJsonField(data.all)
            });
        } catch (err: any) {
            console.error("Error fetching user rides:", err);
            setError("Failed to load your rides.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchUserRides();
    }, [fetchUserRides]);

    return { rides, loading, error, refetch: fetchUserRides };
}
