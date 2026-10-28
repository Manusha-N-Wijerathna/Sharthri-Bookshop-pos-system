import { z } from "zod";

// Flexible price parser that accepts "280", "280.00", 280, "1,500.50"
const priceSchema = z
  .union([z.string(), z.number()])
  .transform((val) => String(val).trim().replace(/,/g, ""))
  .refine(
    (val) => val.length > 0 && !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    "Valid price required (e.g. 280.00)"
  )
  .transform((val) => parseFloat(val).toFixed(2));

// Optional cost parser
const costSchema = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .transform((val) => {
    if (val === undefined || val === null || val === "") return null;
    const clean = String(val).trim().replace(/,/g, "");
    if (!clean) return null;
    return clean;
  })
  .refine(
    (val) => val === null || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    "Valid cost required (e.g. 220.00)"
  )
  .transform((val) => (val === null ? null : parseFloat(val).toFixed(2)));

export const createProductSchema = z.object({
  title: z.string().trim().min(1, "Item / Product name is required").max(255),
  author: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  isbn: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  sku: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  category: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  price: priceSchema,
  cost: costSchema,
  quantity: z
    .union([z.string(), z.number()])
    .transform((val) => parseInt(String(val), 10) || 0)
    .refine((val) => val >= 0, "Initial quantity cannot be negative")
    .default(0),
  reorderThreshold: z
    .union([z.string(), z.number()])
    .transform((val) => parseInt(String(val), 10) || 0)
    .refine((val) => val >= 0, "Reorder threshold cannot be negative")
    .default(3),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = z.object({
  title: z.string().trim().min(1, "Item / Product name is required").max(255),
  author: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  isbn: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  sku: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  category: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  price: priceSchema,
  cost: costSchema,
  reorderThreshold: z
    .union([z.string(), z.number()])
    .transform((val) => parseInt(String(val), 10) || 0)
    .refine((val) => val >= 0, "Reorder threshold cannot be negative")
    .default(3),
  isActive: z.boolean().optional(),
});

export const adjustStockSchema = z.object({
  change: z
    .union([z.string(), z.number()])
    .transform((val) => parseInt(String(val), 10) || 0)
    .refine((val) => val !== 0, "Quantity adjustment cannot be 0"),
  reason: z.enum(["restock", "adjustment", "return"]),
  note: z.string().trim().max(500).optional().nullable(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
