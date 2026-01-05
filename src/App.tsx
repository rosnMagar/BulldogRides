import './App.css'
import { Routes, Route, BrowserRouter } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './components/Authentication';
import CreateRideOffer from './components/rides/CreateRideOffer';
import CreateRideRequest from './components/rides/CreateRideRequest';
import Dashboard from './components/Dashboard';
import RideList from './components/RideList/RideList';
import RideDetails from './components/RideDetails/RideDetails';

/**
 * App Architecture:
 * 
 * AuthProvider (top-level, wraps everything - includes auth + app mode)
 *   └── BrowserRouter
 *         └── Routes
 *               ├── /login → LoginPage (public)
 *               └── ProtectedRoute (requires auth)
 *                     └── AppLayout (with navbar)
 *                           ├── / → Dashboard
 *                           ├── /offerRide → CreateRideOffer
 *                           ├── /requestRide → CreateRideRequest
 *                           ├── /rides → RideList
 *                           └── /ride/:id → RideDetails
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route - anyone can access */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes - require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/offerRide" element={<CreateRideOffer />} />
              <Route path="/requestRide" element={<CreateRideRequest />} />
              <Route path="/rides" element={<RideList />} />
              <Route path="/ride/:id" element={<RideDetails />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
