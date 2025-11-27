import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import {
  EBookingStatus,
  IUpdateBookingStatus,
  updateBookingStatusSchema,
} from './dto';

@Controller('bookings')
@UseGuards(JwtGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('')
  async getBookings(
    @Req() req: Request,
    @Query('status') status: EBookingStatus,
  ) {
    if (!status) {
      throw new BadRequestException('Status is required');
    }
    return await this.bookingsService.getBookings(
      req.user.id,
      status as EBookingStatus,
    );
  }

  @Post('update-status')
  async updateBookingStatus(
    @Req() req: Request,
    @Body() body: IUpdateBookingStatus,
  ) {
    const res = await updateBookingStatusSchema.safeParseAsync(body);
    if (res.error) {
      throw new BadRequestException();
    }
    return await this.bookingsService.updateBookingStatus(req.user.id, body);
  }
}
