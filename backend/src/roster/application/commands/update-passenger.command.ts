/**
 * Update Passenger Command
 */
export class UpdatePassengerCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly phoneNumber?: string,
    public readonly groupId?: string | null,
  ) {}
}
