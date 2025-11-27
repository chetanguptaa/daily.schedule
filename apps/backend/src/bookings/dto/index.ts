import { z } from 'zod';

export enum EBookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

export const updateBookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.nativeEnum(EBookingStatus),
});

export type IUpdateBookingStatus = z.infer<typeof updateBookingStatusSchema>;
