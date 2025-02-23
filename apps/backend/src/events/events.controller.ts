import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { Request } from 'express';
import { addUserToCall, createEventSchema, updateEventSchema } from './dto';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('')
  @UseGuards(JwtGuard)
  async createEvent(@Req() req: Request) {
    const data = await createEventSchema.safeParseAsync(req.body);
    if (data.error) {
      throw new BadRequestException();
    }
    return await this.eventsService.createEvent(req.user.id, req.body);
  }

  @Get('')
  @UseGuards(JwtGuard)
  async getUsersEvents(@Req() req: Request) {
    return await this.eventsService.getUsersEvents(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async getUserSingleEvent(@Req() req: Request, @Param('id') id: string) {
    return await this.eventsService.getUserSingleEvent(req.user.id, id);
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  async updateEvent(@Req() req: Request, @Param('id') id: string) {
    const data = await updateEventSchema.safeParseAsync(req.body);
    if (data.error) {
      throw new BadRequestException();
    }
    return await this.eventsService.updateEvent(req.user.id, id, req.body);
  }

  @Get('bookings/:id')
  async getBookingDetails(@Param('id') id: string) {
    return await this.eventsService.getBookingDetails(id);
  }

  @Post('bookings/:id/add-unauthenticated-user-to-meeting')
  async addUnauthenticatedUserToMeeting(
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const data = await addUserToCall.safeParseAsync(req.body);
    if (data.error) {
      throw new BadRequestException();
    }
    return await this.eventsService.addUnauthenticatedUserToMeeting(
      id,
      req.body,
    );
  }
}
