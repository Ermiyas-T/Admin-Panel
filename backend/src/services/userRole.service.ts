import prisma from "../config/db";
import cacheService from "./cache.service";

export class UserRoleService {
  // Assign a role to a user
  async assignRoleToUser(userId: string, roleId: string) {
    // check if user already has the role
    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
    if (existing) {
      throw new Error("User already has this role");
    }
    
    const result = await prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
    
    // Invalidate user's permission cache
    await cacheService.invalidatePermissions(userId);
    
    return result;
  }
  
  // get user roles
  async getUserRoles(userId: string) {
    return prisma.userRole.findMany({
      where: {
        userId: userId,
      },
    });
  }
  
  // Remove a role from a user
  async removeRoleFromUser(userId: string, roleId: string) {
    const result = await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
    
    // Invalidate user's permission cache
    await cacheService.invalidatePermissions(userId);
    
    return result;
  }
}
