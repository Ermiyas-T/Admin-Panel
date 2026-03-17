import prisma from "../config/db";

interface ServiceError extends Error {
  status?: number;
}

const createServiceError = (message: string, status: number): ServiceError => {
  const error = new Error(message) as ServiceError;
  error.status = status;
  return error;
};

export class PermissionService {
  // get all permissions
  async getAllPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ subject: "asc" }, { action: "asc" }],
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
      throw createServiceError("Permission already exists", 409);
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
      throw createServiceError(
        "Permission is assigned to a role and cannot be deleted",
        409,
      );
    }
    return prisma.permission.delete({
      where: {
        id,
      },
    });
  }
}
