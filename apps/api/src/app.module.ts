import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
  ],
})
export class AppModule {}
