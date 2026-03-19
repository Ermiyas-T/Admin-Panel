'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/lib/auth/use-auth-store';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  return (
    <LoadingScreen
      label="Redirect"
      message="Routing you to the right workspace"
      detail="We are checking your session and sending you to the correct screen."
    />
  );
}
