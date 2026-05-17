import { Module } from '@nestjs/common';
import { SalesReportsService } from './sales-reports.service';
import { SalesReportsController } from './sales-reports.controller';

@Module({
  providers: [SalesReportsService],
  controllers: [SalesReportsController],
})
export class SalesReportsModule {}
