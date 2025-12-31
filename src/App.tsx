import './App.css'
import { Routes, Route, BrowserRouter } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage from './components/Authentication';
import CreateRide from './components/CreateRide';
import Dashboard from './components/Dashboard';

/**
 * App Architecture:
 * 
 * AuthProvider (top-level, wraps everything)
 *   └── BrowserRouter
 *         └── Routes
 *               ├── /login → LoginPage (public)
 *               └── ProtectedRoute (requires auth)
 *                     ├── / → Dashboard
 *                     └── /createRide → CreateRide
 * 
 * How it works:
 * 1. AuthProvider checks for existing session on app load
 * 2. If user navigates to a protected route without auth, they're redirected to /login
 * 3. After login, they can access all protected routes
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/createRide" element={<CreateRide />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
