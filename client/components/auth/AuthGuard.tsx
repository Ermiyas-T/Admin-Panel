'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Action, Subject } from '@/types';

/**
 * `AuthGuard` protects a section of UI.
 *
 * It supports two checks:
 * - Authentication check: if there is no `user`, redirect to `/login`
 * - Optional authorization check: if `requiredPermissions` are provided and the
 *   user doesn't have ALL of them, redirect away (default: `/dashboard`)
 *
 * Notes:
 * - `ability` comes from CASL and is derived from the user's permissions.
 * - `isLoading` is part of the AuthContext contract; in our current implementation
 *   it is always `false` because we initialize state from localStorage synchronously.
 */
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
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect will happen.
  if (!user) return null;

  // If lacking permissions, redirect will happen.
  if (!hasAllRequiredPermissions) return null;

  return <>{children}</>;
};

