import {
  BadRequestException,
  Controller,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { SlotsService } from './slots.service';
import { Request } from 'express';
import { getUsersSlotsDetailsSchema } from './dto';

@Controller('slots')
export class SlotsController {
  constructor(private slotsService: SlotsService) {}

  @Post(':userId/:link')
  async getUsersSlotsDetails(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Param('link') link: string,
  ) {
    const res = await getUsersSlotsDetailsSchema.safeParseAsync(req.body);
    if (res.error) {
      throw new BadRequestException();
    }
    return await this.slotsService.getUsersSlotsDetails(userId, link, req.body);
  }
}
