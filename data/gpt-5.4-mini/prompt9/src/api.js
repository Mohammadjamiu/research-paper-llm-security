const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '/api');
export const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || '/auth/login';

async function readJson(response) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function login(credentials) {
  const response = await fetch(`${API_BASE_URL}${LOGIN_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Login failed.');
  }

  return payload ?? {};
}
