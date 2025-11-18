import { Module } from '@nestjs/common';

/**
 * Roster Context Module
 * 승객 및 그룹 관리, 8시간 케어 검증
 * - PassengerGroup: 승객 그룹 (차량 교체 시 지속성)
 * - Passenger: 승객 정보 (연락처 기반 식별)
 * - PassengerSchedule: 8시간 케어 시간 검증 (주간보호 시설)
 */
@Module({
  controllers: [],
  providers: [],
  exports: [],
})
export class RosterModule {}
