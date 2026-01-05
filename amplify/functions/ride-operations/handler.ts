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

interface GetMyRidesResponse {
    success: boolean;
    error?: string;
    asCreator?: any[];
    asDriver?: any[];
    asPassenger?: any[];
    all?: any[];
}

// Handler for getMyRides query
export const getMyRides: AppSyncResolverHandler<any, GetMyRidesResponse> = async (event) => {
    const identity = event.identity as { sub?: string } | undefined;
    const userID = identity?.sub;

    if (!userID) {
        return {
            success: false,
            error: "Unauthorized: Could not identify user",
        };
    }

    try {
        // 1. Rides created by the user
        const { data: creatorRides } = await client.models.Ride.list({
            filter: { creatorID: { eq: userID } }
        });

        // 2. Rides where user is the driver
        const { data: driverRides } = await client.models.Ride.list({
            filter: { driverID: { eq: userID } }
        });

        // 3. Rides where user is a passenger
        const { data: passengerRecords } = await client.models.RidePassenger.list({
            filter: { passengerID: { eq: userID } }
        });

        const asCreator = creatorRides || [];
        const asDriver = driverRides || [];

        // For passengers, we need to fetch the actual ride details with creator info
        const asPassenger = await Promise.all((passengerRecords || []).map(async (record) => {
            const { data: ride } = await client.models.Ride.get({ id: record.rideID });
            return ride;
        })).then(rides => rides.filter(r => !!r));

        // Helper to serialize ride with creator info
        const serializeRide = async (ride: any) => {
            // Fetch creator separately
            let creatorData = null;
            if (ride.creatorID) {
                const { data: creator } = await client.models.User.get({ id: ride.creatorID });
                if (creator) {
                    creatorData = {
                        id: creator.id,
                        firstName: creator.firstName,
                        lastName: creator.lastName,
                        email: creator.email,
                    };
                }
            }

            return {
                id: ride.id,
                type: ride.type,
                status: ride.status,
                creatorID: ride.creatorID,
                driverID: ride.driverID,
                pickupLat: ride.pickupLat,
                pickupLong: ride.pickupLong,
                pickupAddress: ride.pickupAddress,
                destinationLat: ride.destinationLat,
                destinationLong: ride.destinationLong,
                destinationAddress: ride.destinationAddress,
                pickupTime: ride.pickupTime,
                seatsAvailable: ride.seatsAvailable,
                reward: ride.reward,
                rewardDescription: ride.rewardDescription,
                createdAt: ride.createdAt,
                updatedAt: ride.updatedAt,
                creator: creatorData
            };
        };

        // Serialize all rides with creator info
        const serializedCreator = await Promise.all(asCreator.map(serializeRide));
        const serializedDriver = await Promise.all(asDriver.map(serializeRide));
        const serializedPassenger = await Promise.all(asPassenger.map(serializeRide));

        // Combine and unique by ID
        const allRidesMap = new Map<string, any>();
        [...serializedCreator, ...serializedDriver, ...serializedPassenger].forEach(r => {
            if (r) allRidesMap.set(r.id, r);
        });

        const allRidesList = Array.from(allRidesMap.values()).sort((a, b) => {
            return new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime();
        });

        return {
            success: true,
            asCreator: serializedCreator,
            asDriver: serializedDriver,
            asPassenger: serializedPassenger,
            all: allRidesList,
        };
    } catch (error) {
        console.error("Error fetching user rides:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch rides",
        };
    }
};

// Handler for createRide mutation
export const createSecureRide: AppSyncResolverHandler<CreateRideArgs, CreateRideResponse> = async (event) => {
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
        const { data: ride, errors } = await client.models.Ride.create({
            type: args.type,
            status: "OPEN",
            creatorID: driverID,
            driverID: args.type === 'OFFER' ? driverID : undefined,
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

// Main handler that routes to the appropriate function
export const handler: AppSyncResolverHandler<any, any> = async (event, context, callback) => {
    const fieldName = event.info?.fieldName || (event as any).fieldName;

    console.log('Event received:', JSON.stringify(event, null, 2));
    console.log('Resolved fieldName:', fieldName);

    switch (fieldName) {
        case 'getMyRides':
            return getMyRides(event, context, callback);
        case 'createSecureRide':
            return createSecureRide(event, context, callback);
        default:
            throw new Error(`Unknown field name: ${fieldName}`);
    }
};
