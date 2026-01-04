import type { AppSyncResolverHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/ride-operations';

// Configure Amplify using the proper helper
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env as Parameters<typeof getAmplifyDataClientConfig>[0]
);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

// Types for createRide mutation
interface CreateRideArgs {
    type: 'OFFER' | 'REQUEST';
    pickupLat: number;
    pickupLong: number;
    pickupAddress?: string;
    destinationLat: number;
    destinationLong: number;
    destinationAddress?: string;
    pickupTime: string;
    seatsAvailable: number;
    reward?: string;
    rewardDescription?: string;
}

interface CreateRideResponse {
    success: boolean;
    error?: string;
    rideID?: string;
}

// Handler for createRide mutation
export const handler: AppSyncResolverHandler<CreateRideArgs, CreateRideResponse> = async (event) => {
    const args = event.arguments;

    // SECURITY: Get user ID from authenticated identity
    const identity = event.identity as { sub?: string } | undefined;
    const driverID = identity?.sub;

    if (!driverID) {
        return {
            success: false,
            error: "Unauthorized: Could not identify user",
        };
    }

    try {
        // Validate pickup time is in the future
        const pickupDate = new Date(args.pickupTime);
        if (pickupDate <= new Date()) {
            return {
                success: false,
                error: "Pickup time must be in the future",
            };
        }

        // Validate seats
        if (args.seatsAvailable < 1 || args.seatsAvailable > 10) {
            return {
                success: false,
                error: "Seats available must be between 1 and 10",
            };
        }

        // Create the ride with verified user ID
        // For OFFER: user is the driver
        // For REQUEST: user is the creator (driver assigned later)
        const { data: ride, errors } = await client.models.Ride.create({
            type: args.type,
            status: "OPEN",
            creatorID: driverID, // Server-verified user ID - always set as creator
            driverID: args.type === 'OFFER' ? driverID : undefined, // Only set driver for OFFER type
            pickupLat: args.pickupLat,
            pickupLong: args.pickupLong,
            pickupAddress: args.pickupAddress || undefined,
            destinationLat: args.destinationLat,
            destinationLong: args.destinationLong,
            destinationAddress: args.destinationAddress || undefined,
            pickupTime: args.pickupTime,
            seatsAvailable: args.seatsAvailable,
            reward: args.reward as any,
            rewardDescription: args.rewardDescription || undefined,
        });

        if (errors) {
            throw new Error(errors[0]?.message || "Failed to create ride");
        }

        return {
            success: true,
            rideID: ride?.id,
        };

    } catch (error) {
        console.error("Error creating ride:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create ride",
        };
    }
};
