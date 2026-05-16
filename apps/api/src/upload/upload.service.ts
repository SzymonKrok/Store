import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import { Readable } from 'stream'

@Injectable()
export class UploadService {
  private readonly s3: S3Client
  private readonly bucket: string
  private readonly publicUrl: string

  constructor(private readonly config: ConfigService) {
    this.bucket = config.get<string>('R2_BUCKET_NAME') ?? ''
    this.publicUrl = config.get<string>('R2_PUBLIC_URL') ?? ''
    const accountId = config.get<string>('R2_ACCOUNT_ID') ?? ''
    const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID') ?? ''
    const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY') ?? ''
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  }

  async getPresignedUrl(filename: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
    const ext = filename.split('.').pop() ?? 'jpg'
    const key = `products/${randomUUID()}.${ext}`
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType })
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 })
    return { uploadUrl, key }
  }

  async uploadBuffer(buffer: Buffer | Readable, key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
    await this.s3.send(command)
    return this.getPublicUrl(key)
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`
  }
}
