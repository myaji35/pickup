/**
 * T331: PassengerSchedule Entity
 *
 * 승객 스케줄 엔티티
 * - 탑승 시간 (pickupTime: HH:MM)
 * - 하차 시간 (dropoffTime: HH:MM)
 * - 계산된 케어 시간 (careTimeHours)
 * - 케어 시간 부족 여부 (isCareTimeInsufficient)
 */
export class PassengerSchedule {
  readonly id: string;
  readonly passengerId: string;
  pickupTime: string; // HH:MM format
  dropoffTime: string; // HH:MM format
  careTimeHours: number;
  isCareTimeInsufficient: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: string;
    passengerId: string;
    pickupTime: string;
    dropoffTime: string;
    careTimeHours: number;
    isCareTimeInsufficient: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    // Validate time formats
    this.validateTimeFormat(props.pickupTime);
    this.validateTimeFormat(props.dropoffTime);

    // Validate pickup < dropoff
    if (props.pickupTime >= props.dropoffTime) {
      throw new Error('Pickup time must be before dropoff time');
    }

    // Validate careTimeHours is non-negative
    if (props.careTimeHours < 0) {
      throw new Error('Care time hours must be non-negative');
    }

    this.id = props.id;
    this.passengerId = props.passengerId;
    this.pickupTime = props.pickupTime;
    this.dropoffTime = props.dropoffTime;
    this.careTimeHours = props.careTimeHours;
    this.isCareTimeInsufficient = props.isCareTimeInsufficient;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * 탑승/하차 시간 및 케어 시간 업데이트
   */
  updateTimes(
    pickupTime: string,
    dropoffTime: string,
    careTimeHours: number,
    isCareTimeInsufficient: boolean,
  ): void {
    // Validate new times
    this.validateTimeFormat(pickupTime);
    this.validateTimeFormat(dropoffTime);

    if (pickupTime >= dropoffTime) {
      throw new Error('Pickup time must be before dropoff time');
    }

    if (careTimeHours < 0) {
      throw new Error('Care time hours must be non-negative');
    }

    this.pickupTime = pickupTime;
    this.dropoffTime = dropoffTime;
    this.careTimeHours = careTimeHours;
    this.isCareTimeInsufficient = isCareTimeInsufficient;
    this.updatedAt = new Date();
  }

  /**
   * HH:MM 포맷 검증
   */
  private validateTimeFormat(timeString: string): void {
    const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(timeString)) {
      throw new Error('Invalid time format. Expected HH:MM format (00:00-23:59)');
    }
  }
}
