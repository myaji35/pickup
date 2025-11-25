/**
 * T436: ApproveInstitutionCommand
 *
 * Phase 11: 회원사 승인 Command
 */
export class ApproveInstitutionCommand {
  constructor(
    public readonly institutionId: string,
    public readonly approvedBy: string, // SUPER_ADMIN User ID
  ) {}
}
