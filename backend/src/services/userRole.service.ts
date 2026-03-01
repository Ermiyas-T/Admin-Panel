import prisma from "../config/db";

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
    return prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
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
    return prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }
}
