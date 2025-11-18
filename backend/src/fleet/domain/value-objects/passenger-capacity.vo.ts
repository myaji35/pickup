/**
 * PassengerCapacity Value Object
 * 승객 정원을 나타내는 값 객체
 * 5-15인승 범위 검증
 */
export class PassengerCapacity {
  private readonly _value: number;

  private static readonly MIN_CAPACITY = 5;
  private static readonly MAX_CAPACITY = 15;

  constructor(value: number) {
    this.validate(value);
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  private validate(value: number): void {
    if (!value && value !== 0) {
      throw new Error('승객 정원은 필수입니다');
    }

    if (!Number.isInteger(value)) {
      throw new Error('승객 정원은 정수여야 합니다');
    }

    if (value < PassengerCapacity.MIN_CAPACITY) {
      throw new Error(`승객 정원은 최소 ${PassengerCapacity.MIN_CAPACITY}명이어야 합니다`);
    }

    if (value > PassengerCapacity.MAX_CAPACITY) {
      throw new Error(`승객 정원은 최대 ${PassengerCapacity.MAX_CAPACITY}명이어야 합니다`);
    }
  }

  /**
   * Value Object 동등성 비교
   */
  equals(other: PassengerCapacity): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return `${this._value}명`;
  }
}
