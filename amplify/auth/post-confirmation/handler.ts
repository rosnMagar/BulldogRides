import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/post-confirmation";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
    env as Parameters<typeof getAmplifyDataClientConfig>[0]
);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
    const { email, given_name, family_name, phone_number, sub } = event.request.userAttributes;

    console.log(`Creating user profile: ${email}, ID: ${sub}`);

    try {
        await client.models.User.create({
            id: sub,
            email: email!,
            firstName: given_name || "",
            lastName: family_name || "",
            phone: phone_number || "",
            bio: "Truman Bulldog",
        });
        console.log(`User created successfully: ${sub}`);
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }

    return event;
};
