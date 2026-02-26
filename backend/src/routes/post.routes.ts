// src/routes/post.routes.ts
import { Router } from "express";

import { authorize } from "../middleware/authorize";
import { authenticate } from "../middleware/auth";

const router = Router();

// This route requires authentication AND 'create' permission on 'Post' subject
router.post("/", authenticate, authorize("create", "Post"), (req, res) => {
  // Logic to create post
  res.json({ message: "Post created" });
});

export default router;
