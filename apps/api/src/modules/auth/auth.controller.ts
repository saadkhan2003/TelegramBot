import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminAuthGuard } from './auth.guard';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      storeName?: string;
      currency?: string;
    },
  ) {
    return this.authService.register(body);
  }

    @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Req() req: any,
  ) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(body.email, body.password, ip, userAgent);
  }

  @UseGuards(AdminAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.admin.sub);
  }

  @UseGuards(AdminAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    return this.authService.logout(req.admin.sub, token);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() body: { email: string },
    @Req() req: any,
  ) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    return this.authService.requestPasswordReset(body.email, ip);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; code: string; newPassword: string },
  ) {
    return this.authService.resetPassword(body.email, body.code, body.newPassword);
  }
}
