import type { User } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      // Envía y recibe la cookie de sesión aunque la API esté en otro puerto
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0);
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error ?? 'Ocurrió un error inesperado', res.status);
  }
  return body as T;
}

export const authApi = {
  me: () => apiFetch<{ user: User | null }>('/api/auth/me').then(r => r.user),

  login: (email: string, password: string) =>
    apiFetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then(r => r.user),

  register: (name: string, email: string, password: string) =>
    apiFetch<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }).then(r => r.user),

  logout: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
};
