import prisma from "../config/db";
import cacheService from "./cache.service";

export class RoleService {
  // get all roles with their permissions

  async getAllRoles() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  // get a single role by id
  async getRoleById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }
  // create a new role
  async createRole(data: { name: string; description?: string }) {
    //checks if role name already exists
    const existing = await prisma.role.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new Error("Role name already exists");
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
      throw new Error("Role name already exists");
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
      throw new Error("Cannot delete role that is assigned to users");
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
      throw new Error("Permission already assigned to role");
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
