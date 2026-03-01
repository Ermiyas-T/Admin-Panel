import { Router } from "express";

import { authorize } from "../middlewares/authorize";
import { authenticate } from "../middlewares/auth";

const router = Router();

// This route requires authentication AND 'create' permission on 'Post' subject
router.post("/", authenticate, authorize("create", "Post"), (req, res) => {
  // Logic to create post
  res.json({ message: "Post created" });
});

export default router;
