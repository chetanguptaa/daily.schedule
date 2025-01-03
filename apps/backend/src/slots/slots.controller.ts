import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { SlotsService } from './slots.service';
import { Request } from 'express';
import { bookSlotSchema } from './dto';

@Controller('slots')
export class SlotsController {
  constructor(private slotsService: SlotsService) {}

  @Get(':userId/:link')
  async getUsersSlotsDetails(
    @Param('userId') userId: string,
    @Param('link') link: string,
  ) {
    return await this.slotsService.getUsersSlotsDetails(userId, link);
  }

  @Post('book-slot')
  async bookUsersSlot(@Req() req: Request) {
    const res = await bookSlotSchema.safeParseAsync(req.body);
    if (res.error) {
      throw new BadRequestException();
    }
    return await this.slotsService.bookUsersSlot(req.body);
  }

  @Post(':userId/:link/reserveSlot')
  async reserveSlot(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Param('link') link: string,
  ) {}
}
