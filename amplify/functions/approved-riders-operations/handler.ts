import type { AppSyncResolverHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/approved-riders-operations';

// Configure Amplify using the proper helper
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env as Parameters<typeof getAmplifyDataClientConfig>[0]
);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

interface GetApprovedRidersArgs {
    rideID: string;
}

interface ApprovedRider {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null | undefined;
    joinedAt: string;
}

interface GetApprovedRidersResponse {
    success: boolean;
    error?: string;
    riders?: ApprovedRider[];
}

// Handler for getApprovedRiders query
export const handler: AppSyncResolverHandler<GetApprovedRidersArgs, GetApprovedRidersResponse> = async (event) => {
    const { rideID } = event.arguments;

    // SECURITY: Verify user is authenticated
    const identity = event.identity as { sub?: string } | undefined;
    const userID = identity?.sub;

    if (!userID) {
        return {
            success: false,
            error: "Unauthorized: Could not identify user",
        };
    }

    if (!rideID) {
        return {
            success: false,
            error: "rideID is required",
        };
    }

    try {
        // 1. Fetch all RidePassenger records for this ride
        const { data: passengerRecords, errors: passengerErrors } = await client.models.RidePassenger.list({
            filter: { rideID: { eq: rideID } }
        });

        if (passengerErrors) {
            throw new Error(passengerErrors[0]?.message || "Failed to fetch passengers");
        }

        // 2. Fetch user details for each passenger
        const riders: ApprovedRider[] = [];

        for (const record of passengerRecords || []) {
            const { data: user } = await client.models.User.get({ id: record.passengerID });

            if (user) {
                riders.push({
                    id: user.id,
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    profilePicture: user.profilePicture,
                    joinedAt: record.createdAt || new Date().toISOString(),
                });
            }
        }

        return {
            success: true,
            riders,
        };

    } catch (error) {
        console.error("Error fetching approved riders:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch approved riders",
        };
    }
};
