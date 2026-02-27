/**
 * Trip Entity (Phase 12)
 *
 * 운행 도메인 엔티티
 * 기사의 일일 운행을 관리하며 운행 시작/종료 및 상태 전환을 담당
 */

export enum TripType {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  TEMPORARY = 'TEMPORARY',
}

export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface GpsLocation {
  lat: number;
  lng: number;
}

export class Trip {
  constructor(
    public readonly id: string,
    public readonly institutionId: string,
    public readonly vehicleId: string,
    public readonly driverId: string,
    public readonly routeId: string | null,
    public readonly type: TripType,
    public status: TripStatus,
    public readonly scheduledStart: Date,
    public actualStart: Date | null,
    public actualEnd: Date | null,
    public startLocation: GpsLocation | null,
    public endLocation: GpsLocation | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  /**
   * 운행 시작
   * @param location 운행 시작 GPS 위치
   */
  start(location: GpsLocation): void {
    if (this.status !== TripStatus.SCHEDULED) {
      throw new Error(
        `Cannot start trip in ${this.status} status. Trip must be SCHEDULED.`,
      );
    }

    this.status = TripStatus.IN_PROGRESS;
    this.actualStart = new Date();
    this.startLocation = location;
    this.updatedAt = new Date();
  }

  /**
   * 운행 종료
   * @param location 운행 종료 GPS 위치
   */
  end(location: GpsLocation): void {
    if (this.status !== TripStatus.IN_PROGRESS) {
      throw new Error(
        `Cannot end trip in ${this.status} status. Trip must be IN_PROGRESS.`,
      );
    }

    this.status = TripStatus.COMPLETED;
    this.actualEnd = new Date();
    this.endLocation = location;
    this.updatedAt = new Date();
  }

  /**
   * 운행 취소
   */
  cancel(): void {
    if (this.status === TripStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed trip.');
    }

    this.status = TripStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  /**
   * 운행이 진행 중인지 확인
   */
  isInProgress(): boolean {
    return this.status === TripStatus.IN_PROGRESS;
  }

  /**
   * 운행이 완료되었는지 확인
   */
  isCompleted(): boolean {
    return this.status === TripStatus.COMPLETED;
  }

  /**
   * 운행이 예정되어 있는지 확인
   */
  isScheduled(): boolean {
    return this.status === TripStatus.SCHEDULED;
  }

  /**
   * 운행 소요 시간 계산 (분)
   */
  getDurationMinutes(): number | null {
    if (!this.actualStart || !this.actualEnd) {
      return null;
    }

    const durationMs = this.actualEnd.getTime() - this.actualStart.getTime();
    return Math.round(durationMs / 1000 / 60);
  }
}
