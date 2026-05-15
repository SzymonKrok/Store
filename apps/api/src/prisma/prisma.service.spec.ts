import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from './prisma.service'

describe('PrismaService', () => {
  let service: PrismaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile()

    service = module.get<PrismaService>(PrismaService)
  })

  it('is defined', () => {
    expect(service).toBeDefined()
  })

  it('exposes PrismaClient model accessors', () => {
    expect(service.user).toBeDefined()
    expect(service.product).toBeDefined()
    expect(service.cart).toBeDefined()
  })
})
