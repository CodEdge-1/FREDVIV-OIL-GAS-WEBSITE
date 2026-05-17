import { Module } from '@nestjs/common';
import { FuelPricesService } from './fuel-prices.service';
import { FuelPricesController } from './fuel-prices.controller';

@Module({
  providers: [FuelPricesService],
  controllers: [FuelPricesController],
})
export class FuelPricesModule {}
