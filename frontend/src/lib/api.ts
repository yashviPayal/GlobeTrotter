import { useAuthStore } from '@/store/auth'

/**
 * The one place an HTTP request is made.
 *
 * Requests go to a relative /api path, which the Vite dev server proxies to
 * FastAPI — so the API host never enters the bundle and CORS never applies.
 */
const BASE_URL = '/api'

/** Every failure surfaces as this, so callers never branch on shape. */
export class ApiError extends Error {
  readonly status: number
  readonly details: Array<{ field: string; message: string }>

  constructor(
    status: number,
    message: string,
    details: Array<{ field: string; message: string }> = [],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/**
 * FastAPI reports failures as `detail`, which is either a string or a list of
 * validation errors. Both are normalised here so the UI sees one shape.
 */
function parseError(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown } | null)?.detail

  if (typeof detail === 'string') {
    return new ApiError(status, detail)
  }

  if (Array.isArray(detail)) {
    const details = detail.map((item) => {
      const loc = (item as { loc?: unknown[] }).loc ?? []
      const field = loc.filter((part) => part !== 'body').join('.')
      return {
        field: String(field || 'form'),
        message: String((item as { msg?: string }).msg ?? 'Invalid value'),
      }
    })

    return new ApiError(status, details[0]?.message ?? 'Invalid request', details)
  }

  return new ApiError(status, 'Something went wrong. Please try again.')
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function request<T>(
  path: string,
  { method = 'GET', body, signal }: RequestOptions = {},
): Promise<T> {
  const token = useAuthStore.getState().token

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    signal,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  // An expired or rejected token logs the user out once, here, rather than
  // in every screen that happens to make a call.
  if (response.status === 401 && token) {
    useAuthStore.getState().logout()
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw parseError(response.status, payload)
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
