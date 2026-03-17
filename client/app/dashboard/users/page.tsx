'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Can } from '@/components/auth/Can';
import { getRoles } from '@/lib/api/roles';
import {
  assignRoleToUser,
  getUsers,
  getUserRoles,
  mapUserRolesToRoles,
  removeRoleFromUser,
} from '@/lib/api/users';
import type { Role, User } from '@/types';

export default function UsersPage() {
  // Page state: users list loaded from backend.
  const [users, setUsers] = useState<User[]>([]);
  // Page state: roles list loaded from backend (used for mapping roleIds -> Role).
  const [roles, setRoles] = useState<Role[]>([]);
  // Modal state: which user we are currently managing.
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Modal state: roles assigned to the selected user.
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  // Modal state: open/close flag.
  const [isModalOpen, setIsModalOpen] = useState(false);
  // UI state: show an error message instead of only console logging.
  const [error, setError] = useState<string>('');

  // Fetch all users from `/api/users` (permission: read User).
  async function fetchUsers() {
    try {
      setError('');
      const data = await getUsers();
      setUsers(data);
    } catch {
      setError('Failed to fetch users');
    }
  }

  // Fetch all roles from `/api/roles` (permission: read Role).
  async function fetchRoles() {
    try {
      setError('');
      const data = await getRoles();
      setRoles(data);
    } catch {
      setError('Failed to fetch roles');
    }
  }

  // Fetch the selected user's assigned roleIds and map them to Role objects.
  async function fetchUserRoles(userId: string) {
    try {
      setError('');
      const records = await getUserRoles(userId);
      setUserRoles(mapUserRolesToRoles(records, roles));
    } catch {
      setError('Failed to fetch user roles');
    }
  }

  // Fetch initial data (users + roles) once when the page mounts.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers();
    void fetchRoles();
  }, []);

  // Open the modal and load roles for the clicked user.
  const handleManageRoles = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    void fetchUserRoles(user.id);
  };

  // Assign a role to the selected user (permission: update User).
  const handleAssignRole = async (roleId: string) => {
    if (!selectedUser) return;
    try {
      setError('');
      await assignRoleToUser(selectedUser.id, roleId);
      await fetchUserRoles(selectedUser.id);
    } catch {
      setError('Failed to assign role');
    }
  };

  // Remove a role from the selected user (permission: update User).
  const handleRemoveRole = async (roleId: string) => {
    if (!selectedUser) return;
    try {
      setError('');
      await removeRoleFromUser(selectedUser.id, roleId);
      await fetchUserRoles(selectedUser.id);
    } catch {
      setError('Failed to remove role');
    }
  };

  // Roles that are not yet assigned to the selected user.
  const availableRoles = useMemo(() => {
    const assignedIds = new Set(userRoles.map((r) => r.id));
    return roles.filter((r) => !assignedIds.has(r.id));
  }, [roles, userRoles]);

  return (
    // AuthGuard protects the page at the route level (permission: read User).
    <AuthGuard requiredPermissions={[{ action: 'read', subject: 'User' }]}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Users</h1>

        {/* Error banner for any failed API operation */}
        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-500">ID: {user.id}</p>
                </div>

                {/* CASL: button is visible only if ability.can("update","User") is true. */}
                <Can I="update" a="User">
                  <button
                    onClick={() => handleManageRoles(user)}
                    className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Manage Roles
                  </button>
                </Can>
              </li>
            ))}
          </ul>
        </div>

        {/* Modal: role assignment UI for the selected user */}
        {selectedUser && (
          <Dialog
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="mx-auto w-full max-w-md rounded bg-white p-6">
                <Dialog.Title className="text-lg font-medium mb-4">
                  Manage Roles for {selectedUser.email}
                </Dialog.Title>

                <div className="space-y-4">
                  <h3 className="font-medium">Current Roles</h3>

                  <div className="space-y-2">
                    {userRoles.length === 0 && (
                      <p className="text-sm text-gray-500">No roles assigned.</p>
                    )}

                    {userRoles.map((role) => (
                      <div key={role.id} className="flex justify-between items-center">
                        <span>{role.name}</span>

                        {/* CASL: removal is also guarded by update User permission. */}
                        <Can I="update" a="User">
                          <button
                            onClick={() => handleRemoveRole(role.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </Can>
                      </div>
                    ))}
                  </div>

                  <h3 className="font-medium">Available Roles</h3>

                  <div className="space-y-2">
                    {availableRoles.length === 0 && (
                      <p className="text-sm text-gray-500">No more roles to assign.</p>
                    )}

                    {availableRoles.map((role) => (
                      <div key={role.id} className="flex justify-between items-center">
                        <span>{role.name}</span>

                        {/* CASL: assignment is guarded by update User permission. */}
                        <Can I="update" a="User">
                          <button
                            onClick={() => void handleAssignRole(role.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Assign
                          </button>
                        </Can>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        )}
      </div>
    </AuthGuard>
  );
}

