import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy'
import { GoogleStrategy } from './strategies/google.strategy'
import { UsersModule } from '../users/users.module'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [UsersModule, PassportModule, JwtModule.register({}), PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, GoogleStrategy],
})
export class AuthModule {}
