'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getApiBase } from '../lib/api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; password: string; storeName?: string; currency?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('admin_user') : null;

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore parse error
        }
      }

      // Verify token with backend
      const base = getApiBase();
      fetch(`${base}/admin/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!isMounted) return;
          if (res.ok) {
            const data = await res.json();
            setUser(data);
            localStorage.setItem('admin_user', JSON.stringify(data));
          } else {
            // Invalid / expired token
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            setUser(null);
            setToken(null);
            if (pathname !== '/login' && pathname !== '/register') {
              router.replace('/login');
            }
          }
        })
        .catch(() => {
          // If offline / network error / timeout, retain local state if user was parsed, otherwise redirect
          if (!isMounted) return;
          if (!savedUser && pathname !== '/login' && pathname !== '/register') {
            router.replace('/login');
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
          clearTimeout(timeoutId);
        });
    } else {
      setLoading(false);
      clearTimeout(timeoutId);
      if (pathname !== '/login' && pathname !== '/register') {
        router.replace('/login');
      }
    }

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [pathname, router]);

  const login = async (email: string, pass: string) => {
    const base = getApiBase();
    const res = await fetch(`${base}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password: pass }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Invalid email or password');
    }

    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem('admin_token', data.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      setToken(data.accessToken);
      setUser(data.admin);
      router.push('/');
    }
  };


  const register = async (data: { name: string; email: string; password: string; storeName?: string; currency?: string }) => {
    const base = getApiBase();
    const res = await fetch(`${base}/admin/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Registration failed. Please try again.');
    }

    const result = await res.json();
    if (result.accessToken) {
      localStorage.setItem('admin_token', result.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(result.admin));
      setToken(result.accessToken);
      setUser(result.admin);
      router.push('/');
    }
  };

  const logout = async () => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null);
    if (currentToken) {
      try {
        const base = getApiBase();
        await fetch(`${base}/admin/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {
        // Continue clearing client state even if backend is unreachable
      }
    }

    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
