import { createBrowserRouter, Navigate } from 'react-router-dom'

import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { CitiesPage } from '@/features/cities/CitiesPage'
import { CityDetailPage } from '@/features/cities/CityDetailPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { CreateTripPage } from '@/features/trips/CreateTripPage'
import { TripDetailPage } from '@/features/trips/TripDetailPage'
import { TripsPage } from '@/features/trips/TripsPage'

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
      { index: true, element: <DashboardPage /> },
      { path: 'trips', element: <TripsPage /> },
      { path: 'trips/new', element: <CreateTripPage /> },
      { path: 'trips/:tripId', element: <TripDetailPage /> },
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
      { path: 'cities', element: <CitiesPage /> },
      { path: 'cities/:cityId', element: <CityDetailPage /> },
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
