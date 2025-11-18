/**
 * Update Passenger Group Command
 */
export class UpdatePassengerGroupCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
  ) {}
}
