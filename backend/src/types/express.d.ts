declare global {
  namespace Express {
    interface User {
      id: string;
      permissions: string[];
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
