import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserGuard } from './guards/auth.guard';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt-auth.guard';
import { COOKIE_NAMES } from './constants/auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(UserGuard)
  @Get('google')
  async googleAuth() {}

  @UseGuards(UserGuard)
  @Get('google-auth-redirect')
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const { encodedUser } = await this.authService.signInWithGoogle(
      req.user,
      res,
    );
    return res.redirect(
      `${process.env.GOOGLE_REDIRECT_URL_NEXT}?jwtUser=${encodedUser}`,
    );
  }

  @Get('is-logged-in')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async isLoggedIn(@Req() req: Request) {
    if (req.user) return true;
    return false;
  }

  @Get('logout')
  async logout(@Res() res: Response) {
    res.cookie(COOKIE_NAMES.AUTH_TOKEN, '');
    return res.sendStatus(200);
  }
}
