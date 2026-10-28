import { z } from "zod";

export const siteIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const energyQuerySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from must be YYYY-MM-DD"),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to must be YYYY-MM-DD"),
  })
  .refine((q) => q.from <= q.to, { message: "from must not be after to" });

export const chargerStatusSchema = z.enum([
  "available",
  "charging",
  "faulted",
  "offline",
]);

export const listChargersQuerySchema = z.object({
  status: chargerStatusSchema.optional(),
});

export const chargerIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
