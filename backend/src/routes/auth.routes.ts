import { Router } from "express";
import { register, login, refreshToken, logout, getMyPermissions, getMe } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.get("/permissions", authenticate, getMyPermissions);

export default router;
