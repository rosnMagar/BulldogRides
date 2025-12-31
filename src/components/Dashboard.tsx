import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router";

/**
 * Dashboard - The main page after login
 * Shows user info and navigation to other features
 */
export default function Dashboard() {
    const { user, signOut } = useAuth();

    return (
        <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>🐶 Bulldog Rides</h1>

            <p>
                Welcome, <strong>{user?.firstName || 'Bulldog'}!</strong>
            </p>

            <p style={{ color: '#666', fontSize: '0.9rem' }}>
                User ID: <code>{user?.id}</code>
            </p>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <Link to="/createRide">
                    <button style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}>
                        🚗 Post a Ride
                    </button>
                </Link>

                <button
                    onClick={signOut}
                    style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}
                >
                    Sign Out
                </button>
            </div>
        </main>
    );
}
