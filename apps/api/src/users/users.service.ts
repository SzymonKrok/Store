import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

interface CreateUserData {
  email: string
  passwordHash: string
}

const PROFILE_SELECT = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  phone: true,
  defaultAddress: true,
} as const

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  getProfile(id: string) {
    return this.prisma.user.findUnique({ where: { id }, select: PROFILE_SELECT })
  }

  create(data: CreateUserData) {
    return this.prisma.user.create({ data })
  }

  updateRefreshToken(id: string, refreshToken: string | null) {
    return this.prisma.user.update({ where: { id }, data: { refreshToken } })
  }
}
