// import { Request, Response, NextFunction } from "express";
// import { defineAbilityFor } from "../ability/ability.factory";
// import { Action, Subject } from "../ability/types";

// export const authorize = (action: Action, subject: Subject) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     // Ensure user is authenticated (authenticate middleware should run before this)
//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     // Build ability from user's permissions stored in token
//     const ability = defineAbilityFor(req.user.permissions);

//     if (ability.can(action, subject)) {
//       next(); // Permission granted
//     } else {
//       res.status(403).json({ message: "Forbidden" });
//     }
//   };
// };
// src/middleware/authorize.ts
import { Request, Response, NextFunction } from "express";
import { defineAbilityFor } from "../ability/ability.factory";
import { Action, Subject } from "../ability/types";

// Middleware factory to authorize actions on subjects
export const authorize = (action: Action, subject: Subject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user exists on request (authenticate middleware should populate it)
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { permissions } = req.user;

    // Build the CASL ability object from user's permissions
    const ability = defineAbilityFor(permissions);

    // Check if the action is allowed on the subject
    if (ability.can(action, subject)) {
      return next();
    }

    return res.status(403).json({ message: "Forbidden" });
  };
};
