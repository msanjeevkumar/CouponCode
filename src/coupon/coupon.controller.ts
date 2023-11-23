import {
  Body,
  Controller,
  HttpException,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CouponService } from './coupon.service';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post('add-repeat-counts-code')
  async addRepeatCountsToCoupon(
    @Body('code') code: string,
    @Body('globalRepeatCount') globalRepeatCount: number,
    @Body('userTotalRepeatCount') userTotalRepeatCount: number,
    @Body('userDailyRepeatCount') userDailyRepeatCount: number,
    @Body('userWeeklyRepeatCount') userWeeklyRepeatCount: number,
  ) {
    return await this.handleError(
      () =>
        this.couponService.addCoupon(
          code,
          globalRepeatCount,
          userTotalRepeatCount,
          userDailyRepeatCount,
          userWeeklyRepeatCount,
        ),
      'Error adding repeat counts to code',
    );
  }

  @Post('verify-coupon')
  async verifyCoupon(
    @Body('code') code: string,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return await this.handleError(async () => {
      const isValid = await this.couponService.verifyCoupon(code, userId);

      return {
        isValid,
      };
    }, 'Error in validating coupon');
  }

  @Post('apply-coupon')
  async applyCoupon(
    @Body('code') code: string,
    @Body('userId', ParseIntPipe) userId: number,
  ) {
    return await this.handleError(async () => {
      await this.couponService.applyCoupon(code, userId);
      return {
        message: 'Coupon applied Successfully',
      };
    }, 'Error applying coupon');
  }

  private async handleError<T>(
    operation: () => Promise<T>,
    fallbackError: string,
  ): Promise<{ success: boolean; message?: string; result?: T }> {
    try {
      const result = await operation();
      return {
        success: true,
        result: {
          ...result,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: fallbackError,
      };
    }
  }
}
