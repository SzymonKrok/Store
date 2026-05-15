import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import type { RegisterDto, LoginDto } from '@store/validation'

interface JwtPayload {
  sub: string
  email: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email)
    if (existing) throw new ConflictException('Email already in use')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.usersService.create({ email: dto.email, passwordHash })

    const tokens = await this.generateTokens(user.id, user.email)
    await this.storeRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials')

    const tokens = await this.generateTokens(user.id, user.email)
    await this.storeRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId)
    if (!user?.refreshToken) throw new UnauthorizedException()

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken)
    if (!tokenMatch) throw new UnauthorizedException()

    const tokens = await this.generateTokens(user.id, user.email)
    await this.storeRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null)
  }

  private async generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ])

    return { accessToken, refreshToken }
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10)
    await this.usersService.updateRefreshToken(userId, hashed)
  }
}
