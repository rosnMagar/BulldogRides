import type { AppSyncResolverHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/ride-request-operations';

// Configure Amplify using the proper helper
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env as Parameters<typeof getAmplifyDataClientConfig>[0]
);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

interface RespondToRequestArgs {
    requestID: string;
    response: 'ACCEPT' | 'DECLINE';
}

interface RespondToRequestResponse {
    success: boolean;
    error?: string;
}

export const handler: AppSyncResolverHandler<RespondToRequestArgs, RespondToRequestResponse> = async (event) => {
    const { requestID, response } = event.arguments;

    // SECURITY: Get user ID from authenticated identity
    const identity = event.identity as { sub?: string } | undefined;
    const driverID = identity?.sub;

    if (!driverID) {
        return {
            success: false,
            error: "Unauthorized: Could not identify user",
        };
    }

    if (response !== 'ACCEPT' && response !== 'DECLINE') {
        return {
            success: false,
            error: "Invalid response. Must be 'ACCEPT' or 'DECLINE'",
        };
    }

    try {
        // 1. Get the RideRequest
        const { data: rideRequest, errors: requestErrors } = await client.models.RideRequest.get({
            id: requestID
        });

        if (requestErrors || !rideRequest) {
            return {
                success: false,
                error: "Ride request not found",
            };
        }

        // 2. Check if request is still PENDING
        if (rideRequest.status !== 'PENDING') {
            return {
                success: false,
                error: `Request has already been ${(rideRequest.status || 'processed').toLowerCase()}`,
            };
        }

        // 3. Get the associated Ride
        const { data: ride, errors: rideErrors } = await client.models.Ride.get({
            id: rideRequest.rideID
        });

        if (rideErrors || !ride) {
            return {
                success: false,
                error: "Associated ride not found",
            };
        }

        // 4. SECURITY: Verify current user is the driver
        if (ride.driverID !== driverID) {
            return {
                success: false,
                error: "Unauthorized: You are not the driver of this ride",
            };
        }

        // 5. Process the response
        const newStatus = response === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

        // Update RideRequest status
        const { errors: updateErrors } = await client.models.RideRequest.update({
            id: requestID,
            status: newStatus,
        });

        if (updateErrors) {
            throw new Error(updateErrors[0]?.message || "Failed to update request status");
        }

        // 6. If accepted, create RidePassenger and update seats
        if (response === 'ACCEPT') {
            // Create RidePassenger record
            await client.models.RidePassenger.create({
                rideID: ride.id,
                passengerID: rideRequest.requesterID,
            });

            // Decrement seats available
            const newSeatsAvailable = Math.max(0, (ride.seatsAvailable || 1) - 1);

            // Update ride - set to FULL if no seats left
            await client.models.Ride.update({
                id: ride.id,
                seatsAvailable: newSeatsAvailable,
                status: newSeatsAvailable === 0 ? 'FULL' : ride.status,
            });
        }

        // 7. Get driver info for notification message
        const { data: driver } = await client.models.User.get({ id: driverID });
        const driverName = driver ? `${driver.firstName} ${driver.lastName}` : 'The driver';

        // 8. Create notification for the requester
        const notificationType = response === 'ACCEPT' ? 'REQUEST_ACCEPTED' : 'REQUEST_DECLINED';
        const notificationTitle = response === 'ACCEPT' ? 'Request Accepted! 🎉' : 'Request Declined';
        const notificationMessage = response === 'ACCEPT'
            ? `${driverName} accepted your ride request! You're all set for the trip.`
            : `${driverName} declined your ride request. Try finding another ride.`;

        await client.models.Notification.create({
            userID: rideRequest.requesterID,
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            read: false,
            relatedRideID: ride.id,
            relatedRequestID: requestID,
        });

        return { success: true };

    } catch (error) {
        console.error("Error responding to ride request:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to process request",
        };
    }
};
