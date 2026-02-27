/**
 * Get Passengers Query
 * CQRS 패턴 - 승객 목록 조회
 */
export class GetPassengersQuery {
  constructor(
    public readonly institutionId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly shuttleType?: string,
    public readonly search?: string,
    public readonly groupId?: string,
  ) {}
}
