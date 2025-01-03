import z from 'zod';

/**
 * KIM -> here 0 means monday and so on
 */

export const createUserScheduleSchema = z
  .object({
    title: z.string().min(1),
  })
  .strict();

export type ICreateUserScheduleType = z.infer<typeof createUserScheduleSchema>;

export const createUserScheduleSlotSchema = z
  .object({
    timezone: z.string().min(1, 'Timezone is required'),
    availabilities: z.array(
      z.object({
        dayOfWeek: z.enum([
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
          'SUNDAY',
        ]),
        startTime: z.string(),
        endTime: z.string(),
      }),
    ),
    scheduleId: z.string().min(1, 'Schedule Id is required'),
  })
  .strict();

export type ICreateUserScheduleSlotType = z.infer<
  typeof createUserScheduleSlotSchema
>;

export const deleteUserScheduleSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export type IDeleteUserSchedule = z.infer<typeof deleteUserScheduleSchema>;

export enum DayOfWeek {
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THRUSDAY,
  FRIDAY,
  SATURDAY,
  SUNDAY,
}
