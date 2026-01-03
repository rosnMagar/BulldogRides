import { defineFunction } from "@aws-amplify/backend";

export const joinRide = defineFunction({
    name: "join-ride",
    entry: "./handler.ts",
    timeoutSeconds: 30,
    resourceGroupName: "data", // Assign to data stack since it uses Data API
});
