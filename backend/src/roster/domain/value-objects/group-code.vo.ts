/**
 * GroupCode Value Object
 * 승객 그룹 코드 (1-20자, 기관 내 고유)
 */
export class GroupCode {
  private readonly _value: string;

  constructor(value: string) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Group code cannot be empty');
    }

    if (trimmed.length > 20) {
      throw new Error('Group code must be 1-20 characters');
    }

    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  equals(other: GroupCode): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
