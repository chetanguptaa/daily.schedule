import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ICreateUserScheduleSlotType,
  ICreateUserScheduleType,
  IDeleteUserSchedule,
} from './dto';
import prisma from '@repo/database';
import { timeToInt } from 'src/utils/formatter';

@Injectable()
export class CalenderService {
  constructor() {}

  async getUserSchedules(userId: string) {
    const userSchedules = await prisma.schedule.findMany({
      where: {
        userId,
      },
      include: {
        availabilities: {
          include: {
            timeSlots: true,
          },
        },
      },
    });
    return userSchedules.map((us) => ({
      id: us.id,
      availability: this.formatAvailability(us.availabilities),
      timezone: us.timezone,
      title: us.title,
      default: us.default,
    }));
  }

  async createUserSchedule(userId: string, data: ICreateUserScheduleType) {
    const doesSchedulesExist = await prisma.schedule.findFirst({
      where: {
        userId,
      },
    });
    if (!doesSchedulesExist) {
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
      await prismaTransaction.availability.deleteMany({
        where: {
          scheduleId: data.scheduleId,
        },
      });
      for (const [day, daySlots] of Object.entries(data.slots)) {
        console.log('whats up ', day, daySlots);

        if (daySlots.length > 0) {
          const availability = await prismaTransaction.availability.create({
            data: {
              scheduleId: data.scheduleId,
              dayOfWeek: parseInt(day, 10),
            },
            select: { id: true },
          });
          const availabilityId = availability.id;
          if (availabilityId) {
            const timeSlotsData = daySlots.map((slot) => {
              if (timeToInt(slot.startTime) >= timeToInt(slot.endTime)) return;
              return {
                availabilityId,
                startTime: slot.startTime,
                endTime: slot.endTime,
              };
            });
            console.log('what is the availability id ', availabilityId);
            await prismaTransaction.timeSlot.deleteMany({
              where: {
                availabilityId,
              },
            });
            await prismaTransaction.timeSlot.createMany({
              data: timeSlotsData,
            });
          }
        }
      }
    });
    return {
      message: 'Slots added successfully',
    };
  }

  async deleteUserSchedule(userId: string, data: IDeleteUserSchedule) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: data.id, userId },
    });
    if (!schedule || schedule.userId !== userId) {
      throw new BadRequestException();
    }
    const res = await prisma.schedule.delete({
      where: {
        id: data.id,
      },
    });
    if (res.id) {
      return {
        success: true,
        message: 'Schedule deleted successfully!!!',
      };
    }
  }

  async getSlots(userId: string, scheduleId: string) {
    const schedule = await prisma.schedule.findFirst({
      where: {
        userId,
        id: scheduleId,
      },
      include: {
        availabilities: {
          include: {
            timeSlots: true,
          },
        },
      },
    });
    if (!schedule) {
      throw new BadRequestException();
    }
    return schedule;
  }

  private formatAvailability(
    data: {
      id: string;
      scheduleId: string;
      dayOfWeek: number;
      timeSlots: {
        id: string;
        availabilityId: string;
        startTime: string;
        endTime: string;
      }[];
    }[],
  ) {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    function groupDaysByTimeSlots(
      availabilities: {
        id: string;
        scheduleId: string;
        dayOfWeek: number;
        timeSlots: {
          id: string;
          availabilityId: string;
          startTime: string;
          endTime: string;
        }[];
      }[],
    ) {
      const timeSlotMap = new Map<string, Array<number>>();
      availabilities.forEach(({ dayOfWeek, timeSlots }) => {
        timeSlots.forEach(({ startTime, endTime }) => {
          const timeSlotKey = `${startTime}-${endTime}`;
          if (!timeSlotMap.has(timeSlotKey)) {
            timeSlotMap.set(timeSlotKey, []);
          }
          timeSlotMap.get(timeSlotKey).push(dayOfWeek);
        });
      });
      return timeSlotMap;
    }
    function formatDayRanges(days) {
      days.sort((a, b) => a - b);
      const ranges = [];
      let start = days[0];
      let end = days[0];
      for (let i = 1; i < days.length; i++) {
        if (days[i] === end + 1) {
          end = days[i];
        } else {
          ranges.push(
            start === end
              ? `${daysOfWeek[start]}`
              : `${daysOfWeek[start]} - ${daysOfWeek[end]}`,
          );
          start = days[i];
          end = days[i];
        }
      }
      ranges.push(
        start === end
          ? `${daysOfWeek[start]}`
          : `${daysOfWeek[start]} - ${daysOfWeek[end]}`,
      );
      return ranges.join(', ');
    }
    const timeSlotMap = groupDaysByTimeSlots(data);
    const result = [];
    timeSlotMap.forEach((days, timeSlotKey) => {
      const [startTime, endTime] = timeSlotKey.split('-');
      const formattedDays = formatDayRanges(days);
      const formattedTime = `${this.convertTo12Hour(startTime)} - ${this.convertTo12Hour(endTime)}`;
      result.push(`${formattedDays}, ${formattedTime}`);
    });
    return result;
  }

  private convertTo12Hour(time) {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const adjustedHour = hour % 12 || 12;
    return `${adjustedHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }
}
