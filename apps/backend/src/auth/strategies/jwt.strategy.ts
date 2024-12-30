import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { COOKIE_NAMES } from '../constants/auth.constants';
import { StrategiesEnum } from '../constants/strategies.constants';
import { IGoogleUser } from '../interfaces/auth.interface';
import { Request } from 'express';
import { IUser } from '@repo/db';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export class JwtStrategy extends PassportStrategy(
  Strategy,
  StrategiesEnum.JWT,
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[COOKIE_NAMES.AUTH_TOKEN] || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }
  async validate(payload: IGoogleUser) {
    return payload;
  }
}
