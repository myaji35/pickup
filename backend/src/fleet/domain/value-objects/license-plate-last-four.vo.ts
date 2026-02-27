/**
 * LicensePlateLastFour Value Object
 * 차량번호 뒤 4자리를 나타내는 값 객체
 * 불변성과 유효성 보장
 */
export class LicensePlateLastFour {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  private validate(value: string): void {
    if (!value) {
      throw new Error('차량번호 뒤 4자리는 필수입니다');
    }

    // 정확히 4자리 숫자인지 검증
    const pattern = /^\d{4}$/;
    if (!pattern.test(value)) {
      throw new Error('차량번호는 4자리 숫자여야 합니다');
    }
  }

  /**
   * Value Object 동등성 비교
   */
  equals(other: LicensePlateLastFour): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
