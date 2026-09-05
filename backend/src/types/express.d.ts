import type { Request } from 'express';

export type AuthUser = {
  _id: string;
  email: string;
  plan: 'free' | 'paid';
  isEmailVerified: boolean;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
