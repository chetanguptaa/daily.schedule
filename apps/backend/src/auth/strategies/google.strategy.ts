import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { StrategiesEnum } from '../constants/strategies.constants';
import { IGoogleUser } from '../interfaces/auth.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  StrategiesEnum.Google,
) {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URL,
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/calendar'],
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos } = profile;
      const user: IGoogleUser = {
        email: emails[0].value,
        name: name.givenName,
        picture: photos[0].value,
        accessToken,
        refreshToken,
      };
      done(null, user);
    } catch (error) {
      Logger.error(error);
      const internalError = new InternalServerErrorException();
      done(internalError);
      throw internalError;
    }
  }
}
