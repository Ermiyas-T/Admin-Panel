'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Home() {
  // Router lets us redirect the user without rendering a full landing page.
  const router = useRouter();

  // AuthContext tells us if a user is already logged in (loaded from localStorage).
  const { user, isLoading } = useAuth();

  // Redirect to the most useful starting page based on auth state.
  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  // Minimal UI while we decide where to send the user.
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-gray-600">Redirecting…</div>
    </div>
  );
}
