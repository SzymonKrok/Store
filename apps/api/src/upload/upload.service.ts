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
  private readonly publicUrlBase: string

  constructor(private readonly config: ConfigService) {
    const projectRef = config.get<string>('SUPABASE_PROJECT_REF') ?? ''
    this.bucket = config.get<string>('STORAGE_BUCKET') ?? ''
    this.publicUrlBase = `https://${projectRef}.supabase.co/storage/v1/object/public/${this.bucket}`

    const accessKeyId = config.get<string>('STORAGE_ACCESS_KEY_ID') ?? ''
    const secretAccessKey = config.get<string>('STORAGE_SECRET_ACCESS_KEY') ?? ''

    this.s3 = new S3Client({
      region: config.get<string>('STORAGE_REGION') ?? 'eu-central-1',
      endpoint: `https://${projectRef}.supabase.co/storage/v1/s3`,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    })
  }

  async getPresignedUrl(filename: string, contentType: string): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const ext = filename.split('.').pop() ?? 'jpg'
    const key = `uploads/${randomUUID()}.${ext}`
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType })
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 })
    return { uploadUrl, key, publicUrl: this.getPublicUrl(key) }
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
    return `${this.publicUrlBase}/${key}`
  }
}
