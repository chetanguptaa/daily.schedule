import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { CalenderService } from './calender.service';
import { createUserScheduleSchema, createUserScheduleSlotSchema } from './dto';

@Controller('calender')
@UseGuards(JwtGuard)
export class CalenderController {
  constructor(private readonly calenderService: CalenderService) {}

  @Get('schedules')
  async getUserSchedules(@Req() req: Request) {
    return await this.calenderService.getUserSchedules(req.user.id);
  }

  @Post('schedules')
  async createUserSchedule(@Req() req: Request) {
    const res = await createUserScheduleSchema.safeParseAsync(req.body);
    if (res.error) {
      throw new BadRequestException();
    }
    return await this.calenderService.createUserSchedule(req.user.id, res.data);
  }

  @Post('schedules/add-slots')
  async addSlots(@Req() req: Request) {
    const res = await createUserScheduleSlotSchema.safeParseAsync(req.body);
    if (res.error) {
      throw new BadRequestException();
    }
    return await this.calenderService.addSlots(req.user.id, req.body);
  }
}
