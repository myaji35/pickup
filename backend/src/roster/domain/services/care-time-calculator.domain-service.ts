import { differenceInMinutes, parse, isValid } from 'date-fns';

/**
 * T332: CareTimeCalculator Domain Service
 *
 * 도메인 서비스: 케어 시간 계산 및 검증
 * - 탑승 시간과 하차 시간으로부터 케어 시간(시간 단위) 계산
 * - 8시간 이상 여부 검증
 */
export class CareTimeCalculator {
  private readonly MINIMUM_CARE_TIME_HOURS = 8;

  /**
   * T334: HH:MM 포맷의 시간 문자열로부터 케어 시간을 계산
   *
   * @param pickupTime - 탑승 시간 (HH:MM)
   * @param dropoffTime - 하차 시간 (HH:MM)
   * @returns 케어 시간 (시간 단위, 소수점 포함)
   * @throws Error if invalid format or pickup >= dropoff
   */
  calculateCareTimeHours(pickupTime: string, dropoffTime: string): number {
    // T337: HH:MM 포맷 검증
    this.validateTimeFormat(pickupTime);
    this.validateTimeFormat(dropoffTime);

    // Parse times
    const pickupDate = this.parseTime(pickupTime);
    const dropoffDate = this.parseTime(dropoffTime);

    // T336: pickup < dropoff 검증 (같은 날 기준)
    if (pickupDate >= dropoffDate) {
      throw new Error('Pickup time must be before dropoff time');
    }

    // 시간 차이를 분 단위로 계산 후 시간으로 변환
    const diffMinutes = differenceInMinutes(dropoffDate, pickupDate);
    const hours = diffMinutes / 60;

    return hours;
  }

  /**
   * T335: 케어 시간이 충분한지 검증 (8시간 이상)
   *
   * @param careTimeHours - 케어 시간 (시간 단위)
   * @returns true if >= 8 hours, false otherwise
   */
  isCareTimeSufficient(careTimeHours: number): boolean {
    return careTimeHours >= this.MINIMUM_CARE_TIME_HOURS;
  }

  /**
   * T337: HH:MM 포맷 검증
   *
   * @param timeString - HH:MM 형식의 시간 문자열
   * @throws Error if invalid format
   */
  private validateTimeFormat(timeString: string): void {
    const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(timeString)) {
      throw new Error('Invalid time format. Expected HH:MM format (00:00-23:59)');
    }
  }

  /**
   * HH:MM 문자열을 Date 객체로 파싱
   *
   * @param timeString - HH:MM 형식의 시간 문자열
   * @returns Date 객체 (기준 날짜: 1970-01-01)
   */
  private parseTime(timeString: string): Date {
    const referenceDate = '1970-01-01';
    const dateTime = `${referenceDate} ${timeString}`;
    const parsed = parse(dateTime, 'yyyy-MM-dd HH:mm', new Date());

    if (!isValid(parsed)) {
      throw new Error('Invalid time format');
    }

    return parsed;
  }
}
