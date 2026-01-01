import { generateClient } from "aws-amplify/api";
import type { Schema } from "../../amplify/data/resource";

// Single centralized Amplify client instance
export const client = generateClient<Schema>();

// Export types for convenience
export type { Schema };
