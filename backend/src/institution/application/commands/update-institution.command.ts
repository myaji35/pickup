/**
 * T396: UpdateInstitutionCommand
 *
 * 기관 정보 업데이트 Command
 * - 기관 유형 변경
 * - 기관 이름 변경
 */
export class UpdateInstitutionCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly institutionTypeId?: string | null,
  ) {}
}
