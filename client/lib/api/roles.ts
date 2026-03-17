import apiClient from "./client";
import type { Role } from "@/types";

// Fetch all roles (requires backend permission: read Role).
export const getRoles = async (): Promise<Role[]> => {
  const response = await apiClient.get<Role[]>("/roles");
  return response.data;
};

// Fetch a single role (requires backend permission: read Role).
export const getRole = async (id: string): Promise<Role> => {
  const response = await apiClient.get<Role>(`/roles/${id}`);
  return response.data;
};

// Create a role (requires backend permission: create Role).
export const createRole = async (data: {
  name: string;
  description?: string;
}): Promise<Role> => {
  const response = await apiClient.post<Role>("/roles", data);
  return response.data;
};

// Update role fields (requires backend permission: update Role).
export const updateRole = async (
  id: string,
  data: { name?: string; description?: string },
): Promise<Role> => {
  const response = await apiClient.put<Role>(`/roles/${id}`, data);
  return response.data;
};

// Delete a role (requires backend permission: delete Role).
export const deleteRole = async (id: string): Promise<void> => {
  await apiClient.delete(`/roles/${id}`);
};

// Assign a permission to a role (requires backend permission: update Role).
export const assignPermissionToRole = async (
  roleId: string,
  permissionId: string,
): Promise<void> => {
  await apiClient.post(`/roles/${roleId}/permissions/${permissionId}`);
};

// Remove a permission from a role (requires backend permission: update Role).
export const removePermissionFromRole = async (
  roleId: string,
  permissionId: string,
): Promise<void> => {
  await apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`);
};

