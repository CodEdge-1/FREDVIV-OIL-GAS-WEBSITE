import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { BankAccessRequestsModule } from './bank-access-requests/bank-access-requests.module';
import { SettingsModule } from './settings/settings.module';
import { CustomProductsModule } from './custom-products/custom-products.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
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
    NotificationsModule,
    ActivityLogsModule,
    BankAccessRequestsModule,
    SettingsModule,
    CustomProductsModule,
  ],
})
export class AppModule {}
