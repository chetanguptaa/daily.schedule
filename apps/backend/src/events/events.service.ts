import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { IAddUserToMeeting, ICreateEvent, IUpdateEvent } from './dto';
import prisma from '@repo/database';

@Injectable()
export class EventsService {
  constructor() {}

  async createEvent(userId: string, data: ICreateEvent) {
    const schedule = await prisma.schedule.findFirst({
      where: {
        default: true,
        userId,
      },
    });
    const platform = await prisma.platform.findFirst({
      where: {
        default: true,
      },
    });
    if (!schedule || !platform) throw new InternalServerErrorException();
    const event = await prisma.event.findFirst({
      where: {
        link: data.url,
        userId,
      },
    });
    if (event) {
      throw new BadRequestException('Event with this link already exist');
    }
    const res = await prisma.event.create({
      data: {
        scheduleId: schedule.id,
        userId,
        platformId: platform.id,
        title: data.title,
        description: data.description,
        duration: data.duration,
        link: data.url,
      },
    });
    if (res.id) {
      return {
        success: true,
        message: 'Event created successfully!!!',
        id: res.id,
      };
    }
  }

  async getUsersEvents(userId: string) {
    const events = await prisma.event.findMany({
      where: {
        userId,
      },
      include: {
        schedule: {
          select: {
            timezone: true,
          },
        },
      },
    });
    return events.map((ev) => ({
      id: ev.id,
      title: ev.title,
      description: ev.description,
      duration: ev.duration,
      link: ev.link,
    }));
  }

  async getUserSingleEvent(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        userId,
      },
      include: {
        platform: true,
        schedule: true,
      },
    });
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      link: event.link,
      duration: event.duration,
      platform: {
        id: event.platform.id,
        name: event.platform.name,
      },
      schedule: event.schedule.title,
      timezone: event.schedule.timezone,
      default: event.schedule.default,
    };
  }

  async updateEvent(userId: string, eventId: string, data: IUpdateEvent) {
    const event = await prisma.event.update({
      where: {
        id: eventId,
        userId,
      },
      data,
    });
    if (event) {
      return {
        success: true,
        message: 'Event updated successfully',
      };
    }
  }

  async getBookingDetails(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        event: {
          select: {
            id: true,
            platform: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    if (!booking) throw new BadRequestException('Booking not found');
    if (booking.event.platform.name !== 'daily.schedule (Global)') {
      throw new BadRequestException('This booking is not for Daily Schedule');
    }
    return booking;
  }

  async addUnauthenticatedUserToMeeting(id: string, data: IAddUserToMeeting) {
    await prisma.booking.update({
      where: {
        id,
      },
      data: {
        joinedCall: {
          push: data.username,
        },
      },
    });
  }
}
