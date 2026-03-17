'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Can } from '@/components/auth/Can';
import { createRole, deleteRole, getRoles } from '@/lib/api/roles';
import type { Role } from '@/types';

// Form model used by react-hook-form for creating a role.
interface CreateRoleForm {
  name: string;
  description?: string;
}

export default function RolesPage() {
  // Page state: list of roles fetched from backend.
  const [roles, setRoles] = useState<Role[]>([]);
  // Modal state: whether the "Create Role" dialog is visible.
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // UI state: show an error message instead of only console logging.
  const [error, setError] = useState<string>('');

  // Hook-form manages create-role form values + validation errors.
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleForm>({
    defaultValues: { name: '', description: '' },
  });

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

  // Fetch roles once when the page mounts.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRoles();
  }, []);

  // Create a role and refresh the list (permission: create Role).
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

  // Delete a role and refresh the list (permission: delete Role).
  const handleDelete = async (id: string) => {
    // Confirm is a simple client-side guard against accidental destructive actions.
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
    // AuthGuard protects the page at the route level (permission: read Role).
    <AuthGuard requiredPermissions={[{ action: 'read', subject: 'Role' }]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Roles</h1>

          {/* CASL: Create button only renders if ability.can("create","Role") is true. */}
          <Can I="create" a="Role">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Role
            </button>
          </Can>
        </div>

        {/* Error banner for any failed API operation */}
        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {roles.map((role) => (
              <li key={role.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  {/* Role link is visible to readers; edit permission is checked separately below. */}
                  <Link
                    href={`/dashboard/roles/${role.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {role.name}
                  </Link>

                  {role.description && (
                    <p className="text-sm text-gray-500">{role.description}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  {/* CASL: Edit link only renders if ability.can("update","Role") is true. */}
                  <Can I="update" a="Role">
                    <Link
                      href={`/dashboard/roles/${role.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                  </Can>

                  {/* CASL: Delete button only renders if ability.can("delete","Role") is true. */}
                  <Can I="delete" a="Role">
                    <button
                      onClick={() => void handleDelete(role.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </Can>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Modal: simple create-role form */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-medium mb-4">Create New Role</h2>

              {/* handleSubmit runs validation first, then calls onSubmitCreate with the form data */}
              <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>

                  {/* register wires the input into react-hook-form + provides validation rules */}
                  <input
                    id="name"
                    type="text"
                    {...register('name', { required: 'Name is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />

                  {/* Inline validation feedback */}
                  {errors.name && (
                    <p className="text-red-600 text-sm">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>

                  {/* Description is optional, so we don't add a required rule here */}
                  <textarea
                    id="description"
                    {...register('description')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  {/* Cancel closes the modal without submitting */}
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  {/* Submit triggers role creation */}
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

