import { MongoAbility } from "@casl/ability";
// Define all possible actions in the system
export const Actions = [
  "create",
  "read",
  "update",
  "delete",
  "manage",
] as const;
export type Action = (typeof Actions)[number]; // "create" | "read" | "update" | "delete" | "manage"

// Define all possible subjects (resources)
export const Subjects = [
  "User",
  "Role",
  "Permission",
  "Post",
  "Comment",
  "all",
] as const;
export type Subject = (typeof Subjects)[number];

// For CASL, we need a type that represents the subject (can be a string or a constructor)
// We'll use a generic type alias to simplify
export type AppAbility = MongoAbility<[Action, Subject]>;
