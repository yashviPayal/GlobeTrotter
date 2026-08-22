import { createBrowserRouter, Navigate } from 'react-router-dom'

import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'

import { AppShell } from './AppShell'
import { Placeholder } from './Placeholder'
import { RequireAuth } from './RequireAuth'

/**
 * Route map for the 13 screens in the brief. Screens land here as they are
 * built; until then each resolves to a placeholder so navigation is never
 * broken and the shell can be reviewed end to end.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: (
          <Placeholder
            title="Dashboard"
            description="Screen 2 — upcoming trips, popular cities and budget highlights."
          />
        ),
      },
      {
        path: 'trips',
        element: (
          <Placeholder
            title="My Trips"
            description="Screen 4 — every trip you have planned, grouped by status."
          />
        ),
      },
      {
        path: 'trips/new',
        element: (
          <Placeholder title="Plan a new trip" description="Screen 3 — name, dates and budget." />
        ),
      },
      {
        path: 'trips/:tripId',
        element: (
          <Placeholder title="Itinerary" description="Screen 6 — the full day-wise plan." />
        ),
      },
      {
        path: 'trips/:tripId/build',
        element: (
          <Placeholder
            title="Itinerary builder"
            description="Screen 5 — add stops, dates and activities."
          />
        ),
      },
      {
        path: 'trips/:tripId/budget',
        element: (
          <Placeholder title="Budget" description="Screen 9 — cost breakdown and alerts." />
        ),
      },
      {
        path: 'cities',
        element: (
          <Placeholder title="Explore cities" description="Screen 7 — search and filter cities." />
        ),
      },
      {
        path: 'cities/:cityId',
        element: (
          <Placeholder title="City" description="Screen 8 — things to do in this city." />
        ),
      },
      {
        path: 'profile',
        element: (
          <Placeholder title="Profile" description="Screen 12 — your details and preferences." />
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
