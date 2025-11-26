import { BadRequestException, Injectable } from '@nestjs/common';
import prisma from '@repo/database';
import { BookingStatus } from './dto';

@Injectable()
export class BookingsService {
  constructor() {}

  async getBookings(userId: string, status: BookingStatus) {
    const bookings = await prisma.booking.findMany({
      where: {
        event: {
          user: {
            id: userId,
          },
        },
      },
      include: {
        event: {
          include: {
            platform: true,
            schedule: {
              select: {
                timezone: true,
              },
            },
          },
        },
      },
    });
    return this.getBookingsByStatus(bookings, status);
  }

  private getBookingsByStatus(bookings: any[], status: BookingStatus) {
    switch (status) {
      case BookingStatus.UPCOMING:
        return bookings.filter((booking) => booking.meetingDate > new Date());
      case BookingStatus.PAST:
        return bookings.filter((booking) => booking.meetingDate < new Date());
      case BookingStatus.CANCELED:
        return bookings.filter(
          (booking) => booking.status === BookingStatus.CANCELED,
        );
      case BookingStatus.UNCONFIRMED:
        return bookings.filter((booking) => booking.status === 'PENDING');
      default:
        throw new BadRequestException('Invalid status');
    }
  }
}
