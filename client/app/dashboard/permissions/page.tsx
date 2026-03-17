/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Can } from '@/components/auth/Can';
import { DashboardShell } from '@/components/layout/DashboardShell';
import {
  createPermission,
  deletePermission,
  getPermissions,
} from '@/lib/api/permissions';
import type { Permission } from '@/types';

interface CreatePermissionForm {
  action: string;
  subject: string;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePermissionForm>({
    defaultValues: { action: '', subject: '' },
  });

  async function fetchPermissions() {
    try {
      setError('');
      const data = await getPermissions();
      setPermissions(data);
    } catch {
      setError('Failed to fetch permissions');
    }
  }

  useEffect(() => {
    void fetchPermissions();
  }, []);

  const onSubmitCreate = async (values: CreatePermissionForm) => {
    try {
      setError('');
      await createPermission(values);
      reset();
      setIsCreateModalOpen(false);
      await fetchPermissions();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || 'Failed to create permission');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;

    try {
      setError('');
      await deletePermission(id);
      await fetchPermissions();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || 'Failed to delete permission');
    }
  };

  return (
    <AuthGuard requiredPermissions={[{ action: 'read', subject: 'Permission' }]}>
      <DashboardShell
        eyebrow="Permissions"
        title="Permission Library"
        description="Browse the action-subject rules your roles depend on and create new ones through the existing permission APIs."
        actions={
          <Can I="create" a="Permission">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="app-button"
            >
              Create Permission
            </button>
          </Can>
        }
      >
        {error ? <div className="app-banner-error">{error}</div> : null}

        <section className="app-panel overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
            <div>
              <span className="app-chip">Rule Set</span>
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                {permissions.length} permission
                {permissions.length === 1 ? '' : 's'} defined
              </h2>
            </div>
            <div className="app-panel-soft px-4 py-3 text-sm font-medium text-slate-600">
              Each entry keeps the original action:subject structure.
            </div>
          </div>

          <ul className="app-list">
            {permissions.map((permission) => (
              <li key={permission.id} className="app-list-row">
                <div className="flex items-center gap-3">
                  <span className="app-chip">{permission.action}</span>
                  <span className="text-base font-semibold text-slate-950">
                    {permission.subject}
                  </span>
                </div>

                <Can I="delete" a="Permission">
                  <button
                    onClick={() => void handleDelete(permission.id)}
                    className="app-inline-danger"
                  >
                    Delete
                  </button>
                </Can>
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
                    Create a new permission
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Define the action and subject pair. Creation still goes through the
                    same backend endpoint.
                  </p>

                  <form onSubmit={handleSubmit(onSubmitCreate)} className="mt-8 space-y-5">
                    <div>
                      <label htmlFor="action" className="app-label">
                        Action
                      </label>
                      <select
                        id="action"
                        {...register('action', { required: 'Action is required' })}
                        className="app-select"
                      >
                        <option value="">Select action</option>
                        <option value="create">create</option>
                        <option value="read">read</option>
                        <option value="update">update</option>
                        <option value="delete">delete</option>
                        <option value="manage">manage</option>
                      </select>
                      {errors.action ? (
                        <p className="mt-2 text-sm font-medium text-red-600">
                          {errors.action.message}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label htmlFor="subject" className="app-label">
                        Subject
                      </label>
                      <input
                        id="subject"
                        type="text"
                        {...register('subject', { required: 'Subject is required' })}
                        className="app-input"
                        placeholder="User"
                      />
                      {errors.subject ? (
                        <p className="mt-2 text-sm font-medium text-red-600">
                          {errors.subject.message}
                        </p>
                      ) : null}
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
