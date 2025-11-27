import { BadRequestException, Injectable } from '@nestjs/common';
import prisma from '@repo/database';
import { EBookingStatus, IUpdateBookingStatus } from './dto';

@Injectable()
export class BookingsService {
  constructor() {}

  async getBookings(userId: string, status: EBookingStatus) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        email: true,
      },
    });
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          {
            event: {
              user: {
                id: userId,
              },
            },
          },
          {
            guestEmail: user.email,
          },
        ],
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
    const enriched = bookings.map((b) => ({
      ...b,
      isGuest: b.guestEmail === user.email,
    }));
    return this.getBookingsByStatus(enriched, status);
  }

  async updateBookingStatus(userId: string, body: IUpdateBookingStatus) {
    const booking = await prisma.booking.findUnique({
      where: {
        id: body.bookingId,
        event: {
          user: {
            id: userId,
          },
        },
      },
      include: {
        event: true,
      },
    });
    if (!booking) throw new BadRequestException('Booking not found');
    if (booking.event.userId !== userId)
      throw new BadRequestException(
        'You are not authorized to update the status of this booking',
      );
    return await prisma.booking.update({
      where: {
        id: body.bookingId,
      },
      data: {
        status: body.status,
      },
    });
  }

  private getBookingsByStatus(bookings: any[], status: EBookingStatus) {
    switch (status) {
      case EBookingStatus.CONFIRMED:
        return bookings.filter((booking) => booking.meetingDate > new Date());
      case EBookingStatus.REJECTED:
        return bookings.filter(
          (booking) => booking.status === EBookingStatus.REJECTED,
        );
      case EBookingStatus.PENDING:
        return bookings.filter(
          (booking) => booking.status === EBookingStatus.PENDING,
        );
      default:
        return bookings.filter((booking) => booking.meetingDate < new Date());
    }
  }
}
