/**
 * T338: UpsertPassengerScheduleCommand
 *
 * 승객 스케줄 생성/수정 Command
 */
export class UpsertPassengerScheduleCommand {
  constructor(
    public readonly passengerId: string,
    public readonly pickupTime: string, // HH:MM
    public readonly dropoffTime: string, // HH:MM
  ) {}
}
