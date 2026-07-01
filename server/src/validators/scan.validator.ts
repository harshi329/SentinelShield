import { z } from "zod";

export const createScanSchema = z.object({
  body: z.object({
    url: z.string().url("Invalid URL"),

    method: z
      .string()
      .min(2)
      .max(10)
      .optional(),

    ipAddress: z.string().optional(),

    headers: z
      .record(z.string(), z.string())
      .optional(),

    body: z.string().optional(),

    scanMode: z
      .enum([
        "Quick",
        "Deep",
        "AI",
      ])
      .optional(),
  }),
});
