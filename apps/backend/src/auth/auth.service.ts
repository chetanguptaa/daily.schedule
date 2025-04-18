import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IGoogleUser } from './interfaces/auth.interface';
import {
  COOKIE_NAMES,
  expiresTimeTokenMilliseconds,
} from './constants/auth.constants';
import { CookieOptions, Response } from 'express';
import prisma from '@repo/database';

export interface IUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async signInWithGoogle(
    user: IGoogleUser,
    res: Response,
  ): Promise<{
    encodedUser?: string;
    token?: string;
    error?: string;
  }> {
    try {
      if (!user) throw new BadRequestException('Unauthenticated');
      const existingUser = await prisma.user.findFirst({
        where: {
          email: user.email,
        },
      });
      if (!existingUser) return this.registerGoogleUser(res, user);
      existingUser.accessToken = undefined;
      existingUser.refreshToken = undefined;
      await prisma.user.update({
        where: {
          email: user.email,
        },
        data: {
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
        },
      });
      const encodedUser = this.encodeUserDataAsJwt({
        ...existingUser,
      });
      const token = this.setJwtTokenToCookies(res, existingUser);
      return {
        encodedUser,
        token,
      };
    } catch (error) {
      console.log(
        'what is this error exactly ',
        JSON.stringify(error, null, 2),
      );
      return {
        error: 'some error occured, please try again later',
      };
    }
  }

  private async registerGoogleUser(res: Response, user: IGoogleUser) {
    const newUser = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          picture: user.picture,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
        },
        select: {
          email: true,
          name: true,
          id: true,
          picture: true,
        },
      });
      const schedule = await prisma.schedule.create({
        data: {
          userId: newUser.id,
          title: 'Working Hours 👨‍💼',
          default: true,
        },
      });
      const platform = await prisma.platform.findFirst({
        where: {
          default: true,
        },
      });
      await prisma.event.create({
        data: {
          scheduleId: schedule.id,
          userId: newUser.id,
          platformId: platform.id,
          title: '30 Minutes Meeting',
          description: '',
          duration: 30,
          link: '30-mins-meeting',
        },
      });
      return newUser;
    });
    const encodedUser = this.encodeUserDataAsJwt(newUser);
    this.setJwtTokenToCookies(res, newUser);
    return {
      encodedUser,
    };
  }

  private setJwtTokenToCookies(res: Response, user: IUser) {
    const expirationDateInMilliseconds =
      new Date().getTime() + expiresTimeTokenMilliseconds;
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      expires: new Date(expirationDateInMilliseconds),
      sameSite: 'lax',
    };
    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
    res.cookie(COOKIE_NAMES.AUTH_TOKEN, token, cookieOptions);
    return token;
  }

  private encodeUserDataAsJwt(user: IUser) {
    const { id, email, name } = user;
    return this.jwtService.sign({
      id,
      email,
      name,
    });
  }
}
