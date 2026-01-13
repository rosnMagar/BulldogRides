import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { joinRide } from '../functions/join-ride/resource';
import { postConfirmation } from '../auth/post-confirmation/resource';
import { notificationOperations } from '../functions/notification-operations/resource';
import { rideOperations } from '../functions/ride-operations/resource';
import { rideRequestOperations } from '../functions/ride-request-operations/resource';
import { assignDriver } from '../functions/assign-driver/resource';
import { approvedRidersOperations } from '../functions/approved-riders-operations/resource';

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
      vehicleDescription: a.string(),
      vehiclePicture: a.string(),

      // Relationships
      ridesAsDriver: a.hasMany('Ride', 'driverID'),
      ridesAsCreator: a.hasMany('Ride', 'creatorID'),
      ridesAsPassenger: a.hasMany('RidePassenger', 'passengerID'),
      rideRequests: a.hasMany('RideRequest', 'requesterID'),
      notifications: a.hasMany('Notification', 'userID'),
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

    // Relationships: CREATOR (who posted the ride)
    creatorID: a.id().required(),
    creator: a.belongsTo('User', 'creatorID'),

    // Relationships: PASSENGERS
    passengers: a.hasMany('RidePassenger', 'rideID'),
    requests: a.hasMany('RideRequest', 'rideID'),
  }).authorization((allow) => [allow.authenticated()]),

  RidePassenger: a.model({
    rideID: a.id().required(),
    passengerID: a.id().required(),
    ride: a.belongsTo('Ride', 'rideID'),
    passenger: a.belongsTo('User', 'passengerID'),
  }).authorization((allow) => [allow.authenticated()]),

  // Join requests from riders wanting to join a ride
  // SECURITY: Users can only read. Creation happens via joinRide mutation (Lambda)
  RideRequest: a.model({
    status: a.enum(['PENDING', 'ACCEPTED', 'DECLINED']),
    message: a.string(), // Optional message from requester

    // Relationships
    rideID: a.id().required(),
    ride: a.belongsTo('Ride', 'rideID'),
    requesterID: a.id().required(),
    requester: a.belongsTo('User', 'requesterID'),
  }).authorization((allow) => [
    allow.authenticated().to(['read'])  // Users can read requests (filtered by AppSync)
    // Creation happens only via Lambda (joinRide mutation)
  ]),

  // In-app notifications
  Notification: a.model({
    type: a.enum(['RIDE_REQUEST', 'REQUEST_ACCEPTED', 'REQUEST_DECLINED', 'RIDE_REMINDER', 'DRIVER_ASSIGNED']),
    title: a.string().required(),
    message: a.string().required(),
    read: a.boolean().default(false),

    // Recipient
    userID: a.id().required(),
    user: a.belongsTo('User', 'userID'),

    // Related entities (optional)
    relatedRideID: a.id(),
    relatedRequestID: a.id(),
  }).authorization((allow) => [allow.owner()]),

  // Custom response type for joinRide mutation
  JoinRideResponse: a.customType({
    success: a.boolean(),
    error: a.string(),
    request: a.json()
  }),

  // Custom type for notification item
  NotificationItem: a.customType({
    id: a.string(),
    type: a.string(),
    title: a.string(),
    message: a.string(),
    read: a.boolean(),
    userID: a.string(),
    relatedRideID: a.string(),
    relatedRequestID: a.string(),
    relatedRequestStatus: a.string(),
    createdAt: a.string(),
    updatedAt: a.string(),
  }),

  // Custom response type for getMyNotifications query
  GetNotificationsResponse: a.customType({
    success: a.boolean(),
    error: a.string(),
    notifications: a.json(),
    unreadCount: a.integer(),
  }),

  // Custom response type for markNotificationAsRead mutation
  MarkAsReadResponse: a.customType({
    success: a.boolean(),
    error: a.string(),
  }),

  // Custom mutation for joining a ride (server-side validation)
  joinRide: a.mutation()
    .arguments({
      rideID: a.string().required(),
      message: a.string()
    })
    .returns(a.ref('JoinRideResponse'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(joinRide)),

  // Custom query for getting user's notifications (server-side identity)
  getMyNotifications: a.query()
    .arguments({})
    .returns(a.ref('GetNotificationsResponse'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(notificationOperations)),

  // Custom mutation for marking notification as read (server-side identity)
  markNotificationAsRead: a.mutation()
    .arguments({
      notificationID: a.string().required()
    })
    .returns(a.ref('MarkAsReadResponse'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(notificationOperations)),

  // Custom response type for createRide mutation
  CreateRideResponse: a.customType({
    success: a.boolean(),
    error: a.string(),
    rideID: a.string(),
  }),

  // Custom mutation for creating a ride (server-side identity for driverID)
  createSecureRide: a.mutation()
    .arguments({
      type: a.string().required(),
      pickupLat: a.float().required(),
      pickupLong: a.float().required(),
      pickupAddress: a.string(),
      destinationLat: a.float().required(),
      destinationLong: a.float().required(),
      destinationAddress: a.string(),
      pickupTime: a.string().required(),
      seatsAvailable: a.integer().required(),
      reward: a.string(),
      rewardDescription: a.string(),
    })
    .returns(a.ref('CreateRideResponse'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(rideOperations)),

  // Custom response type for respondToRideRequest mutation
  RespondToRequestResponse: a.customType({
    success: a.boolean(),
    error: a.string(),
  }),

  // Custom mutation for responding to a ride request (accept/decline)
  respondToRideRequest: a.mutation()
    .arguments({
      requestID: a.string().required(),
      response: a.string().required(),  // 'ACCEPT' or 'DECLINE'
    })
    .returns(a.ref('RespondToRequestResponse'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(rideRequestOperations)),

  // Custom response type for getMyRides query
  GetMyRidesResponse: a.customType({
    success: a.boolean(),
    error: a.string(),
    asCreator: a.json(),
    asDriver: a.json(),
    asPassenger: a.json(),
    all: a.json(),
  }),

  // Custom response type for assignDriverToRide mutation
  AssignDriverResponse: a.customType({
    success: a.boolean(),
    error: a.string(),
  }),

  // Custom mutation for driver to assign themselves to a ride request
  assignDriverToRide: a.mutation()
    .arguments({
      rideID: a.string().required(),
    })
    .returns(a.ref('AssignDriverResponse'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(assignDriver)),

  // Custom query for getting user's rides (server-side identity)
  getMyRides: a.query()
    .arguments({})
    .returns(a.ref('GetMyRidesResponse'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(rideOperations)),

  // Custom type for approved rider item
  ApprovedRiderItem: a.customType({
    id: a.string(),
    firstName: a.string(),
    lastName: a.string(),
    profilePicture: a.string(),
    joinedAt: a.string(),
  }),

  // Custom response type for getApprovedRiders query
  GetApprovedRidersResponse: a.customType({
    success: a.boolean(),
    error: a.string(),
    riders: a.json(),
  }),

  // Custom query for getting approved riders for a ride
  getApprovedRiders: a.query()
    .arguments({
      rideID: a.string().required(),
    })
    .returns(a.ref('GetApprovedRidersResponse'))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(approvedRidersOperations)),

}).authorization((allow) => [allow.resource(postConfirmation), allow.resource(joinRide), allow.resource(notificationOperations), allow.resource(rideOperations), allow.resource(rideRequestOperations), allow.resource(assignDriver), allow.resource(approvedRidersOperations)]);

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
