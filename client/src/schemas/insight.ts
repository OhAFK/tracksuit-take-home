import { z } from "zod";

export const Insight = z.object({
  id: z.number().int().min(0),
  brandId: z.number().int().min(0),
  date: z.coerce.date(),
  text: z.string(),
});

export type Insight = z.infer<typeof Insight>;
