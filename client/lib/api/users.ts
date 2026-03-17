import apiClient from "./client";
import type { Role, User } from "@/types";

// UserRole record returned by the backend (no `role` included, only IDs).
export interface UserRoleRecord {
  userId: string;
  roleId: string;
}

// Fetch all users (requires backend permission: read User).
export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>("/users");
  return response.data;
};

// Assign a role to a user (requires backend permission: update User).
export const assignRoleToUser = async (
  userId: string,
  roleId: string,
): Promise<UserRoleRecord> => {
  const response = await apiClient.post<UserRoleRecord>(
    `/user-roles/users/${userId}/roles/${roleId}`,
  );
  return response.data;
};

// Remove a role from a user (requires backend permission: update User).
export const removeRoleFromUser = async (
  userId: string,
  roleId: string,
): Promise<void> => {
  await apiClient.delete(`/user-roles/users/${userId}/roles/${roleId}`);
};

// Get a user's assigned roles (returns UserRole records with roleId/userId).
export const getUserRoles = async (userId: string): Promise<UserRoleRecord[]> => {
  const response = await apiClient.get<UserRoleRecord[]>(
    `/user-roles/users/${userId}/roles`,
  );
  return response.data;
};

// Convert userRole records into Role objects using the already-fetched roles list.
export const mapUserRolesToRoles = (
  userRoleRecords: UserRoleRecord[],
  allRoles: Role[],
): Role[] => {
  const roleIdSet = new Set(userRoleRecords.map((ur) => ur.roleId));
  return allRoles.filter((r) => roleIdSet.has(r.id));
};

