/**
 * PhoneNumber Value Object
 * 한국 전화번호 (010, 011, 016-019)
 */
export class PhoneNumber {
  private readonly _value: string;

  constructor(value: string) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Phone number cannot be empty');
    }

    // Remove existing hyphens for validation
    const cleaned = trimmed.replace(/-/g, '');

    // Validate Korean phone number format
    const koreanPhoneRegex = /^(01[016789])(\d{3,4})(\d{4})$/;
    const match = cleaned.match(koreanPhoneRegex);

    if (!match) {
      throw new Error('Invalid Korean phone number format');
    }

    // Format with hyphens: 010-1234-5678
    this._value = `${match[1]}-${match[2]}-${match[3]}`;
  }

  get value(): string {
    return this._value;
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
