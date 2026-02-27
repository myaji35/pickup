/**
 * Create Passenger Command
 * CQRS 패턴 - 승객 생성
 */
export class CreatePassengerCommand {
  constructor(
    public readonly institutionId: string,
    public readonly name: string,
    public readonly phoneNumber: string,
    public readonly pickupAddress: string,
    public readonly dropoffAddress: string,
    public readonly shuttleType: 'MORNING' | 'EVENING' | 'TEMPORARY',
    public readonly groupId: string | null,
  ) {}
}
