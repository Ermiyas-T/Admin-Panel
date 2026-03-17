/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Can } from '@/components/auth/Can';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import {
  assignPermissionToRole,
  getRole,
  removePermissionFromRole,
  updateRole,
} from '@/lib/api/roles';
import { getPermissions } from '@/lib/api/permissions';
import type { Permission, Role } from '@/types';

interface RoleFormValues {
  name: string;
  description?: string;
}

export default function RoleDetailPage() {
  const params = useParams();
  const id = params.id as string | undefined;
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>();

  async function fetchRole(roleId: string) {
    try {
      setError('');
      const data = await getRole(roleId);
      setRole(data);
      reset({ name: data.name, description: data.description });
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || 'Failed to fetch role');
    }
  }

  async function fetchAllPermissions() {
    try {
      setError('');
      const data = await getPermissions();
      setAllPermissions(data);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || 'Failed to fetch permissions');
    }
  }

  useEffect(() => {
    if (!id) return;

    void fetchRole(id);
    void fetchAllPermissions();
  }, [id]);

  const onSubmitUpdate = async (values: RoleFormValues) => {
    if (!id) return;

    try {
      setError('');
      await updateRole(id, values);
      setIsEditing(false);
      await fetchRole(id);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || 'Failed to update role');
    }
  };

  const togglePermission = async (permission: Permission) => {
    if (!role) return;

    const hasPermission = role.permissions?.some((entry) => entry.id === permission.id);

    try {
      setError('');

      if (hasPermission) {
        await removePermissionFromRole(role.id, permission.id);
      } else {
        await assignPermissionToRole(role.id, permission.id);
      }

      await fetchRole(role.id);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(
        axiosErr.response?.data?.message || 'Failed to update permission assignment',
      );
    }
  };

  return (
    <AuthGuard requiredPermissions={[{ action: 'read', subject: 'Role' }]}>
      {!role ? (
        <LoadingScreen
          label="Role Detail"
          message="Loading role details"
          detail="We are fetching the role record and its permission assignments."
        />
      ) : (
        <DashboardShell
          eyebrow="Role Detail"
          title={`Role: ${role.name}`}
          description="Inspect this role, update its metadata, and toggle permission assignments using the same API endpoints already wired into the app."
          actions={
            <Can I="update" a="Role">
              <button
                onClick={() => setIsEditing((previous) => !previous)}
                className={isEditing ? 'app-button-secondary' : 'app-button'}
              >
                {isEditing ? 'Cancel Editing' : 'Edit Role'}
              </button>
            </Can>
          }
        >
          {error ? <div className="app-banner-error">{error}</div> : null}

          {isEditing ? (
            <section className="app-panel p-6 sm:p-8">
              <span className="app-chip">Edit Metadata</span>
              <form onSubmit={handleSubmit(onSubmitUpdate)} className="mt-6 space-y-5">
                <div>
                  <label htmlFor="name" className="app-label">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name', { required: 'Name is required' })}
                    className="app-input"
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
                    placeholder="Describe what this role should grant."
                  />
                </div>

                <button type="submit" className="app-button-success">
                  Save Changes
                </button>
              </form>
            </section>
          ) : (
            <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="app-panel p-6 sm:p-8">
                <span className="app-chip">Summary</span>
                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                  {role.name}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {role.description || 'No description has been added for this role yet.'}
                </p>
              </div>

              <div className="app-panel p-6 sm:p-8">
                <span className="app-chip">Assigned Permissions</span>
                <p className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-slate-950">
                  {role.permissions?.length ?? 0}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Toggle any permission below to add or remove it from this role.
                </p>
              </div>
            </section>
          )}

          <section className="app-panel overflow-hidden">
            <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="app-chip">Permissions</span>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                    Permission assignments
                  </h2>
                </div>
              </div>

              <Can I="update" a="Role">
                <p className="text-sm leading-6 text-slate-600">
                  Use the toggles below to update which permissions this role owns.
                </p>
              </Can>
            </div>

            <ul className="app-list">
              {allPermissions.map((permission) => {
                const hasPermission = role.permissions?.some(
                  (entry) => entry.id === permission.id,
                );

                return (
                  <li key={permission.id} className="app-list-row">
                    <div className="flex items-center gap-3">
                      <span className="app-chip">{permission.action}</span>
                      <span className="text-base font-semibold text-slate-950">
                        {permission.subject}
                      </span>
                    </div>

                    <Can
                      I="update"
                      a="Role"
                      fallback={
                        <span className="text-sm font-semibold text-slate-400">
                          View only
                        </span>
                      }
                    >
                      <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!hasPermission}
                          onChange={() => void togglePermission(permission)}
                          className="app-checkbox"
                        />
                        {hasPermission ? 'Assigned' : 'Not assigned'}
                      </label>
                    </Can>
                  </li>
                );
              })}
            </ul>
          </section>
        </DashboardShell>
      )}
    </AuthGuard>
  );
}
