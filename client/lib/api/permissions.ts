import apiClient from "./client";
import type { Permission } from "@/types";

// Fetch all permissions (requires backend permission: read Permission).
export const getPermissions = async (): Promise<Permission[]> => {
  const response = await apiClient.get<Permission[]>("/permissions");
  return response.data;
};

// Create a permission (requires backend permission: create Permission).
export const createPermission = async (data: {
  action: string;
  subject: string;
  conditions?: unknown;
}): Promise<Permission> => {
  const response = await apiClient.post<Permission>("/permissions", data);
  return response.data;
};

// Delete a permission (requires backend permission: delete Permission).
export const deletePermission = async (id: string): Promise<void> => {
  await apiClient.delete(`/permissions/${id}`);
};

