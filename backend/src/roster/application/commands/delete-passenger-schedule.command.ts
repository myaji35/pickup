/**
 * T339: DeletePassengerScheduleCommand
 *
 * 승객 스케줄 삭제 Command
 */
export class DeletePassengerScheduleCommand {
  constructor(public readonly passengerId: string) {}
}
