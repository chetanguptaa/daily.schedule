import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IGoogleUser } from './interfaces/auth.interface';
import {
  COOKIE_NAMES,
  expiresTimeTokenMilliseconds,
} from './constants/auth.constants';
import { CookieOptions, Response } from 'express';
import { IUser, users, db, eq } from '@repo/db';
import { encrypt } from 'src/utils/encrypt-decrypt';

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
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);
      if (!existingUser) return this.registerGoogleUser(res, user);
      const { accessToken, ...existingUser2 } = existingUser;
      const encryptedAccessToken = encrypt(accessToken);
      await db
        .update(users)
        .set({ accessToken: encryptedAccessToken })
        .where(eq(users.email, user.email));
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
    const encryptedAccessToken = encrypt(user.accessToken);
    const [newUser] = await db
      .insert(users)
      .values({
        email: user.email,
        name: user.name,
        picture: user.picture,
        accessToken: encryptedAccessToken,
      })
      .returning();
    const encodedUser = this.encodeUserDataAsJwt(newUser);
    this.setJwtTokenToCookies(res, newUser);
    return {
      encodedUser,
    };
  }

  private setJwtTokenToCookies(
    res: Response,
    user: Omit<IUser, 'accessToken'>,
  ) {
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

  private encodeUserDataAsJwt(user: Omit<IUser, 'accessToken'>) {
    const { id, email, name } = user;
    return this.jwtService.sign({
      id,
      email,
      name,
    });
  }
}
