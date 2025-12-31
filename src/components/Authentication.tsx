import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';

/**
 * LoginPage - Handles user authentication
 * 
 * After successful login, redirects to home page.
 * The post-confirmation Lambda trigger creates the User in DynamoDB,
 * so we don't need to handle user creation here.
 */
export default function LoginPage() {
  return (
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
      }}
    >
      {/* This renders after successful authentication */}
      {() => <RedirectAfterLogin />}
    </Authenticator>
  );
}

/**
 * Simple component that redirects to home after login
 * This is rendered inside Authenticator after successful auth
 */
function RedirectAfterLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    // Small delay to ensure auth state is fully updated
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Login successful! Redirecting...</p>
    </div>
  );
}