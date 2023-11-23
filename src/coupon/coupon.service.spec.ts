import { Test, TestingModule } from '@nestjs/testing';
import { CouponService } from './coupon.service';
import { Repository, UpdateResult } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Coupon } from './coupon.entity';
import { CouponUsage } from './coupon-usage.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CouponService', () => {
  let couponService: CouponService;
  let couponRepository: Repository<Coupon>;
  let couponUsageRepository: Repository<CouponUsage>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        {
          provide: getRepositoryToken(Coupon),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(CouponUsage),
          useClass: Repository,
        },
      ],
    }).compile();

    couponService = module.get<CouponService>(CouponService);
    couponRepository = module.get<Repository<Coupon>>(
      getRepositoryToken(Coupon),
    );
    couponUsageRepository = module.get<Repository<CouponUsage>>(
      getRepositoryToken(CouponUsage),
    );
  });
  describe('addCoupon', () => {
    it('should create a new coupon if it does not exist', async () => {
      const code = 'NEWCOUPON';
      const globalRepeatCount = 10;
      const userTotalRepeatCount = 5;
      const userDailyRepeatCount = 2;
      const userWeeklyRepeatCount = 3;

      jest
        .spyOn(couponRepository, 'findOne')
        .mockReturnValueOnce(Promise.resolve(null));
      jest.spyOn(couponRepository, 'create').mockReturnValueOnce({} as Coupon);
      jest
        .spyOn(couponRepository, 'save')
        .mockReturnValueOnce(Promise.resolve({} as Coupon));

      const result = await couponService.addCoupon(
        code,
        globalRepeatCount,
        userTotalRepeatCount,
        userDailyRepeatCount,
        userWeeklyRepeatCount,
      );

      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { code },
      });
      expect(couponRepository.create).toHaveBeenCalledWith({
        code,
        globalRepeatCount,
        userTotalRepeatCount,
        userDailyRepeatCount,
        userWeeklyRepeatCount,
      });
      expect(couponRepository.save).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual(expect.any(Object));
    });

    it('should update an existing coupon if it already exists', async () => {
      const code = 'EXISTINGCOUPON';
      const globalRepeatCount = 8;
      const userTotalRepeatCount = 4;
      const userDailyRepeatCount = 2;
      const userWeeklyRepeatCount = 3;

      const existingCoupon: Coupon = {
        id: 1,
        code,
        globalRepeatCount: 5,
        userTotalRepeatCount: 2,
        userDailyRepeatCount: 1,
        userWeeklyRepeatCount: 2,
      } as Coupon;

      jest
        .spyOn(couponRepository, 'findOne')
        .mockReturnValueOnce(Promise.resolve(existingCoupon));
      jest
        .spyOn(couponRepository, 'save')
        .mockReturnValueOnce(Promise.resolve(existingCoupon));

      const result = await couponService.addCoupon(
        code,
        globalRepeatCount,
        userTotalRepeatCount,
        userDailyRepeatCount,
        userWeeklyRepeatCount,
      );

      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { code },
      });
      expect(couponRepository.save).toHaveBeenCalledWith(existingCoupon);
      expect(result).toEqual(existingCoupon);
    });
  });

  describe('verifyCoupon', () => {
    it('should return true if the coupon is valid', async () => {
      const code = 'VALIDCOUPON';
      const userId = 1;

      const coupon: Coupon = {
        id: 1,
        code,
        globalRepeatCount: 5,
        userTotalRepeatCount: 2,
        userDailyRepeatCount: 1,
        userWeeklyRepeatCount: 2,
      } as Coupon;

      jest
        .spyOn(couponService, 'validateCode')
        .mockReturnValueOnce(Promise.resolve(coupon));
      jest
        .spyOn(couponService, 'validateCoupon')
        .mockReturnValueOnce(Promise.resolve(true));

      const result = await couponService.verifyCoupon(code, userId);

      expect(couponService.validateCode).toHaveBeenCalledWith(code);
      expect(couponService.validateCoupon).toHaveBeenCalledWith(coupon, userId);
      expect(result).toBe(true);
    });

    it('should return false if the coupon is not valid', async () => {
      const code = 'INVALIDCOUPON';
      const userId = 1;

      const coupon: Coupon = {
        id: 1,
        code,
        globalRepeatCount: 0,
        userTotalRepeatCount: 2,
        userDailyRepeatCount: 1,
        userWeeklyRepeatCount: 2,
      } as Coupon;

      jest
        .spyOn(couponService, 'validateCode')
        .mockReturnValueOnce(Promise.resolve(coupon));
      jest
        .spyOn(couponService, 'validateCoupon')
        .mockReturnValueOnce(Promise.resolve(false));

      const result = await couponService.verifyCoupon(code, userId);

      expect(couponService.validateCode).toHaveBeenCalledWith(code);
      expect(couponService.validateCoupon).toHaveBeenCalledWith(coupon, userId);
      expect(result).toBe(false);
    });
  });

  describe('applyCoupon', () => {
    it('should apply the coupon if it is valid', async () => {
      const code = 'VALIDCOUPON';
      const userId = 1;

      const coupon: Coupon = {
        id: 1,
        code,
        globalRepeatCount: 5,
        userTotalRepeatCount: 2,
        userDailyRepeatCount: 1,
        userWeeklyRepeatCount: 2,
      } as Coupon;

      jest
        .spyOn(couponService, 'validateCode')
        .mockReturnValueOnce(Promise.resolve(coupon));
      jest
        .spyOn(couponService, 'validateCoupon')
        .mockReturnValueOnce(Promise.resolve(true));
      jest
        .spyOn(couponRepository, 'decrement')
        .mockReturnValueOnce(Promise.resolve({} as UpdateResult));
      jest
        .spyOn(couponUsageRepository, 'save')
        .mockReturnValueOnce(Promise.resolve({} as CouponUsage));

      await expect(
        couponService.applyCoupon(code, userId),
      ).resolves.not.toThrow();

      expect(couponService.validateCoupon).toHaveBeenCalled();
      expect(couponService.validateCoupon).toHaveBeenCalled();
      expect(couponRepository.decrement).toHaveBeenCalled();
      expect(couponUsageRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if the coupon is not valid', async () => {
      const code = 'INVALIDCOUPON';
      const userId = 1;

      const coupon: Coupon = {
        id: 1,
        code,
        globalRepeatCount: 0,
        userTotalRepeatCount: 2,
        userDailyRepeatCount: 1,
        userWeeklyRepeatCount: 2,
      } as Coupon;

      jest
        .spyOn(couponService, 'validateCode')
        .mockReturnValueOnce(Promise.resolve(coupon));
      jest
        .spyOn(couponService, 'validateCoupon')
        .mockReturnValueOnce(Promise.resolve(false));

      await expect(couponService.applyCoupon(code, userId)).rejects.toThrow(
        BadRequestException,
      );

      expect(couponService.validateCode).toHaveBeenCalled();
      expect(couponService.validateCoupon).toHaveBeenCalled();
    });
  });

  describe('validateCode', () => {
    it('should throw NotFoundException if the coupon does not exist', async () => {
      const code = 'NONEXISTENTCOUPON';

      jest
        .spyOn(couponRepository, 'findOne')
        .mockReturnValueOnce(Promise.resolve(null));

      await expect(couponService.validateCode(code)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the coupon if it exists', async () => {
      const code = 'EXISTENTCOUPON';
      const coupon: Coupon = {
        id: 1,
        code,
        globalRepeatCount: 5,
        userTotalRepeatCount: 2,
        userDailyRepeatCount: 1,
        userWeeklyRepeatCount: 2,
      } as Coupon;

      jest
        .spyOn(couponRepository, 'findOne')
        .mockReturnValueOnce(Promise.resolve(coupon));

      const result = await couponService.validateCode(code);

      expect(result).toEqual(coupon);
    });
  });

  describe('validateCoupon', () => {
    it('should return true if the coupon is valid for the user', async () => {
      const userId = 1;
      const coupon: Coupon = {
        id: 1,
        code: 'VALIDCOUPON',
        globalRepeatCount: 5,
        userTotalRepeatCount: 2,
        userDailyRepeatCount: 2,
        userWeeklyRepeatCount: 2,
      } as Coupon;

      jest
        .spyOn(couponUsageRepository, 'count')
        .mockReturnValue(Promise.resolve(1))
        .mockReturnValue(Promise.resolve(1))
        .mockReturnValue(Promise.resolve(1));

      const result = await couponService.validateCoupon(coupon, userId);

      expect(result).toBe(true);
      expect(couponUsageRepository.count).toHaveBeenCalledTimes(3);
    });

    it('should return false if the global repeat count is zero', async () => {
      const userId = 1;
      const coupon: Coupon = {
        id: 1,
        code: 'INVALIDCOUPON',
        globalRepeatCount: 0,
        userTotalRepeatCount: 2,
        userDailyRepeatCount: 1,
        userWeeklyRepeatCount: 2,
      } as Coupon;

      const result = await couponService.validateCoupon(coupon, userId);

      expect(result).toBe(false);
    });

    it('should return false if the user has reached the total repeat count', async () => {
      const userId = 1;
      const coupon: Coupon = {
        id: 1,
        code: 'INVALIDCOUPON',
        globalRepeatCount: 5,
        userTotalRepeatCount: 2,
        userDailyRepeatCount: 1,
        userWeeklyRepeatCount: 2,
      } as Coupon;

      jest
        .spyOn(couponUsageRepository, 'count')
        .mockReturnValueOnce(Promise.resolve(2));

      const result = await couponService.validateCoupon(coupon, userId);

      expect(result).toBe(false);
      expect(couponUsageRepository.count).toHaveBeenCalledTimes(1);
    });

    it('should return false if the user has reached the daily repeat count', async () => {
      const userId = 1;
      const coupon: Coupon = {
        id: 1,
        code: 'INVALIDCOUPON',
        globalRepeatCount: 5,
        userTotalRepeatCount: 3,
        userDailyRepeatCount: 1,
        userWeeklyRepeatCount: 2,
      } as Coupon;

      jest
        .spyOn(couponUsageRepository, 'count')
        .mockReturnValueOnce(Promise.resolve(2));
      jest
        .spyOn(couponUsageRepository, 'count')
        .mockReturnValueOnce(Promise.resolve(1));

      const result = await couponService.validateCoupon(coupon, userId);

      expect(result).toBe(false);
      expect(couponUsageRepository.count).toHaveBeenCalledTimes(2);
    });

    it('should return false if the user has reached the weekly repeat count', async () => {
      const userId = 1;
      const coupon: Coupon = {
        id: 1,
        code: 'INVALIDCOUPON',
        globalRepeatCount: 5,
        userTotalRepeatCount: 3,
        userDailyRepeatCount: 2,
        userWeeklyRepeatCount: 2,
      } as Coupon;

      jest
        .spyOn(couponUsageRepository, 'count')
        .mockReturnValueOnce(Promise.resolve(2));
      jest
        .spyOn(couponUsageRepository, 'count')
        .mockReturnValueOnce(Promise.resolve(1));
      jest
        .spyOn(couponUsageRepository, 'count')
        .mockReturnValueOnce(Promise.resolve(2));

      const result = await couponService.validateCoupon(coupon, userId);

      expect(result).toBe(false);
      expect(couponUsageRepository.count).toHaveBeenCalledTimes(3);
    });
  });
});
