import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor() {}

  @Get()
  @UseGuards(JwtGuard)
  async getUser(@Req() req: Request) {
    if (req.user) {
      return {
        user: req.user,
      };
    }
    return {
      user: null,
    };
  }
}
