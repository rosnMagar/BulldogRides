import { defineFunction } from "@aws-amplify/backend";

export const assignDriver = defineFunction({
    name: "assign-driver",
    entry: "./handler.ts",
});
