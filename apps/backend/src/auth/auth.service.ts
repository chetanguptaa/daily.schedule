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
      const { accessToken, ...existingUser2 } = existingUser;
      const encryptedAccessToken = user.accessToken;
      console.log('what is the accessToken ', accessToken);

      await prisma.user.update({
        where: {
          email: user.email,
        },
        data: {
          accessToken: encryptedAccessToken,
        },
      });
      const encodedUser = this.encodeUserDataAsJwt({
        ...existingUser2,
      });
      this.setJwtTokenToCookies(res, existingUser2);
      return {
        encodedUser,
      };
    } catch (error) {
      console.log('what is this error exactly ', error);
      return {
        error: 'some error occured, please try again later',
      };
    }
  }

  private async registerGoogleUser(res: Response, user: IGoogleUser) {
    const encryptedAccessToken = user.accessToken;
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        picture: user.picture,
        accessToken: encryptedAccessToken,
      },
      select: {
        email: true,
        name: true,
        id: true,
        picture: true,
      },
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
    res.cookie(
      COOKIE_NAMES.AUTH_TOKEN,
      this.jwtService.sign({
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      }),
      cookieOptions,
    );
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
