import type { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/validate.js';
import * as userService from './user.service.js';

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.getMe(req.user!._id);
  res.json({ success: true, data });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.updateMe(req.user!._id, req.body);
  res.json({ success: true, data });
});

export const exportMe = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.exportMyData(req.user!._id);
  res.json({ success: true, data });
});

export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.deleteMe(req.user!._id, req.body.confirmation);
  res.json({ success: true, data });
});

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.listSessions(req.user!._id);
  res.json({ success: true, data });
});

export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.revokeSession(req.user!._id, req.params.id as string);
  res.json({ success: true, data });
});
