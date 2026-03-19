'use client';

import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Can } from '@/components/auth/Can';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useAuth } from '@/lib/auth/use-auth-store';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <DashboardShell
        eyebrow="Overview"
        title="RBAC Dashboard"
        description="A cleaner command center for navigating users, roles, and permissions while keeping the same authorization behavior under the hood."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <Can I="read" a="User">
            <Link
              href="/dashboard/users"
              className="app-panel block p-6 hover:-translate-y-1"
            >
              <span className="app-chip">User Access</span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                Users
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Review accounts and open role-management controls for each person in the
                system.
              </p>
              <span className="mt-6 inline-flex text-sm font-semibold text-teal-800">
                Open user management
              </span>
            </Link>
          </Can>

          <Can I="read" a="Role">
            <Link
              href="/dashboard/roles"
              className="app-panel block p-6 hover:-translate-y-1"
            >
              <span className="app-chip">Role Design</span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                Roles
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Create, inspect, and tune role definitions alongside their permission
                assignments.
              </p>
              <span className="mt-6 inline-flex text-sm font-semibold text-teal-800">
                Open role management
              </span>
            </Link>
          </Can>

          <Can I="read" a="Permission">
            <Link
              href="/dashboard/permissions"
              className="app-panel block p-6 hover:-translate-y-1"
            >
              <span className="app-chip">Policy Library</span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                Permissions
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Browse the available action-subject rules that shape what each role can do.
              </p>
              <span className="mt-6 inline-flex text-sm font-semibold text-teal-800">
                Open permissions
              </span>
            </Link>
          </Can>
        </div>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="app-panel p-6 sm:p-8">
            <span className="app-chip">Session</span>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
              Signed in as {user?.email}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your visible actions are still determined by the same permission strings
              returned from the backend.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="app-panel-soft p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Permission Count
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  {user?.permissions?.length ?? 0}
                </p>
              </div>
              <div className="app-panel-soft p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Access Model
                </p>
                <p className="mt-3 text-base font-semibold text-slate-950">CASL ability</p>
                <p className="mt-1 text-sm text-slate-600">Driven by stored permissions</p>
              </div>
            </div>
          </div>

          <div className="app-panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="app-chip">Diagnostics</span>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                  Your Permissions
                </h2>
              </div>
            </div>
            <pre className="mt-6 overflow-x-auto rounded-[24px] bg-slate-950 p-5 font-mono text-xs leading-6 text-cyan-100">
              {JSON.stringify(user?.permissions, null, 2)}
            </pre>
          </div>
        </section>
      </DashboardShell>
    </AuthGuard>
  );
}
