import { Module } from '@nestjs/common';
import { BankAccessRequestsService } from './bank-access-requests.service';
import { BankAccessRequestsController } from './bank-access-requests.controller';

@Module({
  providers: [BankAccessRequestsService],
  controllers: [BankAccessRequestsController],
  exports: [BankAccessRequestsService],
})
export class BankAccessRequestsModule {}
