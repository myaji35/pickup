/**
 * Create Passenger Group Command
 * CQRS 패턴 - Command는 시스템의 상태를 변경
 */
export class CreatePassengerGroupCommand {
  constructor(
    public readonly institutionId: string,
    public readonly groupCode: string,
    public readonly name: string,
    public readonly passengerIds?: string[],
  ) {}
}
