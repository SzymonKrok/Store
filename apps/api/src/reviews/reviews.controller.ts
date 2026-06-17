import { Controller, Post, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger'
import { ReviewsService } from './reviews.service'
import { CreateReviewDto } from './dto/create-review.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  @ApiOperation({ summary: 'Submit a product review (pending approval)' })
  @ApiResponse({ status: 201, description: 'Review created, awaiting moderation' })
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto)
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List approved reviews for a product' })
  @ApiQuery({ name: 'productId', required: true })
  findApproved(@Query('productId') productId: string) {
    return this.reviewsService.findApproved(productId)
  }

  @Get('admin/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all reviews with optional approval filter (Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'approved', required: false, type: Boolean })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('approved') approved?: string,
  ) {
    const approvedFilter =
      approved === 'true' ? true : approved === 'false' ? false : undefined
    return this.reviewsService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      approvedFilter,
    )
  }

  @Patch('admin/reviews/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a review (Admin)' })
  @ApiParam({ name: 'id' })
  approve(@Param('id') id: string) {
    return this.reviewsService.approve(id)
  }

  @Delete('admin/reviews/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (Admin)' })
  @ApiParam({ name: 'id' })
  reject(@Param('id') id: string) {
    return this.reviewsService.reject(id)
  }
}
