import { BadRequestException } from '@nestjs/common';
import prisma from '@repo/database';
import { endOfDay, startOfDay } from 'date-fns';
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

  private async getOAuthClient(userId: string) {
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
    console.log('acces token is this ', user.accessToken);

    client.setCredentials({ access_token: user.accessToken });
    return client;
  }
}

export const googleCalenderManager = GoogleCalenderManager.getInstance();
