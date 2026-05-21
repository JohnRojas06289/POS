import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PosModule } from './modules/pos/pos.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { CashModule } from './modules/cash/cash.module';
import { SyncModule } from './modules/sync/sync.module';
import { BillingModule } from './modules/billing/billing.module';
import { DianModule } from './modules/dian/dian.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { RedisModule } from './database/redis/redis.module';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { HardeningModule } from './common/security/hardening.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
    }),
    PrismaModule,
    RedisModule,
    HardeningModule,
    HealthModule,
    AuthModule,
    TenantsModule,
    PosModule,
    InventoryModule,
    CustomersModule,
    CashModule,
    SyncModule,
    BillingModule,
    DianModule,
    SuppliersModule,
    AnalyticsModule,
    WhatsappModule,
    OnboardingModule,
    ExpensesModule,
    EmployeesModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
})
export class AppModule {}
