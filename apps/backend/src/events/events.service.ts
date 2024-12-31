import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ICreateEvent } from './dto';
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
    const res = await prisma.event.create({
      data: {
        userId,
        scheduleId: schedule.id,
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
}
