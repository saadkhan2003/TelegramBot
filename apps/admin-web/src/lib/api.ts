const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchApi<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || `HTTP error! status: ${res.status}`);
  }

  return res.json();
}
