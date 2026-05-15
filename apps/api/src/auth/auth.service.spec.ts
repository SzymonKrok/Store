import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateRefreshToken: jest.fn(),
}

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
}

const mockConfigService = {
  get: jest.fn().mockReturnValue('mock-secret'),
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('register', () => {
    it('throws ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'id-1', email: 'exists@test.com' })

      await expect(service.register({ email: 'exists@test.com', password: 'password123' }))
        .rejects.toThrow(ConflictException)
    })

    it('creates user with hashed password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)
      mockUsersService.create.mockResolvedValue({ id: 'id-1', email: 'new@test.com' })
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined)

      await service.register({ email: 'new@test.com', password: 'password123' })

      const createCall = mockUsersService.create.mock.calls[0][0]
      expect(createCall.email).toBe('new@test.com')
      expect(await bcrypt.compare('password123', createCall.passwordHash)).toBe(true)
    })

    it('returns accessToken and refreshToken', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)
      mockUsersService.create.mockResolvedValue({ id: 'id-1', email: 'new@test.com' })
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined)

      const result = await service.register({ email: 'new@test.com', password: 'password123' })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })
  })

  describe('login', () => {
    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)

      await expect(service.login({ email: 'ghost@test.com', password: 'password' }))
        .rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException for wrong password', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'id-1',
        email: 'user@test.com',
        passwordHash: await bcrypt.hash('correct', 10),
      })

      await expect(service.login({ email: 'user@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException)
    })

    it('returns tokens for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10)
      mockUsersService.findByEmail.mockResolvedValue({ id: 'id-1', email: 'user@test.com', passwordHash })
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined)

      const result = await service.login({ email: 'user@test.com', password: 'password123' })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })
  })

  describe('logout', () => {
    it('clears the refresh token', async () => {
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined)

      await service.logout('id-1')

      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith('id-1', null)
    })
  })
})
