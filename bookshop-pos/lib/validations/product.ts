import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  author: z.string().trim().max(255).optional().nullable(),
  isbn: z.string().trim().max(20).optional().nullable().transform((val) => (val === "" ? null : val)),
  sku: z.string().trim().max(50).optional().nullable().transform((val) => (val === "" ? null : val)),
  category: z.string().trim().max(100).optional().nullable().transform((val) => (val === "" ? null : val)),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Valid price format required (e.g. 1500.00)")
    .refine((val) => parseFloat(val) >= 0, "Price cannot be negative"),
  cost: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Valid cost format required (e.g. 900.00)")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  quantity: z.number().int().min(0, "Initial quantity cannot be negative").default(0),
  reorderThreshold: z.number().int().min(0, "Reorder threshold cannot be negative").default(3),
});

export const updateProductSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  author: z.string().trim().max(255).optional().nullable(),
  isbn: z.string().trim().max(20).optional().nullable().transform((val) => (val === "" ? null : val)),
  sku: z.string().trim().max(50).optional().nullable().transform((val) => (val === "" ? null : val)),
  category: z.string().trim().max(100).optional().nullable().transform((val) => (val === "" ? null : val)),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Valid price format required (e.g. 1500.00)")
    .refine((val) => parseFloat(val) >= 0, "Price cannot be negative"),
  cost: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Valid cost format required (e.g. 900.00)")
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  reorderThreshold: z.number().int().min(0, "Reorder threshold cannot be negative").default(3),
});

export const adjustStockSchema = z.object({
  change: z.number().int().refine((val) => val !== 0, "Quantity adjustment cannot be 0"),
  reason: z.enum(["restock", "adjustment", "return"]),
  note: z.string().trim().max(500).optional().nullable(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
