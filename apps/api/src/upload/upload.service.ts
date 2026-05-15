import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

@Injectable()
export class UploadService {
  private readonly s3: S3Client
  private readonly bucket: string
  private readonly publicUrl: string

  constructor(private readonly config: ConfigService) {
    this.bucket = config.getOrThrow<string>('R2_BUCKET_NAME')
    this.publicUrl = config.getOrThrow<string>('R2_PUBLIC_URL')
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${config.getOrThrow<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    })
  }

  async getPresignedUrl(filename: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
    const ext = filename.split('.').pop() ?? 'jpg'
    const key = `products/${randomUUID()}.${ext}`
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType })
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 })
    return { uploadUrl, key }
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`
  }
}
