import { api } from '@/lib/api'
import type { TokenResponse, User, UserUpdate } from '@/types/api'

interface RegisterPayload {
  name: string
  email: string
  password: string
}

interface LoginPayload {
  email: string
  password: string
}

export function register(payload: RegisterPayload) {
  return api.post<User>('/auth/register', payload)
}

export function login(payload: LoginPayload) {
  return api.post<TokenResponse>('/auth/login', payload)
}

export function getMe(signal?: AbortSignal) {
  return api.get<User>('/auth/me', signal)
}

export function updateMe(payload: UserUpdate) {
  return api.patch<User>('/auth/me', payload)
}
