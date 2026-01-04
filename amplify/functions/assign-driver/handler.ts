import type { AppSyncResolverHandler } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/assign-driver';

// Configure Amplify using the proper helper
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env as Parameters<typeof getAmplifyDataClientConfig>[0]
);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

interface AssignDriverArgs {
    rideID: string;
}

interface AssignDriverResponse {
    success: boolean;
    error?: string;
}

// Format date for notification message
function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export const handler: AppSyncResolverHandler<AssignDriverArgs, AssignDriverResponse> = async (event) => {
    const { rideID } = event.arguments;

    // SECURITY: Get driver ID from authenticated identity
    const identity = event.identity as { sub?: string } | undefined;
    const driverID = identity?.sub;

    if (!driverID) {
        return {
            success: false,
            error: "Unauthorized: Could not identify user",
        };
    }

    try {
        // 1. Get the ride
        const { data: ride, errors: rideErrors } = await client.models.Ride.get({
            id: rideID
        });

        if (rideErrors || !ride) {
            return {
                success: false,
                error: "Ride not found",
            };
        }

        // 2. Verify this is a REQUEST type ride (not an OFFER)
        if (ride.type !== 'REQUEST') {
            return {
                success: false,
                error: "Can only assign driver to ride requests",
            };
        }

        // 3. Verify no driver is already assigned
        if (ride.driverID) {
            return {
                success: false,
                error: "A driver is already assigned to this ride",
            };
        }

        // 4. Verify the driver is not the ride creator (can't assign yourself to your own request)
        if (ride.creatorID === driverID) {
            return {
                success: false,
                error: "You cannot assign yourself to your own ride request",
            };
        }

        // 5. Assign the driver to the ride
        const { errors: updateErrors } = await client.models.Ride.update({
            id: rideID,
            driverID: driverID,
            status: 'FULL',  // Mark as full since driver is now assigned
        });

        if (updateErrors) {
            throw new Error(updateErrors[0]?.message || "Failed to assign driver");
        }

        // 6. Get driver info for notification
        const { data: driver } = await client.models.User.get({ id: driverID });
        const driverName = driver ? `${driver.firstName} ${driver.lastName}` : 'A volunteer driver';

        // 7. Build ride details for notification
        const pickupLocation = ride.pickupAddress || `${ride.pickupLat.toFixed(4)}, ${ride.pickupLong.toFixed(4)}`;
        const destinationLocation = ride.destinationAddress || `${ride.destinationLat.toFixed(4)}, ${ride.destinationLong.toFixed(4)}`;
        const rideTime = formatDateTime(ride.pickupTime);

        // 8. Create notification for the ride creator
        await client.models.Notification.create({
            userID: ride.creatorID,
            type: 'DRIVER_ASSIGNED',
            title: 'Driver Assigned! 🚗',
            message: `${driverName} has volunteered to drive your ride from ${pickupLocation} to ${destinationLocation} on ${rideTime}.`,
            read: false,
            relatedRideID: rideID,
        });

        console.log(`Driver ${driverName} assigned to ride ${rideID}`);

        return { success: true };

    } catch (error) {
        console.error("Error assigning driver:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to assign driver",
        };
    }
};
