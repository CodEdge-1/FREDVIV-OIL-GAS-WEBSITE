import { Module } from '@nestjs/common';
import { BalanceRequestsService } from './balance-requests.service';
import { BalanceRequestsController } from './balance-requests.controller';

@Module({
  providers: [BalanceRequestsService],
  controllers: [BalanceRequestsController],
})
export class BalanceRequestsModule {}
