import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  getAllPermissions,
  createPermission,
  deletePermission,
} from "../controllers/permission.controller";

const router = Router();

router.use(authenticate);

router
  .route("/")
  .get(authorize("read", "Permission"), getAllPermissions)
  .post(authorize("create", "Permission"), createPermission);

router
  .route("/:id")
  .delete(authorize("delete", "Permission"), deletePermission);

export default router;
