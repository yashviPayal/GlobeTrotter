import { api } from '@/lib/api'
import type { AdminOverview, AdminTripSummary, AdminUserSummary } from '@/types/api'

export function getAdminOverview(signal?: AbortSignal) {
  return api.get<AdminOverview>('/admin/overview', signal)
}

export function listAdminUsers(signal?: AbortSignal) {
  return api.get<AdminUserSummary[]>('/admin/users', signal)
}

export function listAdminTrips(signal?: AbortSignal) {
  return api.get<AdminTripSummary[]>('/admin/trips', signal)
}
