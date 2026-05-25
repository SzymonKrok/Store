import {
  Controller, Get, Post, Body, UseGuards,
  Res, HttpCode, HttpStatus, Redirect,
} from '@nestjs/common'
import { Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { JwtRefreshGuard } from './guards/jwt-refresh.guard'
import { GoogleAuthGuard } from './guards/google-auth.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { ConvertGuestDto } from './dto/convert-guest.dto'

interface AuthUser {
  id: string
  email: string
  refreshToken?: string
}

interface GoogleUser {
  id: string
  email: string
  role: string
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.id)
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(dto)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshTokens(user.id, user.refreshToken!)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.id)
    res.clearCookie('refresh_token')
    return { message: 'Logged out' }
  }

  @Post('convert-guest')
  @HttpCode(HttpStatus.OK)
  async convertGuest(
    @Body() dto: ConvertGuestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.convertGuest(dto.orderId, dto.password)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport redirects to Google; this handler body never runs
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @CurrentUser() user: GoogleUser,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.issueTokensForUser(user.id, user.email, user.role)
    this.setRefreshCookie(res, tokens.refreshToken)
    const storefrontUrl = this.configService.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000'
    res.redirect(`${storefrontUrl}/auth/callback?token=${tokens.accessToken}`)
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    })
  }
}
