import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader, ApiParam, ApiResponse } from '@nestjs/swagger'
import { CartService } from './cart.service'
import { AddCartItemDto } from './dto/add-cart-item.dto'
import { UpdateCartItemDto } from './dto/update-cart-item.dto'
import { MergeCartDto } from './dto/merge-cart.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

interface JwtPayload {
  id: string
  email: string
  role: string
}

@ApiTags('Cart')
@ApiHeader({ name: 'x-cart-session', description: 'Guest cart session ID', required: false })
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get current cart (user or guest)' })
  getCart(
    @CurrentUser() user: JwtPayload | null,
    @Headers('x-cart-session') sessionId?: string,
  ) {
    return this.cartService.getCart(user?.id, sessionId)
  }

  @Post('items')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added, returns updated cart' })
  addItem(
    @CurrentUser() user: JwtPayload | null,
    @Headers('x-cart-session') sessionId: string | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user?.id, sessionId, dto.variantId, dto.quantity)
  }

  @Patch('items/:itemId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Update item quantity in cart' })
  @ApiParam({ name: 'itemId' })
  updateItem(
    @CurrentUser() user: JwtPayload | null,
    @Headers('x-cart-session') sessionId: string | undefined,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(itemId, dto.quantity, user?.id, sessionId)
  }

  @Delete('items/:itemId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'itemId' })
  removeItem(
    @CurrentUser() user: JwtPayload | null,
    @Headers('x-cart-session') sessionId: string | undefined,
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(itemId, user?.id, sessionId)
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart into authenticated user cart after login' })
  mergeCarts(
    @CurrentUser() user: JwtPayload,
    @Body() dto: MergeCartDto,
  ) {
    return this.cartService.mergeCarts(user.id, dto.sessionId)
  }
}
