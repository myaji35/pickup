/**
 * T438: SuspendInstitutionCommand
 *
 * Phase 11: 회원사 정지 Command
 */
export class SuspendInstitutionCommand {
  constructor(
    public readonly institutionId: string,
    public readonly reason: string, // 정지 사유 (필수)
  ) {}
}
