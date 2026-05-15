import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'

describe('Auth (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    app.use(cookieParser())
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns accessToken + sets refresh cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: `e2e-${Date.now()}@example.com`, password: 'password123' })
        .expect(201)

      expect(response.body).toHaveProperty('accessToken')
      expect(response.headers['set-cookie']).toBeDefined()
      expect(response.headers['set-cookie'][0]).toContain('refresh_token')
      expect(response.headers['set-cookie'][0]).toContain('HttpOnly')
    })

    it('returns 409 when email already registered', async () => {
      const email = `dup-${Date.now()}@example.com`
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123' })
        .expect(201)

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123' })
        .expect(409)
    })

    it('returns 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password123' })
        .expect(400)
    })

    it('returns 400 for password shorter than 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'valid@example.com', password: 'short' })
        .expect(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('returns accessToken for valid credentials', async () => {
      const email = `login-${Date.now()}@example.com`
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123' })

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'password123' })
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
    })

    it('returns 401 for wrong password', async () => {
      const email = `badpw-${Date.now()}@example.com`
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123' })

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'wrongpassword' })
        .expect(401)
    })

    it('returns 401 for unknown email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'password123' })
        .expect(401)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('returns 200 for authenticated user', async () => {
      const email = `logout-${Date.now()}@example.com`
      const regResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password: 'password123' })

      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${regResponse.body.accessToken}`)
        .expect(200)

      expect(response.body.message).toBe('Logged out')
    })

    it('returns 401 without access token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(401)
    })
  })
})
