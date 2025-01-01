import { BadRequestException, Injectable } from '@nestjs/common';
import prisma from '@repo/database';
import { IGetUsersSlotsDetails } from './dto';
import { DateTime } from 'luxon';

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
}
