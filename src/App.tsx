import './App.css'
import { useEffect, useState } from 'react';
import { Authenticator, PhoneNumberField } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../amplify/data/resource';
import { fetchUserAttributes } from 'aws-amplify/auth';

const client = generateClient<Schema>();
export default function App() {

  return (
    <>
      <Authenticator
        loginMechanisms={['email']}
        signUpAttributes={['given_name', 'family_name']}
        formFields={{
          signUp: {
            given_name: {
              label: 'First Name',
              placeholder: 'Enter your first name',
              order: 1,
              isRequired: true
            },
            family_name: {
              label: 'Last Name',
              placeholder: 'Enter your last name',
              order: 2,
              isRequired: true
            },
            email: { order: 3 },
            password: { order: 4 },
            confirm_password: { order: 5 },
          }
        }}>
          {({ signOut, user }) => <Dashboard user={user} signOut={signOut} />}
      </Authenticator>
    </>
  )
}

function Dashboard({user, signOut}: any) {
  const [dbUser, setDbUser] = useState<Schema["User"]["type"] | null>(null);

  useEffect(() => {checkAndCreateProfile();}, [user]);

  const checkAndCreateProfile = async () => {
    if (!user) return;

    const { data: existingUser } = await client.models.User.get({id: user.userId});

    if (existingUser) {
      setDbUser(existingUser);
      console.log("User profile found in database:", existingUser);
    } else {
      // Fetch attributes from Cognito
      const attributes = await fetchUserAttributes();

      try{
        const { data: newUser } = await client.models.User.create({
          id: user.userId,
          email: attributes.email!,
          firstName: attributes.given_name || "",
          lastName: attributes.family_name || "",
          phone: attributes.phone_number || "",
          bio: "Truman Bulldog"
        });
        setDbUser(newUser);
      } catch (error: any) {
        // Fix for race condition (developer environment/slow connection) if already created the user
        // Instead of creating, we query the user
        if (error.errorType == "DynamoDB:ConditionalCheckFailedException") {
          const { data: newUser } = await client.models.User.get({id: user.userId});
          setDbUser(newUser);
        }else{
          console.error("Error creating user in database:", error);
        }
      }
    }
  }
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Bulldog Rides: Auth Test</h1>
      <p>Logged in as: <strong>{dbUser ? dbUser.firstName : 'Bulldog'}!</strong></p>
      <p>Your unique ID (UUID): <code>{user?.userId}</code></p>

      <button onClick={signOut} style={{ marginTop: '1rem' }}>
        Sign Out
      </button>
    </main>
  );
}