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
      accessType: 'offline',
      prompt: 'consent',
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      console.log('am i getting the refresh token ', refreshToken);

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
      Logger.error(JSON.stringify(error, null, 2));
      const internalError = new InternalServerErrorException();
      done(internalError);
      throw internalError;
    }
  }
}
