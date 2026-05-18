import {
  Controller,
  Post,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  Req,
} from '@nestjs/common'
import { RawBodyRequest } from '@nestjs/common'
import { Request } from 'express'
import { PaymentsService } from './payments.service'
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

interface JwtPayload {
  id: string
  email: string
  role: string
}

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:id/pay')
  @UseGuards(OptionalJwtAuthGuard)
  initiatePayment(@Param('id') id: string, @CurrentUser() user: JwtPayload | null) {
    return this.paymentsService.initiatePayment(id, user?.id)
  }

  @Post('webhooks/stripe')
  @HttpCode(200)
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    await this.paymentsService.handleStripeWebhook(req.rawBody!, sig)
    return { received: true }
  }
}
