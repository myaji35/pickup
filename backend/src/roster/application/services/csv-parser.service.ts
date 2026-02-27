import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

/**
 * T272-T277: CsvParserService
 * CSV 파일 파싱 및 검증 서비스
 *
 * 기능:
 * - CSV 파일 파싱 (streaming)
 * - 행별 검증 (필수 필드, 포맷 체크)
 * - 중복 전화번호 감지
 * - CSV 템플릿 생성
 */

export interface ParsedPassengerRow {
  name: string;
  phoneNumber: string;
  pickupAddress: string;
  dropoffAddress: string;
  shuttleType: 'MORNING' | 'EVENING' | 'TEMPORARY';
  groupId: string | null;
  institutionId: string;
}

export interface RowError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ParseResult {
  validRows: ParsedPassengerRow[];
  errors: RowError[];
}

@Injectable()
export class CsvParserService {
  private readonly KOREAN_PHONE_REGEX = /^01[016789]-?\d{3,4}-?\d{4}$/;
  private readonly VALID_SHUTTLE_TYPES = ['MORNING', 'EVENING', 'TEMPORARY'];

  /**
   * T274: CSV 파일 파싱 (streaming 방식)
   */
  async parsePassengerFile(fileStream: Readable, institutionId: string): Promise<ParseResult> {
    const validRows: ParsedPassengerRow[] = [];
    const errors: RowError[] = [];
    const phoneNumbersSeen = new Set<string>();

    return new Promise((resolve, reject) => {
      let rowNumber = 1; // Header is row 1

      const parser = parse({
        columns: true, // Use first row as column headers
        skip_empty_lines: true,
        trim: true, // T275: Auto-trim whitespace
        relax_column_count: true,
      });

      fileStream.pipe(parser);

      parser.on('readable', () => {
        let record;
        while ((record = parser.read()) !== null) {
          rowNumber++;

          // T275: Row validation
          const rowErrors = this.validateRow(record, rowNumber, phoneNumbersSeen);

          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
          } else {
            // T276: Add to phone numbers set for duplicate detection
            phoneNumbersSeen.add(this.normalizePhoneNumber(record.phoneNumber));

            validRows.push({
              name: record.name.trim(),
              phoneNumber: this.normalizePhoneNumber(record.phoneNumber),
              pickupAddress: record.pickupAddress.trim(),
              dropoffAddress: record.dropoffAddress.trim(),
              shuttleType: record.shuttleType.trim() as 'MORNING' | 'EVENING' | 'TEMPORARY',
              groupId: record.groupId?.trim() || null,
              institutionId,
            });
          }
        }
      });

      parser.on('error', (err) => {
        reject(new Error(`CSV parsing failed: ${err.message}`));
      });

      parser.on('end', () => {
        resolve({ validRows, errors });
      });
    });
  }

  /**
   * T275: 행별 검증 로직
   */
  private validateRow(
    record: Record<string, string>,
    rowNumber: number,
    phoneNumbersSeen: Set<string>,
  ): RowError[] {
    const errors: RowError[] = [];

    // Required fields validation
    if (!record.name || record.name.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Name is required',
        value: record.name,
      });
    }

    if (!record.phoneNumber || record.phoneNumber.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'phoneNumber',
        message: 'Phone number is required',
        value: record.phoneNumber,
      });
    } else {
      // Phone number format validation
      const normalized = this.normalizePhoneNumber(record.phoneNumber);
      if (!this.KOREAN_PHONE_REGEX.test(normalized)) {
        errors.push({
          row: rowNumber,
          field: 'phoneNumber',
          message: 'Invalid Korean phone number format',
          value: record.phoneNumber,
        });
      } else {
        // T276: Duplicate phone number detection
        if (phoneNumbersSeen.has(normalized)) {
          errors.push({
            row: rowNumber,
            field: 'phoneNumber',
            message: `Phone number ${normalized} is a duplicate within this file`,
            value: normalized,
          });
        }
      }
    }

    if (!record.pickupAddress || record.pickupAddress.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'pickupAddress',
        message: 'Pickup address is required',
        value: record.pickupAddress,
      });
    }

    if (!record.dropoffAddress || record.dropoffAddress.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'dropoffAddress',
        message: 'Dropoff address is required',
        value: record.dropoffAddress,
      });
    }

    // Validate pickup and dropoff are different
    if (
      record.pickupAddress &&
      record.dropoffAddress &&
      record.pickupAddress.trim() === record.dropoffAddress.trim()
    ) {
      errors.push({
        row: rowNumber,
        field: 'pickupAddress',
        message: 'Pickup and dropoff addresses must be different',
        value: record.pickupAddress,
      });
    }

    if (!record.shuttleType || record.shuttleType.trim().length === 0) {
      errors.push({
        row: rowNumber,
        field: 'shuttleType',
        message: 'Shuttle type is required',
        value: record.shuttleType,
      });
    } else {
      // Shuttle type validation
      const shuttleType = record.shuttleType.trim().toUpperCase();
      if (!this.VALID_SHUTTLE_TYPES.includes(shuttleType)) {
        errors.push({
          row: rowNumber,
          field: 'shuttleType',
          message: `Shuttle type must be one of: ${this.VALID_SHUTTLE_TYPES.join(', ')}`,
          value: record.shuttleType,
        });
      }
    }

    return errors;
  }

  /**
   * Normalize phone number (remove hyphens for comparison)
   */
  private normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.trim().replace(/-/g, '');
    // Add hyphens back in standard format
    const match = cleaned.match(/^(01[016789])(\d{3,4})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone.trim();
  }

  /**
   * T277: CSV 템플릿 생성
   */
  generateTemplate(): string {
    const headers = ['name', 'phoneNumber', 'pickupAddress', 'dropoffAddress', 'shuttleType', 'groupId'];
    const sampleRow = [
      '홍길동',
      '010-1234-5678',
      '서울시 강남구 테헤란로 123',
      '서울시 서초구 서초대로 456',
      'MORNING',
      '', // groupId is optional
    ];

    return [headers.join(','), sampleRow.join(',')].join('\n');
  }
}
