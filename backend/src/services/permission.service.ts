import prisma from "../config/db";

export class PermissionService {
  // get all permissions
  async getAllPermissions() {
    return prisma.permission.findMany({
      orderBy: {
        subject: "asc",
        action: "asc",
      },
    });
  }
  // create a new permission
  async createPermission(data: {
    action: string;
    subject: string;
    conditions?: any;
  }) {
    // check if permission already exists
    const existing = await prisma.permission.findFirst({
      where: {
        action: data.action,
        subject: data.subject,
      },
    });
    if (existing) {
      throw new Error("Permission already exists");
    }
    return prisma.permission.create({ data });
  }
  // delete a permission
  async deletePermission(id: string) {
    //check if a permission is assigned to any role
    const rolesCount = await prisma.rolePermission.count({
      where: { permissionId: id },
    });
    if (rolesCount > 0) {
      throw new Error("Permission is assigned to a role and cannot be deleted");
    }
    return prisma.permission.delete({
      where: {
        id,
      },
    });
  }
}
