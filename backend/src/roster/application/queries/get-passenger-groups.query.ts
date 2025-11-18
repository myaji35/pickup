/**
 * Get Passenger Groups Query
 * CQRS 패턴 - Query는 시스템의 상태를 변경하지 않고 조회만 수행
 */
export class GetPassengerGroupsQuery {
  constructor(public readonly institutionId: string) {}
}
