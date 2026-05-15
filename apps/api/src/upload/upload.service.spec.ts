import { Test, TestingModule } from '@nestjs/testing'
import { UploadService } from './upload.service'
import { ConfigService } from '@nestjs/config'

const mockConfig: Record<string, string> = {
  R2_BUCKET_NAME: 'test-bucket',
  R2_PUBLIC_URL: 'https://cdn.example.com',
  R2_ACCOUNT_ID: 'abc123',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
}

describe('UploadService', () => {
  let service: UploadService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn((k: string) => mockConfig[k]) },
        },
      ],
    }).compile()
    service = module.get<UploadService>(UploadService)
  })

  it('getPublicUrl builds correct URL from key', () => {
    expect(service.getPublicUrl('products/abc.jpg')).toBe('https://cdn.example.com/products/abc.jpg')
  })

  it('getPresignedUrl returns key with products/ prefix and correct extension', async () => {
    const { key, uploadUrl } = await service.getPresignedUrl('photo.jpg', 'image/jpeg')
    expect(key).toMatch(/^products\/[0-9a-f-]{36}\.jpg$/)
    expect(uploadUrl).toContain('X-Amz-Signature')
  })
})
