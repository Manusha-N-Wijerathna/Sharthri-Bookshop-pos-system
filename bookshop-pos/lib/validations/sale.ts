import { z } from "zod";

export const saleItemInputSchema = z.object({
  productId: z.number().int().positive("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const createSaleSchema = z.object({
  items: z
    .array(saleItemInputSchema)
    .min(1, "Cart cannot be empty, please add at least one item"),
  idempotencyKey: z
    .string()
    .min(1, "Idempotency key must be provided")
    .max(100, "Idempotency key too long")
    .optional(),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

