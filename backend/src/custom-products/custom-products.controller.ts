import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CustomProductsService } from './custom-products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsNumber, IsString, Min } from 'class-validator';

class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  price: number;
}

class UpdatePriceDto {
  @IsNumber()
  @Min(0)
  price: number;
}

@UseGuards(JwtAuthGuard)
@Controller('custom-products')
export class CustomProductsController {
  constructor(private customProductsService: CustomProductsService) {}

  @Get()
  getProducts() {
    return this.customProductsService.getProducts();
  }

  @Get('history')
  getHistory() {
    return this.customProductsService.getHistory();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  createProduct(@Req() req: any, @Body() dto: CreateProductDto) {
    const adminId = req.user.userId || req.user.sub || 'admin';
    return this.customProductsService.createProduct(dto.name, dto.code, dto.price, adminId);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  updatePrice(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePriceDto) {
    const adminId = req.user.userId || req.user.sub || 'admin';
    return this.customProductsService.updateProductPrice(id, dto.price, adminId);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  deleteProduct(@Param('id') id: string) {
    return this.customProductsService.deleteProduct(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete('history/:id')
  deleteHistoryRecord(@Param('id') id: string) {
    return this.customProductsService.deleteHistoryRecord(id);
  }
}
