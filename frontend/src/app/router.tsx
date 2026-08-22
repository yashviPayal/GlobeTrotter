import { createBrowserRouter, Navigate } from 'react-router-dom'

import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { CitiesPage } from '@/features/cities/CitiesPage'
import { CityDetailPage } from '@/features/cities/CityDetailPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { CreateTripPage } from '@/features/trips/CreateTripPage'
import { PublicTripPage } from '@/features/trips/PublicTripPage'
import { TripCalendarPage } from '@/features/trips/TripCalendarPage'
import { TripDetailPage } from '@/features/trips/TripDetailPage'
import { TripsPage } from '@/features/trips/TripsPage'

import { AppShell } from './AppShell'
import { RequireAuth } from './RequireAuth'

/**
 * Route map for the 13 screens in the brief. Screens land here as they are
 * built; until then each resolves to a placeholder so navigation is never
 * broken and the shell can be reviewed end to end.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/p/:shareCode', element: <PublicTripPage /> },
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
      { path: 'trips/:tripId/calendar', element: <TripCalendarPage /> },
      // The builder and budget both live on the trip page now.
      {
        path: 'trips/:tripId/build',
        element: <Navigate to=".." relative="path" replace />,
      },
      {
        path: 'trips/:tripId/budget',
        element: <Navigate to=".." relative="path" replace />,
      },
      { path: 'cities', element: <CitiesPage /> },
      { path: 'cities/:cityId', element: <CityDetailPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
