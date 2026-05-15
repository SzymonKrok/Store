import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { PrismaService } from '../prisma/prisma.service'

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

describe('UsersService', () => {
  let service: UsersService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  describe('findByEmail', () => {
    it('returns null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      const result = await service.findByEmail('nobody@example.com')
      expect(result).toBeNull()
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'nobody@example.com' } })
    })

    it('returns user when found', async () => {
      const user = { id: 'id-1', email: 'found@example.com' }
      mockPrisma.user.findUnique.mockResolvedValue(user)
      expect(await service.findByEmail('found@example.com')).toEqual(user)
    })
  })

  describe('findById', () => {
    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)
      expect(await service.findById('nonexistent')).toBeNull()
    })
  })

  describe('create', () => {
    it('creates and returns user with correct data', async () => {
      const newUser = { id: 'id-2', email: 'new@example.com', passwordHash: 'hashed' }
      mockPrisma.user.create.mockResolvedValue(newUser)

      const result = await service.create({ email: 'new@example.com', passwordHash: 'hashed' })

      expect(result).toEqual(newUser)
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { email: 'new@example.com', passwordHash: 'hashed' },
      })
    })
  })

  describe('updateRefreshToken', () => {
    it('stores provided token', async () => {
      mockPrisma.user.update.mockResolvedValue({})
      await service.updateRefreshToken('id-1', 'hashed-token')
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'id-1' },
        data: { refreshToken: 'hashed-token' },
      })
    })

    it('stores null on logout', async () => {
      mockPrisma.user.update.mockResolvedValue({})
      await service.updateRefreshToken('id-1', null)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'id-1' },
        data: { refreshToken: null },
      })
    })
  })
})
