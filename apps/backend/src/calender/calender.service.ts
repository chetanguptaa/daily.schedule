import { BadRequestException, Injectable } from '@nestjs/common';
import { ICreateUserScheduleSlotType, ICreateUserScheduleType } from './dto';
import prisma from '@repo/database';

@Injectable()
export class CalenderService {
  constructor() {}

  async getUserSchedules(userId: string) {
    const userSchedules = await prisma.schedule.findMany({
      where: {
        userId,
      },
    });
    return userSchedules.map((us) => {
      return {
        id: us.id,
        title: us.title,
        timezone: us.timezone,
      };
    });
  }

  async createUserSchedule(userId: string, data: ICreateUserScheduleType) {
    const doesSchedulesExist = await prisma.schedule.findFirst({
      where: {
        userId,
      },
    });
    if (doesSchedulesExist) {
      const newSchedule = await prisma.schedule.create({
        data: {
          userId: userId,
          title: data.title,
          default: true,
        },
        select: {
          id: true,
        },
      });
      if (newSchedule) {
        return {
          success: true,
          message: 'Schedule created successfully!!!',
          id: newSchedule.id,
        };
      }
    } else {
      const newSchedule = await prisma.schedule.create({
        data: {
          userId: userId,
          title: data.title,
          default: true,
        },
        select: {
          id: true,
        },
      });
      if (newSchedule) {
        return {
          success: true,
          message: 'Schedule created successfully!!!',
          id: newSchedule.id,
        };
      }
    }
  }

  async addSlots(userId: string, data: ICreateUserScheduleSlotType) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: data.scheduleId },
    });
    if (!schedule || schedule.userId !== userId) {
      throw new BadRequestException();
    }
    await prisma.$transaction(async (prismaTransaction) => {
      await prismaTransaction.schedule.update({
        where: { id: data.scheduleId },
        data: { timezone: data.timezone },
      });
      for (const [day, daySlots] of Object.entries(data.slots)) {
        if (daySlots.length > 0) {
          // Insert into availabilities
          const availability = await prismaTransaction.availability.create({
            data: {
              scheduleId: data.scheduleId,
              dayOfWeek: parseInt(day, 10),
            },
            select: { id: true },
          });
          const availabilityId = availability.id;
          if (availabilityId) {
            const timeSlotsData = daySlots.map((slot) => ({
              availabilityId,
              startTime: slot.startTime,
              endTime: slot.endTime,
            }));
            await prismaTransaction.availabilityTimeSlot.createMany({
              data: timeSlotsData,
            });
          }
        }
      }
    });
  }
}
