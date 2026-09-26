import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SupportModule } from './modules/support/support.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    CommonModule,
    AuthModule,
    AdminModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    WalletsModule,
    DepositsModule,
    OrdersModule,
    CustomersModule,
    SupportModule,
    SettingsModule,
  ],
})
export class AppModule {}
