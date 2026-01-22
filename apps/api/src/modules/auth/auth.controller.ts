import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LoginDto, SignupDto, AuthTokens } from '@goals/shared';
import { User } from '@goals/database';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

interface AuthResponse {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
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
}
