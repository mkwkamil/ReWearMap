export type ThriftStore = {
  id: string
  name: string
  lat: number
  lng: number
  next_delivery: string | null
  delivery_enabled: boolean
  delivery_verified: boolean
  delivery_frequency: string
  hotness: number
  notes: string
  opening_time: string
  delivery_time: string
  facebook_url: string
  instagram_url: string
  created_at: string
  updated_at: string
}

export type AuthTokenResponse = {
  access_token: string
  token_type: string
  username: string
}

export type AuthMeResponse = {
  username: string
  role: string
}

const TOKEN_KEY = 'rewearmap_admin_token'

let authToken: string | null = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null
let onUnauthorized: (() => void) | null = null

export function getAuthToken(): string | null {
  return authToken
}

export function setAuthToken(token: string | null) {
  authToken = token
  if (typeof sessionStorage === 'undefined') return
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.removeItem(TOKEN_KEY)
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

type RequestOptions = RequestInit & {
  auth?: boolean
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text()
  if (!text) return `Request failed: ${response.status}`
  try {
    const data = JSON.parse(text) as { detail?: unknown }
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) return text
  } catch {
    /* plain text */
  }
  return text
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const { auth = false, ...fetchInit } = init
  const headers = new Headers(fetchInit.headers)
  if (fetchInit.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (auth) {
    const token = getAuthToken()
    if (!token) {
      onUnauthorized?.()
      throw new Error('Wymagane logowanie administratora')
    }
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, { ...fetchInit, headers })
  if (response.status === 401) {
    if (auth) {
      setAuthToken(null)
      onUnauthorized?.()
    }
    throw new Error(await readErrorMessage(response))
  }
  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}

export const api = {
  login: (username: string, password: string) =>
    request<AuthTokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      auth: false,
    }),
  me: () => request<AuthMeResponse>('/api/auth/me', { auth: true }),

  listStores: () => request<ThriftStore[]>('/api/thrift-stores', { auth: false }),
  createStore: (body: Omit<ThriftStore, 'id' | 'created_at' | 'updated_at'>) =>
    request<ThriftStore>('/api/thrift-stores', { method: 'POST', body: JSON.stringify(body), auth: true }),
  updateStore: (id: string, body: Partial<Omit<ThriftStore, 'id' | 'created_at' | 'updated_at'>>) =>
    request<ThriftStore>(`/api/thrift-stores/${id}`, { method: 'PATCH', body: JSON.stringify(body), auth: true }),
  deleteStore: (id: string) => request<void>(`/api/thrift-stores/${id}`, { method: 'DELETE', auth: true }),
}
