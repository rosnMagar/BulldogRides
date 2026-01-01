import { useEffect, useState, useCallback } from "react";
import { client, type Schema } from "../lib/amplifyClient";

type Ride = Schema["Ride"]["type"];
type RideStatus = "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";
type RideType = "OFFER" | "REQUEST";

// Constants
const DEFAULT_LIMIT = 20;

interface UseRidesOptions {
    statusFilter?: RideStatus | null;
    rideType?: RideType | null;
    excludePastRides?: boolean;
    limit?: number;
}

interface UseRidesReturn {
    rides: Ride[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useRides(options: UseRidesOptions = {}): UseRidesReturn {
    const {
        statusFilter = "OPEN",
        rideType = "OFFER",
        excludePastRides = true,
        limit = DEFAULT_LIMIT
    } = options;

    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRides = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Build filter object for server-side filtering
            const filter: Record<string, unknown> = {};

            if (statusFilter) {
                filter.status = { eq: statusFilter };
            }

            if (rideType) {
                filter.type = { eq: rideType };
            }

            // For future rides only
            if (excludePastRides) {
                filter.pickupTime = { gt: new Date().toISOString() };
            }

            // Query with server-side filtering
            const response = await client.models.Ride.list({
                filter: filter,
                limit: limit,
            });

            if (response.errors) {
                throw new Error(response.errors[0]?.message || "Failed to fetch rides");
            }

            let filteredRides = response.data || [];

            // Sort by pickup time (soonest first) - still done client-side
            filteredRides.sort((a, b) => {
                const dateA = new Date(a.pickupTime).getTime();
                const dateB = new Date(b.pickupTime).getTime();
                return dateA - dateB;
            });

            setRides(filteredRides);
        } catch (err) {
            console.error("Error fetching rides:", err);
            setError("Failed to load rides. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, rideType, excludePastRides, limit]);

    useEffect(() => {
        fetchRides();
    }, [fetchRides]);

    return { rides, loading, error, refetch: fetchRides };
}
