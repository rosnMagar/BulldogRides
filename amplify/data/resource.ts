import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  User: a
    .model({
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.string().required(),
      phone: a.string().required(),
      profilePicture: a.string(),
      bio: a.string(),

      // Relationships
      ridesAsDriver: a.hasMany('Ride', 'driverID'),
      ridesAsPassenger: a.hasMany('RidePassenger', 'passengerID'),
    })
    .authorization((allow) => [allow.owner(), allow.authenticated().to(['read'])]),

  Ride: a.model({
    type: a.enum(['OFFER', 'REQUEST']),
    status: a.enum(['OPEN', 'FULL', 'COMPLETED', 'CANCELLED']),

    // Time and Location
    pickupTime: a.datetime().required(),
    pickupLat: a.float().required(),
    pickupLong: a.float().required(),
    pickupAddress: a.string(),
    destinationLat: a.float().required(),
    destinationLong: a.float().required(),
    destinationAddress: a.string(),

    // Incentives
    reward: a.enum(['MEAL_SWIPES', 'HOSE_DINNER', 'GAS_MONEY', 'OTHER', 'NONE']),
    rewardDescription: a.string(),

    // Ride Details
    seatsAvailable: a.integer().default(3),

    // Relationships: DRIVER
    driverID: a.id(),
    driver: a.belongsTo('User', 'driverID'),

    // Relationships: PASSENGERS
    passengers: a.hasMany('RidePassenger', 'rideID'),
  }).authorization((allow) => [allow.authenticated()]),

  RidePassenger: a.model({
    rideID: a.id().required(),
    passengerID: a.id().required(),
    ride: a.belongsTo('Ride', 'rideID'),
    passenger: a.belongsTo('User', 'passengerID'),
  }).authorization((allow) => [allow.authenticated()]),

})

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  }
});
/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
