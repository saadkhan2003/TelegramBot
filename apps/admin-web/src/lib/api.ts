export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && !envUrl.includes('localhost')) {
      return envUrl;
    }
    const { hostname, port, protocol } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (port === '3001') {
        return `${protocol}//${hostname}:4000/api/v1`;
      }
      return '/api/v1';
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
}

async function autoLogin(): Promise<string | null> {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'msaad.official6@gmail.com',
        password: 'Saad_@123',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.accessToken && typeof window !== 'undefined') {
        localStorage.setItem('admin_token', data.accessToken);
        return data.accessToken;
      }
    }
  } catch (err) {
    console.error('Auto login failed:', err);
  }
  return null;
}

export async function fetchApi<T = any>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  if (!token && !path.includes('/auth/login')) {
    token = await autoLogin();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && !isRetry && !path.includes('/auth/login')) {
    const newToken = await autoLogin();
    if (newToken) {
      return fetchApi<T>(path, options, true);
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}
