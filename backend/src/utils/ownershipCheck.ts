import type { Model, Types, HydratedDocument } from 'mongoose';
import { notFound } from './AppError.js';

export async function assertOwnership<T>(
  ModelClass: Model<T>,
  resourceId: string,
  userId: string | Types.ObjectId,
  extraFilter: Record<string, unknown> = {},
): Promise<HydratedDocument<T>> {
  const doc = await ModelClass.findOne({
    _id: resourceId,
    userId,
    ...extraFilter,
  });
  if (!doc) throw notFound();
  return doc as HydratedDocument<T>;
}
