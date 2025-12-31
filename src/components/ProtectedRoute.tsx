import { Navigate, Outlet } from "react-router";
import { useAuth } from "../hooks/useAuth";

/**
 * ProtectedRoute - Guards routes that require authentication
 * 
 * Usage in App.tsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *     <Route path="/createRide" element={<CreateRide />} />
 *   </Route>
 * 
 * How it works:
 * - If loading: show loading screen (session check in progress)
 * - If not authenticated: redirect to login
 * - If authenticated: render the child route (Outlet)
 */
export default function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    // Still checking if user has a valid session
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <p>Loading...</p>
            </div>
        );
    }

    // Not authenticated - redirect to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Authenticated - render the child route
    // <Outlet /> renders whatever child route matched (e.g., /dashboard, /createRide)
    return <Outlet />;
}
