import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { Request } from 'express';
import { createEventSchema } from './dto';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('events')
@UseGuards(JwtGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('')
  async createEvent(@Req() req: Request) {
    const data = await createEventSchema.safeParseAsync(req.body);
    if (data.error) {
      throw new BadRequestException();
    }
    return await this.eventsService.createEvent(req.user.id, req.body);
  }

  @Get('')
  async getUsersEvents(@Req() req: Request) {
    return await this.eventsService.getUsersEvents(req.user.id);
  }
}
