/**
 * T437: RejectInstitutionCommand
 *
 * Phase 11: 회원사 거부 Command
 */
export class RejectInstitutionCommand {
  constructor(
    public readonly institutionId: string,
    public readonly reason: string, // 거부 사유 (필수)
  ) {}
}
