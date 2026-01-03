import type { AppSyncResolverHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/join-ride';

// Configure Amplify using the proper helper
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env as Parameters<typeof getAmplifyDataClientConfig>[0]
);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

interface JoinRideArgs {
    rideID: string;
    requesterID: string;
    message?: string;
}

interface JoinRideResponse {
    success: boolean;
    error?: string;
    request?: Record<string, unknown>;
}

export const handler: AppSyncResolverHandler<JoinRideArgs, JoinRideResponse> = async (event) => {
    const { rideID, message } = event.arguments;

    // SECURITY: Get user ID from authenticated identity, not from client arguments
    const identity = event.identity as { sub?: string; username?: string } | undefined;
    const requesterID = identity?.sub;

    if (!requesterID) {
        return {
            success: false,
            error: "Unauthorized: Could not identify user",
        };
    }

    try {
        // Check if user already requested this ride
        const { data: existingRequests } = await client.models.RideRequest.list({
            filter: {
                requesterID: { eq: requesterID },
                rideID: { eq: rideID },
            }
        });

        if (existingRequests && existingRequests.length > 0) {
            return {
                success: false,
                error: "You have already requested to join this ride",
            };
        }

        // Get the ride
        const { data: ride } = await client.models.Ride.get({ id: rideID });

        if (!ride) {
            return {
                success: false,
                error: "Ride not found",
            };
        }

        if (ride.seatsAvailable && ride.seatsAvailable <= 0) {
            return {
                success: false,
                error: "Ride is full. No seats available",
            };
        }

        if (ride.driverID === requesterID) {
            return {
                success: false,
                error: "You cannot join your own ride",
            };
        }

        // Create ride request
        const { data: request, errors } = await client.models.RideRequest.create({
            rideID,
            requesterID,
            message,
            status: "PENDING",
        });

        if (errors) {
            throw new Error(errors[0].message || "Failed to create request");
        }

        // Create notification for the driver
        const { data: requester } = await client.models.User.get({ id: requesterID });

        await client.models.Notification.create({
            userID: ride?.driverID || "",
            type: "RIDE_REQUEST",
            title: "New Ride Request",
            message: `${requester?.firstName} ${requester?.lastName} has requested to join your ride`,
            read: false,
            relatedRideID: rideID,
            relatedRequestID: request?.id || "",
        });

        return {
            success: true,
            request: request ? { id: request.id, status: request.status } : undefined,
        };

    } catch (error) {
        console.error("Error creating ride request:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Internal Server Error",
        };
    }
};