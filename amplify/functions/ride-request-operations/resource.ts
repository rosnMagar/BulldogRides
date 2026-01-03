import { defineFunction } from "@aws-amplify/backend";

export const rideRequestOperations = defineFunction({
    name: "ride-request-operations",
    entry: "./handler.ts",
    timeoutSeconds: 30,
});
