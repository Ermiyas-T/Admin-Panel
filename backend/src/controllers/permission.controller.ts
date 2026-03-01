// src/controllers/permission.controller.ts
import { Request, Response, NextFunction } from "express";
import { PermissionService } from "../services/permission.service";

const permissionService = new PermissionService();

export const getAllPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const permissions = await permissionService.getAllPermissions();
    res.status(200).json(permissions);
  } catch (error) {
    next(error);
  }
};

export const createPermission = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { action, subject, conditions } = req.body;
    if (!action || !subject) {
      return res
        .status(400)
        .json({ message: "Action and subject are required" });
    }

    const permission = await permissionService.createPermission({
      action,
      subject,
      conditions,
    });
    res.status(201).json(permission);
  } catch (error) {
    next(error);
  }
};

export const deletePermission = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    await permissionService.deletePermission(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
