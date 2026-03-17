/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Can } from '@/components/auth/Can';
import {
  getRole,
  updateRole,
  assignPermissionToRole,
  removePermissionFromRole,
} from '@/lib/api/roles';
import { getPermissions } from '@/lib/api/permissions';
import type { Permission, Role } from '@/types';

// Form model used by react-hook-form for editing a role.
interface RoleFormValues {
  name: string;
  description?: string;
}

export default function RoleDetailPage() {
  // Route params give us the dynamic role ID from the URL.
  const params = useParams();
  const id = params.id as string | undefined;

  // Page state: the currently loaded role (including its permissions).
  const [role, setRole] = useState<Role | null>(null);
  // Page state: all permissions available in the system.
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  // UI state: toggle between read-only view and edit form.
  const [isEditing, setIsEditing] = useState(false);
  // UI state: error message shown at the top of the page.
  const [error, setError] = useState<string>('');

  // Hook-form manages the edit-role form values + validation.
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>();

  // Fetch a single role by ID (permission: read Role).
  async function fetchRole(roleId: string) {
    try {
      setError('');
      const data = await getRole(roleId);
      setRole(data);
      reset({ name: data.name, description: data.description });
    } catch {
      setError('Failed to fetch role');
    }
  }

  // Fetch all permissions (permission: read Permission).
  async function fetchAllPermissions() {
    try {
      setError('');
      const data = await getPermissions();
      setAllPermissions(data);
    } catch {
      setError('Failed to fetch permissions');
    }
  }

  // Fetch role + permissions when the id becomes available.
  useEffect(() => {
    if (!id) return;
    fetchRole(id);
    fetchAllPermissions();
  }, [id]);

  // Submit handler to update role details (permission: update Role).
  const onSubmitUpdate = async (values: RoleFormValues) => {
    if (!id) return;
    try {
      setError('');
      await updateRole(id, values);
      setIsEditing(false);
      await fetchRole(id);
    } catch {
      setError('Failed to update role');
    }
  };

  // Toggle a permission assignment for this role using CASL-guarded actions.
  const togglePermission = async (permission: Permission) => {
    if (!role) return;

    // Check whether the role currently has this permission.
    const hasPermission = role.permissions?.some((p) => p.id === permission.id);

    try {
      setError('');

      if (hasPermission) {
        // Backend route: DELETE /api/roles/:roleId/permissions/:permissionId
        await removePermissionFromRole(role.id, permission.id);
      } else {
        // Backend route: POST /api/roles/:roleId/permissions/:permissionId
        await assignPermissionToRole(role.id, permission.id);
      }

      // Refresh role to get the latest permission assignments.
      await fetchRole(role.id);
    } catch {
      setError('Failed to update permission assignment');
    }
  };

  // While role data is loading, show a simple loading indicator.
  if (!role) {
    return <div>Loading...</div>;
  }

  return (
    // AuthGuard ensures only users with read access to Role can view this page.
    <AuthGuard requiredPermissions={[{ action: 'read', subject: 'Role' }]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Role: {role.name}</h1>

          {/* CASL: Edit toggle button only appears if ability.can("update","Role") is true. */}
          <Can I="update" a="Role">
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEditing ? 'Cancel' : 'Edit Role'}
            </button>
          </Can>
        </div>

        {/* Global error banner for any failed API operation. */}
        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>
        )}

        {isEditing ? (
          // Edit form for role name/description.
          <form
            onSubmit={handleSubmit(onSubmitUpdate)}
            className="bg-white p-6 rounded shadow mb-6"
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>

                {/* register wires input into react-hook-form with required validation. */}
                <input
                  id="name"
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />

                {/* Inline validation feedback for the name field. */}
                {errors.name && (
                  <p className="text-red-600 text-sm">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>

                {/* Description is optional; no required rule here. */}
                <textarea
                  id="description"
                  {...register('description')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          // Read-only summary of the role.
          <div className="bg-white p-6 rounded shadow mb-6">
            <p>
              <strong>Name:</strong> {role.name}
            </p>
            {role.description && (
              <p>
                <strong>Description:</strong> {role.description}
              </p>
            )}
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4">Permissions</h2>

        {/* CASL: helper text only shown to users who can update roles. */}
        <Can I="update" a="Role">
          <p className="text-sm text-gray-600 mb-4">
            Click on a permission to toggle assignment for this role.
          </p>
        </Can>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {allPermissions.map((permission) => {
              // Determine if this permission is currently assigned to the role.
              const hasPermission = role.permissions?.some(
                (p) => p.id === permission.id,
              );

              return (
                <li
                  key={permission.id}
                  className="px-6 py-4 flex items-center space-x-3"
                >
                  {/* CASL: checkbox is only interactive if ability.can("update","Role"). */}
                  <Can I="update" a="Role">
                    <input
                      type="checkbox"
                      checked={!!hasPermission}
                      onChange={() => togglePermission(permission)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </Can>

                  <span className="text-sm text-gray-900">
                    {permission.action}:{permission.subject}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AuthGuard>
  );
}

