import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash } from 'crypto'
import axios from 'axios'

export interface P24WebhookPayload {
  merchantId: number
  posId: number
  sessionId: string
  amount: number
  originAmount: number
  currency: string
  orderId: number
  methodId: number
  statement: string
  sign: string
}

@Injectable()
export class Przelewy24Strategy {
  private readonly logger = new Logger(Przelewy24Strategy.name)
  private readonly merchantId: number
  private readonly posId: number
  private readonly crc: string
  private readonly reportKey: string
  private readonly apiUrl: string

  constructor(private readonly config: ConfigService) {
    this.merchantId = Number(config.get<string>('P24_MERCHANT_ID'))
    this.posId = Number(config.get<string>('P24_POS_ID'))
    this.crc = config.get<string>('P24_CRC') ?? ''
    this.reportKey = config.get<string>('P24_REPORT_KEY') ?? ''
    this.apiUrl = config.get<string>('P24_API_URL') ?? 'https://sandbox.przelewy24.pl'
  }

  private sha384(data: string): string {
    return createHash('sha384').update(data).digest('hex')
  }

  private registrationSign(sessionId: string, amount: number, currency: string): string {
    return this.sha384(
      JSON.stringify({ sessionId, merchantId: this.merchantId, amount, currency, crc: this.crc }),
    )
  }

  verifyWebhookSignature(payload: P24WebhookPayload): boolean {
    const expected = this.sha384(
      JSON.stringify({
        merchantId: payload.merchantId,
        posId: payload.posId,
        sessionId: payload.sessionId,
        amount: payload.amount,
        originAmount: payload.originAmount,
        currency: payload.currency,
        orderId: payload.orderId,
        methodId: payload.methodId,
        statement: payload.statement,
        crc: this.crc,
      }),
    )
    return expected === payload.sign
  }

  async registerTransaction(
    sessionId: string,
    amount: number,
    currency: string,
    description: string,
    email: string,
    urlReturn: string,
    urlStatus: string,
  ): Promise<string> {
    const amountInGrosze = Math.round(amount * 100)
    const sign = this.registrationSign(sessionId, amountInGrosze, currency)

    const { data } = await axios.post(
      `${this.apiUrl}/api/v1/transaction/register`,
      {
        merchantId: this.merchantId,
        posId: this.posId,
        sessionId,
        amount: amountInGrosze,
        currency,
        description,
        email,
        urlReturn,
        urlStatus,
        sign,
      },
      {
        auth: {
          username: String(this.posId),
          password: this.reportKey,
        },
      },
    )

    return `${this.apiUrl}/trnRequest/${data.data.token}`
  }

  async verifyTransaction(
    sessionId: string,
    orderId: number,
    amount: number,
    currency: string,
  ): Promise<void> {
    const amountInGrosze = Math.round(amount * 100)
    const sign = this.sha384(
      JSON.stringify({
        sessionId,
        orderId,
        amount: amountInGrosze,
        currency,
        crc: this.crc,
      }),
    )

    await axios.put(
      `${this.apiUrl}/api/v1/transaction/verify`,
      { merchantId: this.merchantId, posId: this.posId, sessionId, amount: amountInGrosze, currency, orderId, sign },
      { auth: { username: String(this.posId), password: this.reportKey } },
    )
  }
}
