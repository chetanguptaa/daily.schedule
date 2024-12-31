import z from 'zod';

export const createEventSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    duration: z.number().min(15, "Duration can't be less than 15 minutes"),
    url: z.string().min(1, 'URL is required'),
  })
  .strict();

export type ICreateEvent = z.infer<typeof createEventSchema>;

export const updateEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string(),
  duration: z.number().min(15),
  platformId: z.string(),
});

export type IUpdateEvent = z.infer<typeof updateEventSchema>;
