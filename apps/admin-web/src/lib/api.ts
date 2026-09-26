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

export async function fetchApi<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const activeStoreId = typeof window !== 'undefined' ? localStorage.getItem('active_store_id') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (activeStoreId) {
    headers['x-store-id'] = activeStoreId;
  }

  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && !path.includes('/auth/login')) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}
