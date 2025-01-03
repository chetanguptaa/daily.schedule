import { BadRequestException } from '@nestjs/common';
import prisma from '@repo/database';
import { addMinutes, endOfDay, startOfDay } from 'date-fns';
import { google } from 'googleapis';

class GoogleCalenderManager {
  private GOOGLE_OAUTH_CLIENT_ID: string;
  private GOOGLE_OAUTH_CLIENT_SECRET: string;
  private static instance: GoogleCalenderManager;
  private constructor() {
    this.GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    this.GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  }

  public static getInstance(): GoogleCalenderManager {
    if (!GoogleCalenderManager.instance) {
      GoogleCalenderManager.instance = new GoogleCalenderManager();
    }
    return GoogleCalenderManager.instance;
  }

  async getCalendarEventTimes(
    clerkUserId: string,
    { start, end }: { start: Date; end: Date },
  ) {
    const oAuthClient = await this.getOAuthClient(clerkUserId);

    const events = await google.calendar('v3').events.list({
      calendarId: 'primary',
      eventTypes: ['default'],
      singleEvents: true,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      maxResults: 2500,
      auth: oAuthClient,
    });

    return (
      events.data.items
        ?.map((event) => {
          if (event.start?.date != null && event.end?.date != null) {
            return {
              start: startOfDay(event.start.date),
              end: endOfDay(event.end.date),
            };
          }

          if (event.start?.dateTime != null && event.end?.dateTime != null) {
            return {
              start: new Date(event.start.dateTime),
              end: new Date(event.end.dateTime),
            };
          }
        })
        .filter((date) => date != null) || []
    );
  }

  async getOAuthClient(userId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        accessToken: true,
      },
    });
    if (!user || !user.accessToken) throw new BadRequestException();
    const client = new google.auth.OAuth2(
      this.GOOGLE_OAUTH_CLIENT_ID,
      this.GOOGLE_OAUTH_CLIENT_SECRET,
    );
    client.setCredentials({ access_token: user.accessToken });
    return client;
  }

  async getOAuthTokens(code: string) {
    console.log('code is this ', code);
    // TODO
  }

  async createCalendarEvent({
    userId,
    guestName,
    guestEmail,
    startTime,
    guestNotes,
    durationInMinutes,
    eventName,
    platform,
  }: {
    userId?: string;
    guestName?: string;
    guestEmail?: string;
    startTime?: Date;
    guestNotes?: string | null;
    durationInMinutes?: number;
    eventName?: string;
    platform?: string;
  }) {
    const oAuthClient = await this.getOAuthClient(userId);
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    const calendarEvent = await google.calendar('v3').events.insert({
      calendarId: 'primary',
      auth: oAuthClient,
      sendUpdates: 'all',
      requestBody: {
        attendees: [
          { email: guestEmail, displayName: guestName },
          {
            email: user.email,
            displayName: user.name,
            responseStatus: 'accepted',
          },
        ],
        description: guestNotes
          ? `Additional Details: ${guestNotes}`
          : undefined,
        start: {
          dateTime: startTime.toISOString(),
        },
        end: {
          dateTime: addMinutes(startTime, durationInMinutes).toISOString(),
        },
        summary: `${guestName} + ${user.name}: ${eventName}`,
        conferenceData: {
          createRequest: {
            requestId: 'meet-' + Math.random().toString(36).substring(7),
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      },
      conferenceDataVersion: 1,
    });
    return calendarEvent.data;
  }
}

export const googleCalenderManager = GoogleCalenderManager.getInstance();
