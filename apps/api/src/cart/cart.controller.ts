import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, UseGuards } from '@nestjs/common'
import { CartService } from './cart.service'
import { AddCartItemDto } from './dto/add-cart-item.dto'
import { UpdateCartItemDto } from './dto/update-cart-item.dto'
import { MergeCartDto } from './dto/merge-cart.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

interface JwtPayload {
  sub: string
  email: string
  role: string
}

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getCart(
    @CurrentUser() user: JwtPayload | null,
    @Headers('x-cart-session') sessionId?: string,
  ) {
    return this.cartService.getCart(user?.sub, sessionId)
  }

  @Post('items')
  @UseGuards(OptionalJwtAuthGuard)
  addItem(
    @CurrentUser() user: JwtPayload | null,
    @Headers('x-cart-session') sessionId: string | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user?.sub, sessionId, dto.variantId, dto.quantity)
  }

  @Patch('items/:itemId')
  @UseGuards(OptionalJwtAuthGuard)
  updateItem(
    @CurrentUser() user: JwtPayload | null,
    @Headers('x-cart-session') sessionId: string | undefined,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(itemId, dto.quantity, user?.sub, sessionId)
  }

  @Delete('items/:itemId')
  @UseGuards(OptionalJwtAuthGuard)
  removeItem(
    @CurrentUser() user: JwtPayload | null,
    @Headers('x-cart-session') sessionId: string | undefined,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(itemId, user?.sub, sessionId)
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  mergeCarts(
    @CurrentUser() user: JwtPayload,
    @Body() dto: MergeCartDto,
  ) {
    return this.cartService.mergeCarts(user.sub, dto.sessionId)
  }
}
