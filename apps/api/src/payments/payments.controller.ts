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
import { ApiTags, ApiOperation, ApiParam, ApiHeader, ApiResponse } from '@nestjs/swagger'
import { PaymentsService } from './payments.service'
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

interface JwtPayload {
  id: string
  email: string
  role: string
}

@ApiTags('Payments')
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:id/pay')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Initiate Stripe payment session for an order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 201, description: 'Returns Stripe checkout URL' })
  initiatePayment(@Param('id') id: string, @CurrentUser() user: JwtPayload | null) {
    return this.paymentsService.initiatePayment(id, user?.id)
  }

  @Post('webhooks/stripe')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook receiver — updates order status on payment events' })
  @ApiHeader({ name: 'stripe-signature', description: 'Stripe webhook signature for verification' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    await this.paymentsService.handleStripeWebhook(req.rawBody!, sig)
    return { received: true }
  }
}
