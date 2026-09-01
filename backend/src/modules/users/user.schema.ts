import { z } from 'zod';

export const updateMeSchema = z.object({
  businessInfo: z
    .object({
      businessName: z.string().max(200).optional(),
      address: z.string().max(500).optional(),
      logoUrl: z.string().url().optional().or(z.literal('')),
      defaultCurrency: z.string().length(3).toUpperCase().optional(),
      invoiceNumberPrefix: z.string().min(1).max(20).optional(),
    })
    .optional(),
});

export const deleteMeSchema = z.object({
  confirmation: z.literal('DELETE'),
});

export const sessionIdParamsSchema = z.object({
  id: z.string().min(1),
});
