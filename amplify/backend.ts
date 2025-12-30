import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { postConfirmation } from './functions/post-confirmation/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  postConfirmation,
});


// Grant the post-confirmation function access and update the data source
backend.data.resources.graphqlApi.grantQuery(backend.postConfirmation.resources.lambda);
backend.data.resources.graphqlApi.grantMutation(backend.postConfirmation.resources.lambda);