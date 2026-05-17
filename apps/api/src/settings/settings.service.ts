import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateSettingsDto } from './dto/update-settings.dto'

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    return this.prisma.storeSettings.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    })
  }

  async updateSettings(dto: UpdateSettingsDto) {
    return this.prisma.storeSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...dto },
      update: dto,
    })
  }
}
