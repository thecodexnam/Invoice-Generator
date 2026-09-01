import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { env } from '../../config/env.js';

const businessInfoSchema = new Schema(
  {
    businessName: { type: String },
    address: { type: String },
    logoUrl: { type: String },
    defaultCurrency: { type: String, default: 'USD' },
    invoiceNumberPrefix: { type: String, default: env.DEFAULT_INVOICE_PREFIX },
    nextInvoiceSeq: { type: Number, default: 1 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String },
    emailVerifyExpires: { type: Date },
    passwordResetTokenHash: { type: String },
    passwordResetExpires: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    businessInfo: { type: businessInfoSchema, default: () => ({}) },
    plan: { type: String, enum: ['free', 'paid'], default: 'free' },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User = mongoose.model('User', userSchema);
