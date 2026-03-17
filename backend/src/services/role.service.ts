import prisma from "../config/db";
import cacheService from "./cache.service";

interface ServiceError extends Error {
  status?: number;
}

const createServiceError = (message: string, status: number): ServiceError => {
  const error = new Error(message) as ServiceError;
  error.status = status;
  return error;
};

const roleWithPermissionsInclude = {
  permissions: {
    include: {
      permission: true,
    },
  },
} as const;

const normalizeRole = <
  T extends {
    permissions?: Array<{
      permission: {
        id: string;
        action: string;
        subject: string;
        conditions: unknown;
      };
    }>;
  },
>(
  role: T | null,
) => {
  if (!role) return role;

  return {
    ...role,
    permissions: role.permissions?.map((entry) => entry.permission) ?? [],
  };
};

export class RoleService {
  // get all roles with their permissions

  async getAllRoles() {
    const roles = await prisma.role.findMany({
      include: roleWithPermissionsInclude,
    });

    return roles.map((role) => normalizeRole(role));
  }

  // get a single role by id
  async getRoleById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: roleWithPermissionsInclude,
    });

    return normalizeRole(role);
  }
  // create a new role
  async createRole(data: { name: string; description?: string }) {
    //checks if role name already exists
    const existing = await prisma.role.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw createServiceError("Role name already exists", 409);
    }
    return prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }
  // update a role
  async updateRole(id: string, data: { name?: string; description?: string }) {
    //check if role exists
    const existing = await prisma.role.findFirst({
      where: { name: data.name, NOT: { id } },
    });
    if (existing) {
      throw createServiceError("Role name already exists", 409);
    }
    return prisma.role.update({
      where: { id },
      data,
    });
  }
  // delete a role
  async deleteRole(id: string) {
    // check if the role is in use (has any users)
    const usresWithRole = await prisma.user.findFirst({
      where: {
        roles: {
          some: {
            roleId: id,
          },
        },
      },
    });
    if (usresWithRole) {
      throw createServiceError("Cannot delete role that is assigned to users", 409);
    }
    
    // Get all users with this role to invalidate their cache
    const usersWithRole = await prisma.userRole.findMany({
      where: { roleId: id },
      select: { userId: true },
    });
    
    // Invalidate cache for all affected users
    await Promise.all(
      usersWithRole.map((ur) => cacheService.invalidatePermissions(ur.userId))
    );
    
    return prisma.role.delete({
      where: { id },
    });
  }
  // assign a permission to a role
  async assignPermissionToRole(roleId: string, permissionId: string) {
    //check if aleady assigned
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });
    if (existing) {
      throw createServiceError("Permission already assigned to role", 409);
    }
    
    const result = await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
    
    // Get all users with this role to invalidate their cache
    const usersWithRole = await prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
    });
    
    // Invalidate cache for all affected users
    await Promise.all(
      usersWithRole.map((ur) => cacheService.invalidatePermissions(ur.userId))
    );
    
    return result;
  }
  // remove  a permission from a role
  async removePermissionFromRole(roleId: string, permissionId: string) {
    // Get all users with this role to invalidate their cache
    const usersWithRole = await prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
    });
    
    const result = await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });
    
    // Invalidate cache for all affected users
    await Promise.all(
      usersWithRole.map((ur) => cacheService.invalidatePermissions(ur.userId))
    );
    
    return result;
  }
}
