import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionToRole,
  removePermissionFromRole,
} from "../controllers/role.controller";

const router = Router();

// All role routes require authentication and appropriate permissions
router.use(authenticate);

router
  .route("/")
  .get(authorize("read", "Role"), getAllRoles)
  .post(authorize("create", "Role"), createRole);

router
  .route("/:id")
  .get(authorize("read", "Role"), getRoleById)
  .put(authorize("update", "Role"), updateRole)
  .delete(authorize("delete", "Role"), deleteRole);

// Permission assignment
router.post(
  "/:roleId/permissions/:permissionId",
  authorize("update", "Role"),
  assignPermissionToRole,
);
router.delete(
  "/:roleId/permissions/:permissionId",
  authorize("update", "Role"),
  removePermissionFromRole,
);

export default router;
