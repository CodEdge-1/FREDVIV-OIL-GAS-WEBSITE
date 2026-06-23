import { Module } from '@nestjs/common';
import { CustomProductsService } from './custom-products.service';
import { CustomProductsController } from './custom-products.controller';

@Module({
  controllers: [CustomProductsController],
  providers: [CustomProductsService],
  exports: [CustomProductsService],
})
export class CustomProductsModule {}
