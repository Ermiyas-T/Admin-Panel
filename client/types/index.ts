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
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User & {
    permissions: string[]; // e.g., ["create:Post", "read:User"]
  };
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
