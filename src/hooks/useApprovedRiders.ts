import { useState, useEffect } from 'react';
import { client } from '../lib/amplifyClient';

interface ApprovedRider {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string | null;
    joinedAt: string;
}

interface UseApprovedRidersResult {
    riders: ApprovedRider[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useApprovedRiders(rideID: string | undefined): UseApprovedRidersResult {
    const [riders, setRiders] = useState<ApprovedRider[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchApprovedRiders = async () => {
        if (!rideID) {
            setRiders([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, errors } = await client.queries.getApprovedRiders({ rideID });

            if (errors) {
                throw new Error(errors[0]?.message || 'Failed to fetch approved riders');
            }

            if (data?.success && data.riders) {
                // Parse riders if it's JSON, otherwise use directly
                const ridersData = typeof data.riders === 'string'
                    ? JSON.parse(data.riders)
                    : data.riders;

                // Ensure it's an array
                if (Array.isArray(ridersData)) {
                    setRiders(ridersData as ApprovedRider[]);
                } else {
                    console.error('Riders data is not an array:', ridersData);
                    setRiders([]);
                }
            } else if (data?.error) {
                setError(data.error);
            } else {
                // No error but no riders either
                setRiders([]);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch approved riders';
            setError(errorMessage);
            console.error('Error fetching approved riders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovedRiders();
    }, [rideID]);

    return {
        riders,
        loading,
        error,
        refresh: fetchApprovedRiders,
    };
}
