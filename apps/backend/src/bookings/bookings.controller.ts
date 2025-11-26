import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { BookingStatus } from './dto';

@Controller('bookings')
@UseGuards(JwtGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('')
  async getBookings(
    @Req() req: Request,
    @Query('status') status: BookingStatus,
  ) {
    if (!status) {
      throw new BadRequestException('Status is required');
    }
    return await this.bookingsService.getBookings(
      req.user.id,
      status as BookingStatus,
    );
  }
}
