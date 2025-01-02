import { BadRequestException, Injectable } from '@nestjs/common';
import prisma from '@repo/database';
import { IGetUsersSlotsDetails } from './dto';
import { DateTime } from 'luxon';
import {
  addDays,
  addMinutes,
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
import { fromZonedTime } from 'date-fns-tz';
import { googleCalenderManager } from 'src/google-calender-manager/GoogleCalenderManager';

@Injectable()
export class SlotsService {
  constructor() {}

  async getUsersSlotsDetails(
    userId: string,
    link: string,
    data: IGetUsersSlotsDetails,
  ) {
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
            availabilities: {
              include: {
                timeSlots: true,
              },
            },
          },
        },
        platform: true,
      },
    });
    const date = new Date().toISOString();
    const dateFromFE = this.convertToTimezone(
      this.getDateAtMidnight(data.date, data.month).toISOString(),
      event.schedule.timezone,
    );

    console.log('date from fe ', dateFromFE);

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const bookings = await prisma.booking.findMany({
      where: {
        eventId: event.id,
        date: {
          gt: new Date(
            tomorrow.toLocaleString('en-US', {
              timeZone: data.timezone,
            }),
          ),
        },
        status: {
          in: ['confirmed', 'pending'],
        },
      },
      include: {
        event: {
          include: {
            schedule: {
              include: {
                availabilities: true,
              },
            },
          },
        },
      },
    });
    if (event) {
      let timeslots: string[] = [];
      const unavailableDays: number[] = this.getUnavailableWeekDays(
        event.schedule.availabilities,
      );
      for (let i = 0; i < event.schedule.availabilities.length; i++) {
        if (event.schedule.availabilities[i].dayOfWeek === data.dayOfWeek) {
          for (
            let j = 0;
            j < event.schedule.availabilities[i].timeSlots.length;
            j++
          ) {
            timeslots = this.convertTimeslots(
              this.generateTimeSlots(
                event.schedule.availabilities[i].timeSlots[j].startTime,
                event.schedule.availabilities[i].timeSlots[j].endTime,
                event.duration,
                bookings.map((b) => b.startTime),
              ),
              event.schedule.timezone,
              data.timezone,
            );
          }
        }
      }
      return {
        user: {
          picture: user.picture,
          name: user.name,
        },
        event: {
          title: event.title,
          duration: event.duration,
          timeslots,
          unavailableDays,
        },
        platform: {
          name: event.platform.name,
        },
      };
    }
    // const tomorrowDate = addDays(
    //   roundToNearestMinutes(new Date(), {
    //     nearestTo: 15,
    //     roundingMethod: 'ceil',
    //   }),
    //   5,
    // );
    // const endDate = endOfDay(tomorrowDate);
    // return await this.getValidTimesFromSchedule(
    //   user.id,
    //   eachMinuteOfInterval(
    //     { start: tomorrowDate, end: endDate },
    //     { step: event.duration },
    //   ),
    //   event.duration,
    //   data,
    // );
  }

  async getValidTimesFromSchedule(
    userId: string,
    timesInOrder: Date[],
    duration: number,
    data: IGetUsersSlotsDetails,
  ) {
    const start = timesInOrder[0];
    const end = timesInOrder.at(-1);
    if (start == null || end == null) return [];
    const schedule = await prisma.schedule.findFirst({
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
    if (schedule == null) return [];
    const map = new Map<number, { startTime: string; endTime: string }[]>();
    for (let i = 0; i < schedule.availabilities.length; i++) {
      const availability = schedule.availabilities[i];
      map.set(
        availability.dayOfWeek,
        availability.timeSlots.map((ts) => {
          return {
            startTime: ts.startTime,
            endTime: ts.endTime,
          };
        }),
      );
    }
    const eventTimes = await googleCalenderManager.getCalendarEventTimes(
      userId,
      {
        start,
        end,
      },
    );
    return timesInOrder.filter((intervalDate) => {
      const availabilities = this.getAvailabilities(
        map,
        intervalDate,
        schedule.timezone,
      );
      const eventInterval = {
        start: intervalDate,
        end: addMinutes(intervalDate, duration),
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
    groupedAvailabilities: Map<
      number,
      { startTime: string; endTime: string }[]
    >,
    date: Date,
    timezone: string,
  ) {
    let availabilities = [];
    if (isMonday(date)) {
      availabilities = groupedAvailabilities.get(0);
    }
    if (isTuesday(date)) {
      availabilities = groupedAvailabilities.get(1);
    }
    if (isWednesday(date)) {
      availabilities = groupedAvailabilities.get(2);
    }
    if (isThursday(date)) {
      availabilities = groupedAvailabilities.get(3);
    }
    if (isFriday(date)) {
      availabilities = groupedAvailabilities.get(4);
    }
    if (isSaturday(date)) {
      availabilities = groupedAvailabilities.get(5);
    }
    if (isSunday(date)) {
      availabilities = groupedAvailabilities.get(6);
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

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number = 15,
    bookedSlots: string[],
  ): string[] {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    const timeSlots: string[] = [];

    let current = start;
    while (current < end) {
      const next = this.addMinutes(current, duration);
      if (next <= end) {
        const formattedTime = this.formatTime(current);
        if (!bookedSlots.includes(formattedTime)) {
          timeSlots.push(formattedTime);
        }
      }
      current = next;
    }
    return timeSlots;
  }

  private parseTime(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  private formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
  }

  private getUnavailableWeekDays(availabilities: any) {
    const allWeekDays = [0, 1, 2, 3, 4, 5, 6];
    const availableWeekDays = availabilities.map(
      (availability) => availability.dayOfWeek,
    );
    const unavailableWeekDays = allWeekDays.filter(
      (day) => !availableWeekDays.includes(day),
    );
    return unavailableWeekDays;
  }

  private convertTimeslots(
    timeslots: string[],
    sourceTimezone: string,
    targetTimezone: string,
  ): string[] {
    return timeslots.map((timeslot) => {
      const dateTime = DateTime.fromFormat(timeslot, 'h:mm a', {
        zone: sourceTimezone,
      });
      const convertedTime = dateTime.setZone(targetTimezone);
      return convertedTime.toFormat('h:mm a');
    });
  }

  private getDateAtMidnight(day: number, monthYear: string): Date {
    console.log('what is the day ', day);
    console.log('month year ', monthYear);

    const [month, year] = monthYear.split('-').map(Number);
    if (month < 0 || month >= 11) {
      throw new Error(
        'Invalid month. Month should be between 0 (January) and 11 (December).',
      );
    }
    if (day < 1 || day > 31) {
      throw new Error('Invalid day. Day should be between 1 and 31.');
    }
    const date = new Date(year, month, day, 0, 0, 0, 0);
    if (
      date.getDate() !== day ||
      date.getMonth() !== month ||
      date.getFullYear() !== year
    ) {
      throw new Error('Invalid date. Please check the input values.');
    }
    return date;
  }

  private convertToTimezone(isoDate: string, timezone: string): Date {
    try {
      const date = new Date(isoDate);
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const parts = formatter.formatToParts(date);
      const dateParts: { [key: string]: string } = {};
      parts.forEach((part) => {
        if (part.type !== 'literal') {
          dateParts[part.type] = part.value;
        }
      });
      return new Date(
        `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}`,
      );
    } catch (error) {
      throw new Error(`Error converting date: ${error.message}`);
    }
  }
}
