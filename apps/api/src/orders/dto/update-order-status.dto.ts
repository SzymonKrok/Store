import { IsEnum } from 'class-validator'

export class UpdateOrderStatusDto {
  @IsEnum(['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'], {
    message: 'Invalid order status',
  })
  status!: string
}
