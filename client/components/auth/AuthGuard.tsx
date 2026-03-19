'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/use-auth-store';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Action, Subject } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermissions?: { action: Action; subject: Subject }[];
  unauthorizedRedirectTo?: string;
}

export const AuthGuard = ({
  children,
  requiredPermissions = [],
  unauthorizedRedirectTo = '/dashboard',
}: AuthGuardProps) => {
  const { user, ability, isLoading } = useAuth();
  const router = useRouter();

  const hasAllRequiredPermissions =
    requiredPermissions.length === 0 ||
    requiredPermissions.every(({ action, subject }) => ability?.can(action, subject));

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!hasAllRequiredPermissions) {
      router.replace(unauthorizedRedirectTo);
    }
  }, [isLoading, user, hasAllRequiredPermissions, unauthorizedRedirectTo, router]);

  if (isLoading) {
    return (
      <LoadingScreen
        label="Checking Access"
        message="Verifying your session"
        detail="We are confirming your account and permission set before rendering this page."
      />
    );
  }

  if (!user || !hasAllRequiredPermissions) return null;

  return <>{children}</>;
};
