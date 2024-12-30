import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StrategiesEnum } from '../constants/strategies.constants';

@Injectable()
export class UserGuard extends AuthGuard(StrategiesEnum.Google) {}
