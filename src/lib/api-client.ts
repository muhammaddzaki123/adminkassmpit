/**
 * API Client with automatic token injection
 */

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Authenticated fetch wrapper that automatically includes JWT token
 */
export async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies as well
    headers,
  });

  return response;
}

/**
 * GET request with authentication
 */
export async function apiGet(url: string) {
  return fetchWithAuth(url, { method: 'GET' });
}

/**
 * POST request with authentication
 */
export async function apiPost(url: string, data?: unknown) {
  return fetchWithAuth(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request with authentication
 */
export async function apiPut(url: string, data?: unknown) {
  return fetchWithAuth(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request with authentication
 */
export async function apiDelete(url: string) {
  return fetchWithAuth(url, { method: 'DELETE' });
}

/**
 * PATCH request with authentication
 */
export async function apiPatch(url: string, data?: unknown) {
  return fetchWithAuth(url, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}
