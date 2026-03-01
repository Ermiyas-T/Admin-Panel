import { Request, Response, NextFunction } from "express";
import { RoleService } from "../services/role.service";

const roleService = new RoleService();

export const getAllRoles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roles = await roleService.getAllRoles();
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const role = await roleService.getRoleById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.json(role);
  } catch (error) {
    next(error);
  }
};

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const role = await roleService.createRole({ name, description });
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const role = await roleService.updateRole(id, { name, description });
    res.status(200).json(role);
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    await roleService.deleteRole(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const assignPermissionToRole = async (
  req: Request<{ roleId: string; permissionId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { roleId, permissionId } = req.params;
    const result = await roleService.assignPermissionToRole(
      roleId,
      permissionId,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const removePermissionFromRole = async (
  req: Request<{ roleId: string; permissionId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { roleId, permissionId } = req.params;
    await roleService.removePermissionFromRole(roleId, permissionId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
