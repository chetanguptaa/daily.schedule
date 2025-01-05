import { BadRequestException } from '@nestjs/common';
import prisma from '@repo/database';
import { addMinutes, endOfDay, startOfDay } from 'date-fns';
import { google } from 'googleapis';

class GoogleCalenderManager {
  private static instance: GoogleCalenderManager;
  private constructor() {}

  public static getInstance(): GoogleCalenderManager {
    if (!GoogleCalenderManager.instance) {
      GoogleCalenderManager.instance = new GoogleCalenderManager();
    }
    return GoogleCalenderManager.instance;
  }

  async getCalendarEventTimes(
    userId: string,
    { start, end }: { start: Date; end: Date },
  ) {
    const oAuthClient = await this.getOAuthClient(userId);

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
    const GOOGLE_OAUTH_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_OAUTH_CLIENT_SECRET: string = process.env.GOOGLE_CLIENT_SECRET;
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!user || !user.accessToken || !user.refreshToken) {
      throw new BadRequestException('User not found or tokens are missing.');
    }
    const isValidAccessToken = await this.isAccessTokenValid(user.accessToken);
    let accessToken = user.accessToken;
    if (!isValidAccessToken) {
      accessToken = await this.getAccessTokenFromRefreshToken(user);
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          accessToken,
        },
      });
    }
    const client = new google.auth.OAuth2(
      GOOGLE_OAUTH_CLIENT_ID,
      GOOGLE_OAUTH_CLIENT_SECRET,
    );
    client.setCredentials({ access_token: accessToken });
    return client;
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

  private async getAccessTokenFromRefreshToken(user: {
    id: string;
    name: string;
    email: string;
    accessToken: string;
    refreshToken: string;
    picture: string;
    createdAt: Date;
  }): Promise<string> {
    const GOOGLE_OAUTH_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_OAUTH_CLIENT_SECRET: string = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = user.refreshToken;
    const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
    try {
      const payload = new URLSearchParams({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });
      const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
      });
      if (!response.ok) {
        const errorBody = await response.json();
        console.error('Error response from Google:', errorBody);
        throw new Error(
          `Failed to refresh access token: ${errorBody.error_description || 'Unknown error'}`,
        );
      }
      const data = await response.json();
      const accessToken = data.access_token;
      if (!accessToken) {
        throw new Error('Access token not returned by Google');
      }
      return accessToken;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  private async isAccessTokenValid(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`,
      );
      if (!response.ok) {
        const errorBody = await response.json();
        console.error('Error validating access token:', errorBody);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error during access token validation:', error);
      return false;
    }
  }
}

export const googleCalenderManager = GoogleCalenderManager.getInstance();
