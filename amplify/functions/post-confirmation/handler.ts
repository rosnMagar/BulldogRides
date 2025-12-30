import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data"
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/post-confirmation";
import { type Schema } from "../../data/resource";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env as any);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
    const { email, given_name, family_name, phone_number, sub } = event.request.userAttributes;

    console.log(`Processing post-confirmation for user: ${event.userName}, email: ${email}, ID: ${sub}`);
    try{
        await client.models.User.create({
            id: sub,
            email: email!,
            firstName: given_name || "",
            lastName: family_name || "",
            phone: phone_number,
            bio: "Truman Bulldog"
        });
        console.log(`User created in database with ID: ${sub}`);
    } catch (error) {
        console.error("Error creating user in database:", error);
    }

    return event
}


