import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { PrismaService } from '../prisma/prisma.service'
import type { RegisterDto, LoginDto } from '@store/validation'

interface JwtPayload {
  sub: string
  email: string
  role: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email)
    if (existing) throw new ConflictException('Email already in use')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.usersService.create({ email: dto.email, passwordHash })

    const tokens = await this.generateTokens(user.id, user.email, user.role)
    await this.storeRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user) throw new UnauthorizedException('Invalid credentials')

    if (!user.passwordHash) throw new UnauthorizedException('Please sign in with Google')

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials')

    const tokens = await this.generateTokens(user.id, user.email, user.role)
    await this.storeRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId)
    if (!user?.refreshToken) throw new UnauthorizedException()

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken)
    if (!tokenMatch) throw new UnauthorizedException()

    const tokens = await this.generateTokens(user.id, user.email, user.role)
    await this.storeRefreshToken(user.id, tokens.refreshToken)
    return tokens
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null)
  }

  async convertGuest(orderId: string, password: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new NotFoundException('Order not found')
    if (order.userId) throw new ConflictException('Order already linked to an account')
    if (!order.guestEmail) throw new BadRequestException('No guest email on this order')

    const existing = await this.usersService.findByEmail(order.guestEmail)
    if (existing) throw new ConflictException('Email already registered — please log in instead')

    const passwordHash = await bcrypt.hash(password, 10)
    const addr = order.shippingAddress as Record<string, string>

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: order.guestEmail!,
          passwordHash,
          firstName: addr.firstName ?? null,
          lastName: addr.lastName ?? null,
          phone: addr.phone ?? null,
          ...(addr.street
            ? { defaultAddress: { street: addr.street, city: addr.city, postalCode: addr.postalCode } }
            : {}),
        },
      })
      await tx.order.update({ where: { id: orderId }, data: { userId: newUser.id } })
      return newUser
    })

    return this.issueTokensForUser(user.id, user.email, user.role)
  }

  async issueTokensForUser(userId: string, email: string, role: string) {
    const tokens = await this.generateTokens(userId, email, role)
    await this.storeRefreshToken(userId, tokens.refreshToken)
    return tokens
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role }

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
