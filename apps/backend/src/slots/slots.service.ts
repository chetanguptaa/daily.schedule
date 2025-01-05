import { BadRequestException, Injectable } from '@nestjs/common';
import prisma from '@repo/database';
import { DayOfWeek, IBookSlot } from './dto';
import {
  addMinutes,
  addMonths,
  areIntervalsOverlapping,
  eachMinuteOfInterval,
  endOfDay,
  isFriday,
  isMonday,
  isSaturday,
  isSunday,
  isThursday,
  isTuesday,
  isWednesday,
  isWithinInterval,
  roundToNearestMinutes,
  setHours,
  setMinutes,
} from 'date-fns';
import { googleCalenderManager } from 'src/google-calender-manager/GoogleCalenderManager';
import { format, fromZonedTime, toZonedTime } from 'date-fns-tz';

@Injectable()
export class SlotsService {
  constructor() {}

  async getUsersSlotsDetails(userId: string, link: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) throw new BadRequestException();
    const event = await prisma.event.findFirst({
      where: {
        link,
        userId,
      },
      include: {
        schedule: {
          include: {
            availabilities: true,
          },
        },
        platform: true,
      },
    });
    const startDate = roundToNearestMinutes(new Date(), {
      nearestTo: 15,
      roundingMethod: 'ceil',
    });
    const endDate = endOfDay(addMonths(startDate, 2));
    return {
      user: {
        picture: user.picture,
        name: user.name,
        id: user.id,
      },
      event: {
        validTimes: await this.getValidTimesFromSchedule(
          eachMinuteOfInterval(
            { start: startDate, end: endDate },
            { step: event.duration },
          ),
          event,
        ),
        id: event.id,
        title: event.title,
        duration: event.duration,
      },
      platform: {
        name: event.platform.name,
      },
    };
  }

  async bookUsersSlot(data: IBookSlot) {
    const event = await prisma.event.findFirst({
      where: {
        userId: data.userId,
        id: data.eventId,
      },
    });
    if (event === null) throw new BadRequestException();
    const startInTimezone = fromZonedTime(data.startTime, data.timezone);
    const validTimes = await this.getValidTimesFromSchedule(
      [startInTimezone],
      event,
    );
    if (validTimes.length === 0) {
      throw new BadRequestException('Slot already booked!!!');
    }
    const res = await googleCalenderManager.createCalendarEvent({
      ...data,
      startTime: startInTimezone,
      durationInMinutes: event.duration,
      eventName: event.title,
      platform: event.platformId,
      timezone: data.timezone,
    });
    const dayInfo = this.getDayInfo(
      data.timezone,
      data.startTime,
      event.duration,
    );
    const booking = await prisma.booking.create({
      data: {
        eventId: event.id,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        startTime: dayInfo.startTime,
        endTime: dayInfo.endTime,
        meetingDate: data.startTime,
        // @ts-expect-error TODO -> we'll look into it
        dayOfWeek: dayInfo.dayOfWeek,
        meetingLink: res.hangoutLink,
      },
    });
    if (booking.id) {
      return {
        success: true,
        message: 'Meeting booked successfully',
      };
    }
  }

  private getDayInfo(timezone: string, date: string | Date, duration: number) {
    const dateObj = new Date(date);
    const zonedStartTime = toZonedTime(dateObj, timezone);
    const zonedEndTime = addMinutes(zonedStartTime, duration);
    return {
      dayOfWeek: format(zonedStartTime, 'EEEE', {
        timeZone: timezone,
      }).toUpperCase(),
      startTime: format(zonedStartTime, 'HH:mm', { timeZone: timezone }),
      endTime: format(zonedEndTime, 'HH:mm', { timeZone: timezone }),
    };
  }

  private async getValidTimesFromSchedule(
    timesInOrder: Date[],
    event: { userId: string; duration: number },
  ) {
    const start = timesInOrder[0];
    const end = timesInOrder.at(-1);
    if (start == null || end == null) return [];
    const schedule = await prisma.schedule.findFirst({
      where: {
        userId: event.userId,
      },
      include: {
        availabilities: true,
      },
    });
    if (schedule == null) return [];
    const groupedAvailabilities = this.groupBy(
      schedule.availabilities,
      (a) => a.dayOfWeek,
    );
    const eventTimes = await googleCalenderManager.getCalendarEventTimes(
      event.userId,
      {
        start,
        end,
      },
    );
    return timesInOrder.filter((intervalDate) => {
      const availabilities = this.getAvailabilities(
        // @ts-expect-error TODO -> Figure out the type
        groupedAvailabilities,
        intervalDate,
        schedule.timezone,
      );
      const eventInterval = {
        start: intervalDate,
        end: addMinutes(intervalDate, event.duration),
      };

      return (
        eventTimes.every((eventTime) => {
          return !areIntervalsOverlapping(eventTime, eventInterval);
        }) &&
        availabilities.some((availability) => {
          return (
            isWithinInterval(eventInterval.start, availability) &&
            isWithinInterval(eventInterval.end, availability)
          );
        })
      );
    });
  }

  private getAvailabilities(
    groupedAvailabilities: Partial<
      Record<
        DayOfWeek,
        {
          id: string;
          createdAt: Date;
          updatedAt: Date;
          scheduleId: string;
          dayOfWeek: DayOfWeek;
          startTime: string;
          endTime: string;
        }[]
      >
    >,
    date: Date,
    timezone: string,
  ) {
    let availabilities:
      | {
          id: string;
          createdAt: Date;
          updatedAt: Date;
          scheduleId: string;
          dayOfWeek: DayOfWeek;
          startTime: string;
          endTime: string;
        }[]
      | undefined;

    if (isMonday(date)) {
      availabilities = groupedAvailabilities['MONDAY'];
    }
    if (isTuesday(date)) {
      availabilities = groupedAvailabilities['TUESDAY'];
    }
    if (isWednesday(date)) {
      availabilities = groupedAvailabilities['WEDNESDAY'];
    }
    if (isThursday(date)) {
      availabilities = groupedAvailabilities['THURSDAY'];
    }
    if (isFriday(date)) {
      availabilities = groupedAvailabilities['FRIDAY'];
    }
    if (isSaturday(date)) {
      availabilities = groupedAvailabilities['SATURDAY'];
    }
    if (isSunday(date)) {
      availabilities = groupedAvailabilities['SUNDAY'];
    }
    if (availabilities == null) return [];
    return availabilities.map(({ startTime, endTime }) => {
      const start = fromZonedTime(
        setMinutes(
          setHours(date, parseInt(startTime.split(':')[0])),
          parseInt(startTime.split(':')[1]),
        ),
        timezone,
      );
      const end = fromZonedTime(
        setMinutes(
          setHours(date, parseInt(endTime.split(':')[0])),
          parseInt(endTime.split(':')[1]),
        ),
        timezone,
      );
      return { start, end };
    });
  }

  private groupBy<T, K extends keyof any>(
    array: T[],
    keyGetter: (item: T) => K,
  ): Record<K, T[]> {
    return array.reduce(
      (result, currentItem) => {
        const key = keyGetter(currentItem);
        if (!result[key]) {
          result[key] = [];
        }
        result[key].push(currentItem);
        return result;
      },
      {} as Record<K, T[]>,
    );
  }
}
