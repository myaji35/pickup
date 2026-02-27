import { Injectable } from '@nestjs/common';
import { CareTimeCalculator } from '../../domain/services/care-time-calculator.domain-service';

/**
 * T340: CareTimeValidatorService
 *
 * Application Service: 케어 시간 검증 및 계산 조율
 * - 도메인 서비스인 CareTimeCalculator를 사용
 * - 검증 결과와 계산된 값을 함께 반환
 */
@Injectable()
export class CareTimeValidatorService {
  private readonly careTimeCalculator: CareTimeCalculator;

  constructor() {
    this.careTimeCalculator = new CareTimeCalculator();
  }

  /**
   * T341: 케어 시간 검증 및 계산
   *
   * @param pickupTime - 탑승 시간 (HH:MM)
   * @param dropoffTime - 하차 시간 (HH:MM)
   * @returns 계산된 케어 시간 및 부족 여부
   */
  validateAndCalculate(
    pickupTime: string,
    dropoffTime: string,
  ): {
    careTimeHours: number;
    isCareTimeInsufficient: boolean;
    warning?: string;
  } {
    // T342: 자동 계산
    const careTimeHours = this.careTimeCalculator.calculateCareTimeHours(pickupTime, dropoffTime);

    // T343: 자동 부족 여부 플래그 설정
    const isCareTimeInsufficient = !this.careTimeCalculator.isCareTimeSufficient(careTimeHours);

    // 경고 메시지 생성
    const warning = isCareTimeInsufficient
      ? `Care time is less than 8 hours (${careTimeHours} hours)`
      : undefined;

    return {
      careTimeHours,
      isCareTimeInsufficient,
      warning,
    };
  }
}
