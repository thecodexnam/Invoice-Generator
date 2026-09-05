import { User } from './user.model.js';
import { Session } from './session.model.js';
import { Invoice } from '../invoices/invoice.model.js';
import { Client } from '../clients/client.model.js';
import { notFound, badRequest } from '../../utils/AppError.js';
import { publicUser } from '../auth/auth.service.js';

export async function getMe(userId: string) {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) throw notFound('User not found');
  return publicUser(user);
}

export async function updateMe(userId: string, patch: { businessInfo?: Record<string, unknown> }) {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) throw notFound('User not found');

  if (patch.businessInfo) {
    user.businessInfo = {
      ...user.businessInfo,
      ...patch.businessInfo,
      nextInvoiceSeq: user.businessInfo?.nextInvoiceSeq ?? 1,
    };
  }
  await user.save();
  return publicUser(user);
}

export async function listSessions(userId: string) {
  const sessions = await Session.find({ userId }).sort({ createdAt: -1 }).lean();
  return sessions.map((s) => ({
    id: s._id.toString(),
    userAgent: s.userAgent,
    ip: s.ip,
    expiresAt: s.expiresAt,
    createdAt: s.createdAt,
  }));
}

export async function revokeSession(userId: string, sessionId: string) {
  const result = await Session.deleteOne({ _id: sessionId, userId });
  if (result.deletedCount === 0) throw notFound();
  return { ok: true };
}

export async function exportMyData(userId: string) {
  const user = await User.findOne({ _id: userId, isDeleted: false }).select('-passwordHash').lean();
  if (!user) throw notFound();

  const [invoices, clients, sessions] = await Promise.all([
    Invoice.find({ userId }).lean(),
    Client.find({ userId }).lean(),
    Session.find({ userId }).select('-refreshTokenHash').lean(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user._id.toString(),
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      plan: user.plan,
      businessInfo: user.businessInfo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    invoices,
    clients,
    sessions: sessions.map((s) => ({
      id: s._id.toString(),
      userAgent: s.userAgent,
      ip: s.ip,
      expiresAt: s.expiresAt,
      createdAt: s.createdAt,
    })),
  };
}

export async function deleteMe(userId: string, confirmation: string) {
  if (confirmation !== 'DELETE') {
    throw badRequest('Confirmation text mismatch', 'CONFIRM_TEXT_MISMATCH');
  }
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) throw notFound();

  user.isDeleted = true;
  await user.save();
  await Session.deleteMany({ userId });
  return { ok: true };
}
