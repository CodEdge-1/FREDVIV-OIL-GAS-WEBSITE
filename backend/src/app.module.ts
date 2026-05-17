import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { FuelPricesModule } from './fuel-prices/fuel-prices.module';
import { SalesReportsModule } from './sales-reports/sales-reports.module';
import { ExpensesModule } from './expenses/expenses.module';
import { BalanceRequestsModule } from './balance-requests/balance-requests.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    FuelPricesModule,
    SalesReportsModule,
    ExpensesModule,
    BalanceRequestsModule,
    TransactionsModule,
    ChatModule,
  ],
})
export class AppModule {}
