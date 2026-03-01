// src/routes/userRole.routes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
} from "../controllers/userRole.controller";

const router = Router();

router.use(authenticate);

router.get("/users/:userId/roles", authorize("read", "User"), getUserRoles);
router.post(
  "/users/:userId/roles/:roleId",
  authorize("update", "User"),
  assignRoleToUser,
);
router.delete(
  "/users/:userId/roles/:roleId",
  authorize("update", "User"),
  removeRoleFromUser,
);

export default router;
