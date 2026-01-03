import { defineFunction } from "@aws-amplify/backend";

export const rideOperations = defineFunction({
    name: "ride-operations",
    entry: "./handler.ts",
    timeoutSeconds: 30,
});
