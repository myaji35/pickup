/**
 * Address Value Object
 * 주소 (픽업/드랍오프)
 */
export class Address {
  private readonly _value: string;

  constructor(value: string) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Address cannot be empty');
    }

    if (trimmed.length > 200) {
      throw new Error('Address must be 200 characters or less');
    }

    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  equals(other: Address): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
