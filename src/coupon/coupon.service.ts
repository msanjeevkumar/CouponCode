// coupon.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Coupon } from './coupon.entity';
import { CouponUsage } from './coupon-usage.entity';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private readonly couponUsageRepository: Repository<CouponUsage>,
  ) {}

  async addCoupon(
    code: string,
    globalRepeatCount: number,
    userTotalRepeatCount: number,
    userDailyRepeatCount: number,
    userWeeklyRepeatCount: number,
  ): Promise<Coupon> {
    // Check if the coupon already exists
    let coupon = await this.couponRepository.findOne({ where: { code } });

    if (!coupon) {
      // Create a new coupon if it doesn't exist
      coupon = this.couponRepository.create({
        code,
        globalRepeatCount,
        userTotalRepeatCount,
        userDailyRepeatCount,
        userWeeklyRepeatCount,
      });

      await this.couponRepository.save(coupon);
    } else {
      // Update the existing coupon if it already exists
      coupon.globalRepeatCount = globalRepeatCount;
      coupon.userTotalRepeatCount = userTotalRepeatCount;
      coupon.userDailyRepeatCount = userDailyRepeatCount;
      coupon.userWeeklyRepeatCount = userWeeklyRepeatCount;

      await this.couponRepository.save(coupon);
    }

    return coupon;
  }

  async verifyCoupon(code: string, userId: number): Promise<boolean> {
    const coupon = await this.validateCode(code);
    return this.validateCoupon(coupon, userId);
  }

  async applyCoupon(code: string, userId: number) {
    const coupon = await this.validateCode(code);
    const isCouponValid = await this.validateCoupon(coupon, userId);
    if (!isCouponValid) {
      throw new BadRequestException('Coupon usage limit exceeded');
    }

    // If all checks passed, decrement global repeat count and create a usage entry
    await this.couponRepository.decrement(
      { id: coupon.id },
      'globalRepeatCount',
      1,
    );

    await this.couponUsageRepository.save({
      userId,
      coupon,
      usageDate: new Date(),
    });
  }

  async validateCode(code: string) {
    const coupon = await this.couponRepository.findOne({ where: { code } });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return coupon;
  }

  async validateCoupon(coupon: Coupon, userId: number) {
    // Check global repeat count
    if (coupon.globalRepeatCount <= 0) {
      return false;
    }

    // Check user total repeat count
    const userTotalUsage = await this.couponUsageRepository.count({
      where: {
        userId,
        coupon,
      },
    });
    if (userTotalUsage >= coupon.userTotalRepeatCount) {
      return false;
    }

    // Check user daily repeat count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userDailyUsage = await this.couponUsageRepository.count({
      where: {
        userId,
        coupon,
        usageDate: MoreThanOrEqual(today),
      },
    });

    if (userDailyUsage >= coupon.userDailyRepeatCount) {
      return false;
    }

    // Check user weekly repeat count
    const startOfWeek = new Date();
    startOfWeek.setDate(today.getDate() - today.getDay());

    const userWeeklyUsage = await this.couponUsageRepository.count({
      where: {
        userId,
        coupon,
        usageDate: MoreThanOrEqual(startOfWeek),
      },
    });

    return userWeeklyUsage < coupon.userWeeklyRepeatCount;
  }
}
