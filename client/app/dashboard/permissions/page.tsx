'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Can } from '@/components/auth/Can';
import {
  createPermission,
  deletePermission,
  getPermissions,
} from '@/lib/api/permissions';
import type { Permission } from '@/types';

// Form model used by react-hook-form for creating a permission.
interface CreatePermissionForm {
  action: string;
  subject: string;
}

export default function PermissionsPage() {
  // Page state: list of permissions loaded from the backend.
  const [permissions, setPermissions] = useState<Permission[]>([]);
  // Modal state: whether the "Create Permission" dialog is visible.
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // UI state: error message shown at the top of the page.
  const [error, setError] = useState<string>('');

  // Hook-form manages create-permission form values + validation errors.
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePermissionForm>({
    defaultValues: { action: '', subject: '' },
  });

  // Fetch all permissions from `/api/permissions` (permission: read Permission).
  async function fetchPermissions() {
    try {
      setError('');
      const data = await getPermissions();
      setPermissions(data);
    } catch {
      setError('Failed to fetch permissions');
    }
  }

  // Fetch permissions once when the page mounts.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPermissions();
  }, []);

  // Create a new permission and refresh the list (permission: create Permission).
  const onSubmitCreate = async (values: CreatePermissionForm) => {
    try {
      setError('');
      await createPermission(values);
      reset();
      setIsCreateModalOpen(false);
      await fetchPermissions();
    } catch {
      setError('Failed to create permission');
    }
  };

  // Delete a permission and refresh the list (permission: delete Permission).
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;
    try {
      setError('');
      await deletePermission(id);
      await fetchPermissions();
    } catch {
      setError('Failed to delete permission');
    }
  };

  return (
    // AuthGuard ensures only users with read access to Permission see this page.
    <AuthGuard requiredPermissions={[{ action: 'read', subject: 'Permission' }]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Permissions</h1>

          {/* CASL: Create button is only visible if ability.can("create","Permission"). */}
          <Can I="create" a="Permission">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Permission
            </button>
          </Can>
        </div>

        {/* Global error banner for any failed API operation. */}
        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {permissions.map((permission) => (
              <li
                key={permission.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                {/* Each permission is rendered as "action:subject". */}
                <span className="text-sm text-gray-900">
                  {permission.action}:{permission.subject}
                </span>

                {/* CASL: Delete button only appears if ability.can("delete","Permission"). */}
                <Can I="delete" a="Permission">
                  <button
                    onClick={() => void handleDelete(permission.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </Can>
              </li>
            ))}
          </ul>
        </div>

        {/* Create Permission Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-medium mb-4">Create New Permission</h2>

              {/* handleSubmit runs validation first, then calls onSubmitCreate. */}
              <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
                <div>
                  <label
                    htmlFor="action"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Action
                  </label>

                  {/* register wires select into react-hook-form with required validation. */}
                  <select
                    id="action"
                    {...register('action', { required: 'Action is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select action</option>
                    <option value="create">create</option>
                    <option value="read">read</option>
                    <option value="update">update</option>
                    <option value="delete">delete</option>
                    <option value="manage">manage</option>
                  </select>

                  {/* Inline validation feedback for the action field. */}
                  {errors.action && (
                    <p className="text-red-600 text-sm">{errors.action.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Subject
                  </label>

                  {/* Subject is a free-text entity name (e.g., "User", "Post"). */}
                  <input
                    id="subject"
                    type="text"
                    {...register('subject', { required: 'Subject is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />

                  {/* Inline validation feedback for the subject field. */}
                  {errors.subject && (
                    <p className="text-red-600 text-sm">{errors.subject.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  {/* Cancel closes the modal without submitting. */}
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  {/* Submit triggers permission creation. */}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

