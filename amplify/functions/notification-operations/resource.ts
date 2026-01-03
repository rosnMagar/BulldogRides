import { defineFunction } from "@aws-amplify/backend";

export const notificationOperations = defineFunction({
    name: "notification-operations",
    entry: "./handler.ts",
    timeoutSeconds: 30,
});
