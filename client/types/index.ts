export type Action = "create" | "read" | "update" | "delete" | "manage";
export type Subject =
  | "User"
  | "Role"
  | "Permission"
  | "Post"
  | "Comment"
  | "all";

export interface User {
  id: string;
  email: string;
  permissions?: string[];
  createdAt?: string;
}

export interface AuthenticatedUser extends User {
  permissions: string[];
}

export interface LoginResponse {
  message: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface MeResponse {
  user: AuthenticatedUser;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  action: string;
  subject: string;
  conditions?: unknown;
}
