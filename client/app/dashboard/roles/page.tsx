/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Can } from '@/components/auth/Can';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { createRole, deleteRole, getRoles } from '@/lib/api/roles';
import type { Role } from '@/types';

interface CreateRoleForm {
  name: string;
  description?: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleForm>({
    defaultValues: { name: '', description: '' },
  });

  async function fetchRoles() {
    try {
      setError('');
      const data = await getRoles();
      setRoles(data);
    } catch {
      setError('Failed to fetch roles');
    }
  }

  useEffect(() => {
    void fetchRoles();
  }, []);

  const onSubmitCreate = async (data: CreateRoleForm) => {
    try {
      setError('');
      await createRole(data);
      reset();
      setIsCreateModalOpen(false);
      await fetchRoles();
    } catch {
      setError('Failed to create role');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      setError('');
      await deleteRole(id);
      await fetchRoles();
    } catch {
      setError('Failed to delete role');
    }
  };

  return (
    <AuthGuard requiredPermissions={[{ action: 'read', subject: 'Role' }]}>
      <DashboardShell
        eyebrow="Roles"
        title="Role Library"
        description="Review role definitions, create new ones, and open detailed permission assignment screens with the same underlying data flow."
        actions={
          <Can I="create" a="Role">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="app-button"
            >
              Create Role
            </button>
          </Can>
        }
      >
        {error ? <div className="app-banner-error">{error}</div> : null}

        <section className="app-panel overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
            <div>
              <span className="app-chip">Catalog</span>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                {roles.length} role{roles.length === 1 ? '' : 's'} available
              </h2>
            </div>
            <div className="app-panel-soft px-4 py-3 text-sm font-medium text-slate-600">
              Select a role to inspect and manage its permissions.
            </div>
          </div>

          <ul className="app-list">
            {roles.map((role) => (
              <li key={role.id} className="app-list-row">
                <div className="max-w-2xl">
                  <Link href={`/dashboard/roles/${role.id}`} className="app-link text-base">
                    {role.name}
                  </Link>
                  {role.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {role.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      No description provided.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <Can I="update" a="Role">
                    <Link href={`/dashboard/roles/${role.id}`} className="app-inline-action">
                      Edit
                    </Link>
                  </Can>

                  <Can I="delete" a="Role">
                    <button
                      onClick={() => void handleDelete(role.id)}
                      className="app-inline-danger"
                    >
                      Delete
                    </button>
                  </Can>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {isCreateModalOpen ? (
          <div className="fixed inset-0 z-50">
            <div
              className="app-modal-backdrop"
              aria-hidden="true"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
              <div className="flex min-h-full items-center justify-center">
                <div className="app-modal-panel">
                  <h3 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                    Create a new role
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Add a name and optional description. The existing create-role API
                    flow remains unchanged.
                  </p>

                  <form onSubmit={handleSubmit(onSubmitCreate)} className="mt-8 space-y-5">
                    <div>
                      <label htmlFor="name" className="app-label">
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        {...register('name', { required: 'Name is required' })}
                        className="app-input"
                        placeholder="Operations Manager"
                      />
                      {errors.name ? (
                        <p className="mt-2 text-sm font-medium text-red-600">
                          {errors.name.message}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label htmlFor="description" className="app-label">
                        Description
                      </label>
                      <textarea
                        id="description"
                        {...register('description')}
                        className="app-textarea"
                        placeholder="Describe what this role is responsible for."
                      />
                    </div>

                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="app-button-secondary"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="app-button">
                        Create
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DashboardShell>
    </AuthGuard>
  );
}
