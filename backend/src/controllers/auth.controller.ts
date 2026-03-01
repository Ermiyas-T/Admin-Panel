import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await authService.registerUser(email, password);
    res.status(201).json({ message: "User created", user });
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await authService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
