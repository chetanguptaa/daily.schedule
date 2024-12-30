import { Module } from '@nestjs/common';
import { CalenderService } from './calender.service';
import { CalenderController } from './calender.controller';

@Module({
  providers: [CalenderService],
  controllers: [CalenderController],
})
export class CalenderModule {}
