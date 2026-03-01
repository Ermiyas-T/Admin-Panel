// src/controllers/userRole.controller.ts
import { Request, Response, NextFunction } from "express";
import { UserRoleService } from "../services/userRole.service";

const userRoleService = new UserRoleService();

export const assignRoleToUser = async (
  req: Request<{ userId: string; roleId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, roleId } = req.params;
    const result = await userRoleService.assignRoleToUser(userId, roleId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeRoleFromUser = async (
  req: Request<{ userId: string; roleId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, roleId } = req.params;
    await userRoleService.removeRoleFromUser(userId, roleId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getUserRoles = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const roles = await userRoleService.getUserRoles(userId);
    res.json(roles);
  } catch (error) {
    next(error);
  }
};
