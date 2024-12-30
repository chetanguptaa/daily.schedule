import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('user')
@UseGuards(JwtGuard)
export class UserController {
  constructor() {}

  @Get()
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
