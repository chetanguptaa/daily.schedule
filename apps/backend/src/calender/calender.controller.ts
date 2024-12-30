import { Controller, Post, Req } from '@nestjs/common';

@Controller('calender')
export class CalenderController {
  constructor() {}

  @Post('user-availability')
  async addUsersAvailability(@Req() req: Request) {}
}
