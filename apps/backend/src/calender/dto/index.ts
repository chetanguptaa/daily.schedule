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

const timeSlotSchema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().min(1),
});

const slotsSchema = z.object({
  0: z.array(timeSlotSchema),
  1: z.array(timeSlotSchema),
  2: z.array(timeSlotSchema),
  3: z.array(timeSlotSchema),
  4: z.array(timeSlotSchema),
  5: z.array(timeSlotSchema),
  6: z.array(timeSlotSchema),
});

export const createUserScheduleSlotSchema = z
  .object({
    timezone: z.string().min(1, 'Timezone is required'),
    slots: slotsSchema,
    scheduleId: z.string().min(1, 'Schedule Id is required'),
  })
  .strict();

export type ICreateUserScheduleSlotType = z.infer<
  typeof createUserScheduleSlotSchema
>;
