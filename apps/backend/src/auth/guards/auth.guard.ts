import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StrategiesEnum } from '../constants/strategies.constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserGuard extends AuthGuard(StrategiesEnum.Google) {
  constructor(private configService: ConfigService) {
    super({
      accessType: 'offline',
    });
  }
}
