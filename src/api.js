const API_URL = import.meta.env.VITE_API_URL || '';

export async function api(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      response.status === 401
        ? "Your session is no longer valid. Sign out, then register or sign in again."
        : payload?.message ||
          (response.status === 404
            ? `API route not found: /api${path}`
            : payload?.error || `Request failed (${response.status})`);
    throw new Error(message);
  }
  return payload;
}

export const request = (method, body) => ({ method, body: JSON.stringify(body) });