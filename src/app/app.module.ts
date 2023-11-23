import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponModule } from '../coupon/coupon.module';
import { Coupon } from '../coupon/coupon.entity';
import { CouponUsage } from '../coupon/coupon-usage.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      database: ':memory:',
      type: 'sqlite',
      entities: [Coupon, CouponUsage],
      synchronize: true,
      logging: true,
    }),
    CouponModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
