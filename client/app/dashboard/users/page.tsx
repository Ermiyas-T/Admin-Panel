/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Can } from '@/components/auth/Can';
import { DashboardShell } from '@/components/layout/DashboardShell';
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
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string>('');

  async function fetchUsers() {
    try {
      setError('');
      const data = await getUsers();
      setUsers(data);
    } catch {
      setError('Failed to fetch users');
    }
  }

  async function fetchRoles() {
    try {
      setError('');
      const data = await getRoles();
      setRoles(data);
    } catch {
      setError('Failed to fetch roles');
    }
  }

  async function fetchUserRoles(userId: string) {
    try {
      setError('');
      const records = await getUserRoles(userId);
      setUserRoles(mapUserRolesToRoles(records, roles));
    } catch {
      setError('Failed to fetch user roles');
    }
  }

  useEffect(() => {
    void fetchUsers();
    void fetchRoles();
  }, []);

  const handleManageRoles = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    void fetchUserRoles(user.id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setUserRoles([]);
  };

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

  const availableRoles = useMemo(() => {
    const assignedIds = new Set(userRoles.map((role) => role.id));
    return roles.filter((role) => !assignedIds.has(role.id));
  }, [roles, userRoles]);

  return (
    <AuthGuard requiredPermissions={[{ action: 'read', subject: 'User' }]}>
      <DashboardShell
        eyebrow="Directory"
        title="Users"
        description="Browse account records and manage role assignments without changing the existing user-management flow."
      >
        {error ? <div className="app-banner-error">{error}</div> : null}

        <section className="app-panel overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
            <div>
              <span className="app-chip">User List</span>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                {users.length} registered user{users.length === 1 ? '' : 's'}
              </h2>
            </div>
            <div className="app-panel-soft px-4 py-3 text-sm font-medium text-slate-600">
              Role assignment controls open in the same modal workflow.
            </div>
          </div>

          <ul className="app-list">
            {users.map((user) => (
              <li key={user.id} className="app-list-row">
                <div>
                  <p className="text-base font-semibold text-slate-950">{user.email}</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">ID: {user.id}</p>
                </div>

                <Can I="update" a="User">
                  <button
                    onClick={() => handleManageRoles(user)}
                    className="app-button-secondary"
                  >
                    Manage Roles
                  </button>
                </Can>
              </li>
            ))}
          </ul>
        </section>

        {selectedUser ? (
          <Dialog open={isModalOpen} onClose={handleCloseModal} className="relative z-50">
            <div className="app-modal-backdrop" aria-hidden="true" />

            <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
              <div className="flex min-h-full items-center justify-center">
                <Dialog.Panel className="app-modal-panel">
                  <Dialog.Title className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                    Manage roles for {selectedUser.email}
                  </Dialog.Title>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Assign or remove roles using the same backend actions already wired
                    into this page.
                  </p>

                  <div className="mt-8 grid gap-4">
                    <div className="app-panel-soft p-5">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Current Roles
                      </h3>

                      <div className="mt-4 space-y-3">
                        {userRoles.length === 0 ? (
                          <p className="text-sm text-slate-500">No roles assigned.</p>
                        ) : null}

                        {userRoles.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center justify-between gap-4 rounded-[20px] bg-white/80 px-4 py-3"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">{role.name}</p>
                              {role.description ? (
                                <p className="mt-1 text-sm text-slate-500">
                                  {role.description}
                                </p>
                              ) : null}
                            </div>

                            <Can I="update" a="User">
                              <button
                                onClick={() => handleRemoveRole(role.id)}
                                className="app-inline-danger"
                              >
                                Remove
                              </button>
                            </Can>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="app-panel-soft p-5">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Available Roles
                      </h3>

                      <div className="mt-4 space-y-3">
                        {availableRoles.length === 0 ? (
                          <p className="text-sm text-slate-500">No more roles to assign.</p>
                        ) : null}

                        {availableRoles.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center justify-between gap-4 rounded-[20px] bg-white/80 px-4 py-3"
                          >
                            <div>
                              <p className="font-semibold text-slate-900">{role.name}</p>
                              {role.description ? (
                                <p className="mt-1 text-sm text-slate-500">
                                  {role.description}
                                </p>
                              ) : null}
                            </div>

                            <Can I="update" a="User">
                              <button
                                onClick={() => void handleAssignRole(role.id)}
                                className="app-inline-success"
                              >
                                Assign
                              </button>
                            </Can>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button onClick={handleCloseModal} className="app-button">
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </div>
            </div>
          </Dialog>
        ) : null}
      </DashboardShell>
    </AuthGuard>
  );
}
