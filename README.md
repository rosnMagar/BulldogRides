# BulldogRides

A free ride-share platform built for the Kirksville community, connecting students and community members who need rides with those willing to offer them.

## Mission

BulldogRides aims to provide a **completely free ride-sharing platform** for the Kirksville community. Our goal is to make transportation accessible to everyone while fostering community connection and collaboration.

## Features

- **Interactive Map Interface**: Visualize pickup and destination locations using Leaflet maps
- **Real-time Notifications**: Stay updated on ride requests, approvals, and driver assignments
- **User Profiles**: Manage your profile and view ride history
- **Ride Management**: Create, view, and join ride requests
- **Secure Authentication**: AWS Cognito-based user authentication
- **Responsive Design**: Mobile-friendly UI built with Mantine components

## Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Mantine UI v8.3
- **Routing**: React Router v7
- **Maps**: Leaflet & React Leaflet
- **Icons**: Tabler Icons
- **State Management**: React Context API
- **Date Handling**: Day.js

### Backend (AWS Amplify Gen 2)
- **Authentication**: AWS Cognito (via Amplify Auth)
- **Database**: AWS DynamoDB
- **API**: AWS AppSync (GraphQL)
- **Serverless Functions**: AWS Lambda
- **Infrastructure**: AWS CDK

### Lambda Functions
The backend includes several Lambda functions for secure server-side operations:
- `ride-operations`: Create and manage rides
- `ride-request-operations`: Handle ride join requests
- `notification-operations`: Manage user notifications
- `assign-driver`: Assign drivers to rides
- `approved-riders-operations`: Manage approved riders list

### Development Tools
- **Language**: TypeScript 5.9
- **Linting**: ESLint with TypeScript support
- **Package Manager**: npm
- **Version Control**: Git

## Project Structure

```
BulldogRides/
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API service layer
│   ├── contexts/         # React context providers
│   ├── types/            # TypeScript type definitions
│   └── lib/              # Utility libraries
├── amplify/
│   ├── auth/             # Cognito auth configuration
│   ├── data/             # GraphQL schema & DynamoDB config
│   └── functions/        # Lambda function handlers
└── public/               # Static assets
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm
- AWS Account (for Amplify deployment)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd BulldogRides
```

2. Install dependencies:
```bash
npm install
```

3. Set up AWS Amplify:
```bash
npm install -g @aws-amplify/cli
amplify configure
```

4. Start the development server:
```bash
npm run dev
```

5. Deploy the backend (if needed):
```bash
npx ampx sandbox
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Architecture

BulldogRides uses a modern serverless architecture:

1. **Frontend**: React SPA hosted on AWS Amplify Hosting
2. **API Layer**: GraphQL API via AWS AppSync with custom Lambda resolvers
3. **Authentication**: AWS Cognito user pools with post-confirmation triggers
4. **Database**: DynamoDB with single-table design pattern
5. **Real-time Updates**: AppSync subscriptions for live data

## Database Schema

The application uses a DynamoDB single-table design with the following main entities:
- **Users**: User profiles and authentication data
- **Rides**: Ride requests with pickup/destination coordinates
- **Notifications**: User notifications and alerts
- **RideRequests**: Join requests for rides
- **ApprovedRiders**: List of users approved for specific rides

## Contributing

We welcome contributions from the Kirksville community! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available for the Kirksville community.

## Contact

For questions or support, please open an issue on GitHub.

Demo: [here](https://main.d22epmzwkakj8v.amplifyapp.com/)

---

Built for the Kirksville community
