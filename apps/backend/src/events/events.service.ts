import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ICreateEvent, IUpdateEvent } from './dto';
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

  async getUserSingleEvent(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: {
        userId,
        id: eventId,
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
        userId,
        id: eventId,
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
}
