'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Can } from '@/components/auth/Can';
import { useAuth } from '@/lib/auth/use-auth-store';
import type { Action, Subject } from '@/types';

interface DashboardShellProps {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
  permission?: {
    action: Action;
    subject: Subject;
  };
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview', exact: true },
  {
    href: '/dashboard/users',
    label: 'Users',
    permission: { action: 'read', subject: 'User' },
  },
  {
    href: '/dashboard/roles',
    label: 'Roles',
    permission: { action: 'read', subject: 'Role' },
  },
  {
    href: '/dashboard/permissions',
    label: 'Permissions',
    permission: { action: 'read', subject: 'Permission' },
  },
];

export function DashboardShell({
  title,
  description,
  children,
  actions,
  eyebrow = 'Operations',
}: DashboardShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const permissionCount = user?.permissions?.length ?? 0;

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavItem = ({ href, label, exact, permission }: NavItem) => {
    const link = (
      <Link
        href={href}
        className={`app-nav-link ${isActive(href, exact) ? 'app-nav-link-active' : ''}`}
      >
        <span>{label}</span>
        <span className="text-[0.65rem] uppercase tracking-[0.24em] opacity-70">
          Open
        </span>
      </Link>
    );

    if (!permission) {
      return link;
    }

    return (
      <Can I={permission.action} a={permission.subject}>
        {link}
      </Can>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="app-shell flex flex-col gap-6 pb-10">
        <section className="app-panel overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <span className="app-kicker">Access Control Workspace</span>
              <div className="mt-5 flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-950 text-lg font-semibold tracking-[0.2em] text-white shadow-[0_20px_40px_-25px_rgba(15,23,42,1)]"
                >
                  RB
                </Link>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                    RBAC Demo
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-3xl">
                    Cleaner interfaces for policy-driven admin work.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="app-panel-soft p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Signed In
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {user?.email ?? 'Unknown user'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {permissionCount} active permission
                  {permissionCount === 1 ? '' : 's'}
                </p>
              </div>

              <button onClick={logout} className="app-button-danger">
                Logout
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="app-panel-soft p-4 lg:sticky lg:top-6">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Navigation
              </p>
              <nav className="mt-4 flex flex-col gap-2">
                {navItems.map((item) => (
                  <div key={item.href}>{renderNavItem(item)}</div>
                ))}
              </nav>

              <div className="mt-6 rounded-[22px] bg-slate-950 px-4 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  Session Snapshot
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                  {String(permissionCount).padStart(2, '0')}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Use the panels on the right to manage users, roles, and permission
                  assignments without changing the app flow.
                </p>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <section className="app-panel p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <span className="app-kicker">{eyebrow}</span>
                  <h1 className="app-title mt-4">{title}</h1>
                  <p className="app-copy mt-4">{description}</p>
                </div>

                {actions ? (
                  <div className="flex flex-wrap items-center gap-3">{actions}</div>
                ) : null}
              </div>
            </section>

            <div className="space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
