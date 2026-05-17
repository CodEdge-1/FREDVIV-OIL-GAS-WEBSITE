import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FuelPricesService, SetPriceDto } from './fuel-prices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('fuel-prices')
export class FuelPricesController {
  constructor(private fuelPricesService: FuelPricesService) {}

  @Get('current')
  getCurrent() {
    return this.fuelPricesService.getCurrent();
  }

  @Get('history')
  getHistory() {
    return this.fuelPricesService.getHistory();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  setPrice(@Body() dto: SetPriceDto, @CurrentUser() user: any) {
    return this.fuelPricesService.setPrice(dto, user.id);
  }
}
