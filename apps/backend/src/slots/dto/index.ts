import z from 'zod';

export const getUsersSlotsDetailsSchema = z
  .object({
    date: z.number().min(1).max(31),
    month: z.string().min(1),
    timezone: z.string().min(1),
    dayOfWeek: z.number().min(0).max(6),
  })
  .strict();

export type IGetUsersSlotsDetails = z.infer<typeof getUsersSlotsDetailsSchema>;
