'use client';

import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Can } from '@/components/auth/Can';
import { useAuth } from '@/lib/auth/AuthContext';

export default function DashboardPage() {
  // AuthContext gives us the logged-in user (for display) and logout() (to clear session).
  const { user, logout } = useAuth();

  return (
    // AuthGuard ensures only authenticated users can see the dashboard.
    <AuthGuard>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">RBAC Dashboard</h1>
              </div>

              <div className="flex items-center space-x-4">
                {/* We can safely read user.email because AuthGuard blocks unauthenticated access. */}
                <span className="text-gray-700">Welcome, {user?.email}</span>

                {/* logout() clears tokens/user/permissions + redirects to /login (see AuthContext). */}
                <button
                  onClick={logout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CASL: Only render this card if ability.can("read", "User") is true. */}
              <Can I="read" a="User">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <h3 className="text-lg font-medium">Users</h3>
                    <p className="mt-2 text-sm text-gray-500">Manage system users</p>
                    <Link
                      href="/dashboard/users"
                      className="mt-3 inline-flex items-center text-sm text-blue-600"
                    >
                      View Users →
                    </Link>
                  </div>
                </div>
              </Can>

              {/* CASL: Only render this card if ability.can("read", "Role") is true. */}
              <Can I="read" a="Role">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <h3 className="text-lg font-medium">Roles</h3>
                    <p className="mt-2 text-sm text-gray-500">Manage roles and permissions</p>
                    <Link
                      href="/dashboard/roles"
                      className="mt-3 inline-flex items-center text-sm text-blue-600"
                    >
                      Manage Roles →
                    </Link>
                  </div>
                </div>
              </Can>

              {/* CASL: Only render this card if ability.can("read", "Permission") is true. */}
              <Can I="read" a="Permission">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <h3 className="text-lg font-medium">Permissions</h3>
                    <p className="mt-2 text-sm text-gray-500">View all permissions</p>
                    <Link
                      href="/dashboard/permissions"
                      className="mt-3 inline-flex items-center text-sm text-blue-600"
                    >
                      View Permissions →
                    </Link>
                  </div>
                </div>
              </Can>
            </div>

            {/* Debug/visibility section: show the raw permission strings used to build CASL ability. */}
            <div className="mt-8">
              <h2 className="text-lg font-medium">Your Permissions</h2>
              <pre className="mt-2 bg-gray-200 p-4 rounded overflow-auto">
                {JSON.stringify(user?.permissions, null, 2)}
              </pre>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

