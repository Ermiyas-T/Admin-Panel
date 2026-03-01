import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import prisma from "../config/db";

const router = Router();

router.use(authenticate);
//optional  which will be used by admin to get all users
router.get("/", authorize("read", "User"), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, createdAt: true },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;
