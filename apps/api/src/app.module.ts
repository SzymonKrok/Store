import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { PrismaModule } from './prisma/prisma.module'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { CategoriesModule } from './categories/categories.module'
import { ProductsModule } from './products/products.module'
import { UploadModule } from './upload/upload.module'
import { CartModule } from './cart/cart.module'
import { CouponsModule } from './coupons/coupons.module'
import { OrdersModule } from './orders/orders.module'
import { AbandonedCartModule } from './abandoned-cart/abandoned-cart.module'
import { PaymentsModule } from './payments/payments.module'
import { FakturowniaModule } from './fakturownia/fakturownia.module'
import { FulfillmentModule } from './fulfillment/fulfillment.module'
import { OrderTimeoutModule } from './order-timeout/order-timeout.module'
import { InpostModule } from './inpost/inpost.module'
import { AdminModule } from './admin/admin.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    UploadModule,
    CartModule,
    CouponsModule,
    OrdersModule,
    AbandonedCartModule,
    PaymentsModule,
    FakturowniaModule,
    FulfillmentModule,
    OrderTimeoutModule,
    InpostModule,
    AdminModule,
  ],
})
export class AppModule {}
