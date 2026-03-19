'use client';

import { Can as CaslCan } from '@casl/react';
import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth/use-auth-store';
import { Action, Subject } from '@/types';

/**
 * `Can` is a tiny helper component for permission-based rendering.
 *
 * It reads the current CASL `ability` from the auth Zustand store, then:
 * - renders `children` if the user can perform the action on the subject
 * - otherwise renders `fallback` (defaults to `null`)
 *
 * Example:
 *   <Can I="delete" a="Post" fallback={<span>No access</span>}>
 *     <button>Delete</button>
 *   </Can>
 */
interface CanProps {
  I: Action; // action to check
  a: Subject; // subject
  children: ReactNode;
  fallback?: ReactNode;
}

export const Can = ({ I, a, children, fallback = null }: CanProps) => {
  const { ability } = useAuth();

  // If ability isn't ready, we don't render anything.
  // (This usually means "not logged in" or "no permissions loaded".)
  if (!ability) return null;

  return (
    <CaslCan do={I} on={a} ability={ability}>
      {() => (ability.can(I, a) ? children : fallback)}
    </CaslCan>
  );
};
