/**
 * Phase 11: ReactivateInstitutionCommand
 *
 * 정지된 회원사 재활성화 Command
 */
export class ReactivateInstitutionCommand {
  constructor(
    public readonly institutionId: string,
  ) {}
}
