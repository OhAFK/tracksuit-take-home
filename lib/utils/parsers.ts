import { z } from "zod";

const UInt16: z.ZodNumber = z
  .number()
  .int()
  .min(0)
  .max(Math.pow(2, 16) - 1);

export const Port: z.ZodType<number> = z.coerce.number().pipe(UInt16);
