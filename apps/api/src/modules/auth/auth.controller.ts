import { Controller, Post, Delete, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LoginDto, SignupDto, AuthTokens } from '@goals/shared';
import { User } from '@goals/database';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

interface AuthResponse {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
}

interface MagicLinkAuthResponse extends AuthResponse {
  isNewUser: boolean;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponse> {
    return this.authService.signup(signupDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string): Promise<AuthTokens> {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: UserWithoutPassword,
    @Body('refreshToken') refreshToken: string
  ): Promise<{ message: string }> {
    await this.authService.logout(user.id, refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('change-email')
  @UseGuards(JwtAuthGuard)
  async changeEmail(
    @CurrentUser() user: UserWithoutPassword,
    @Body() body: ChangeEmailDto
  ): Promise<{ message: string; email: string }> {
    return this.authService.changeEmail(user.id, body);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: UserWithoutPassword,
    @Body() body: ChangePasswordDto
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.id, body);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  async setPassword(
    @CurrentUser() user: UserWithoutPassword,
    @Body('password') password: string
  ): Promise<{ message: string }> {
    return this.authService.setPassword(user.id, password);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string): Promise<{ message: string }> {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body('token') token: string,
    @Body('password') password: string
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(token, password);
  }

  @Post('magic-link/request')
  @HttpCode(HttpStatus.OK)
  async requestMagicLink(
    @Body('email') email: string,
    @Body('name') name?: string
  ): Promise<{ message: string }> {
    return this.authService.requestMagicLink(email, name);
  }

  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLink(@Body('token') token: string): Promise<MagicLinkAuthResponse> {
    return this.authService.verifyMagicLink(token);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(
    @CurrentUser() user: UserWithoutPassword,
    @Body('password') password: string
  ): Promise<{ message: string }> {
    return this.authService.deleteAccount(user.id, password);
  }
}
