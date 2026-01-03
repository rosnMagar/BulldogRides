import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from './post-confirmation/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Welcome to Bulldog Rides - Verify your email',
      // verificationEmailBody: (createdCode) => `Welcome to Bulldog Rides! Please verify your email using the code: ${createdCode()}.\\nThis Expires in 15 minutes.`,
    },
  },
  senders: {
    email: {
      fromEmail: "noreply.bulldogrides@gmail.com",
    }
  },
  userAttributes: {
    "phoneNumber": { required: false, mutable: true }
  },
  triggers: {
    postConfirmation
  }
});
