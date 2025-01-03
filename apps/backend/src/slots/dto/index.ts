import z from 'zod';

export enum DayOfWeek {
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THRUSDAY,
  FRIDAY,
  SATURDAY,
  SUNDAY,
}

export const getUsersSlotsDetailsSchema = z
  .object({
    date: z.number().min(1).max(31),
    month: z.string().min(1),
    dayOfWeek: z.enum([
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ]),
  })
  .strict();

export type IGetUsersSlotsDetails = z.infer<typeof getUsersSlotsDetailsSchema>;

export const bookSlotSchema = z
  .object({
    date: z.string(),
    startTime: z.string(),
    guestEmail: z.string().email(),
    guestName: z.string().min(1),
    timezone: z.string().min(1),
    guestNotes: z.string().optional(),
    eventId: z.string().min(1),
    userId: z.string().min(1),
  })
  .strict();

export type IBookSlot = z.infer<typeof bookSlotSchema>;
