import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { ProductQueryDto } from './dto/product-query.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { Role } from '@prisma/client'

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with filtering, sorting and pagination' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['newest', 'price_asc', 'price_desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query)
  }

  @Get('by-id/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product by ID — admin use, no isActive filter' })
  @ApiParam({ name: 'id' })
  findById(@Param('id') id: string) {
    return this.productsService.findById(id)
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product details by slug (includes variants and Omnibus price history)' })
  @ApiParam({ name: 'slug' })
  findOne(@Param('slug') slug: string) {
    return this.productsService.findOne(slug)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product with variants (Admin)' })
  @ApiResponse({ status: 201, description: 'Product created' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (Admin)' })
  @ApiParam({ name: 'id' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (Admin)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id)
  }
}
