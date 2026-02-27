import { describe, it, expect, beforeEach } from 'vitest';
import { CsvParserService } from '../../../../../src/roster/application/services/csv-parser.service';
import { Readable } from 'stream';

/**
 * T269: CsvParserService Unit Tests
 * CSV 파일 파싱 및 검증 로직 테스트
 */
describe('CsvParserService', () => {
  let service: CsvParserService;

  beforeEach(() => {
    service = new CsvParserService();
  });

  describe('parsePassengerFile', () => {
    it('should parse valid CSV file with all required fields', async () => {
      // Arrange
      const csvContent = `name,phoneNumber,pickupAddress,dropoffAddress,shuttleType,groupId
홍길동,010-1234-5678,서울시 강남구 1번지,서울시 서초구 1번지,MORNING,
김철수,010-2345-6789,서울시 강남구 2번지,서울시 서초구 2번지,EVENING,`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const stream = Readable.from(buffer);

      // Act
      const result = await service.parsePassengerFile(stream, 'test-institution-id');

      // Assert
      expect(result.validRows).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.validRows[0]).toMatchObject({
        name: '홍길동',
        phoneNumber: '010-1234-5678',
        pickupAddress: '서울시 강남구 1번지',
        dropoffAddress: '서울시 서초구 1번지',
        shuttleType: 'MORNING',
        institutionId: 'test-institution-id',
      });
    });

    it('should detect missing required fields', async () => {
      // Arrange - Missing name
      const csvContent = `name,phoneNumber,pickupAddress,dropoffAddress,shuttleType,groupId
,010-1234-5678,서울시 강남구 1번지,서울시 서초구 1번지,MORNING,`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const stream = Readable.from(buffer);

      // Act
      const result = await service.parsePassengerFile(stream, 'test-institution-id');

      // Assert
      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(2); // Header is row 1
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].message).toContain('required');
    });

    it('should detect invalid phone number format', async () => {
      // Arrange
      const csvContent = `name,phoneNumber,pickupAddress,dropoffAddress,shuttleType,groupId
홍길동,123-456-7890,서울시 강남구 1번지,서울시 서초구 1번지,MORNING,`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const stream = Readable.from(buffer);

      // Act
      const result = await service.parsePassengerFile(stream, 'test-institution-id');

      // Assert
      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('phoneNumber');
      expect(result.errors[0].message).toContain('Invalid');
    });

    it('should detect duplicate phone numbers within the file', async () => {
      // Arrange
      const csvContent = `name,phoneNumber,pickupAddress,dropoffAddress,shuttleType,groupId
홍길동,010-1234-5678,서울시 강남구 1번지,서울시 서초구 1번지,MORNING,
김철수,010-1234-5678,서울시 강남구 2번지,서울시 서초구 2번지,EVENING,`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const stream = Readable.from(buffer);

      // Act
      const result = await service.parsePassengerFile(stream, 'test-institution-id');

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(3); // Second occurrence
      expect(result.errors[0].field).toBe('phoneNumber');
      expect(result.errors[0].message).toContain('duplicate');
    });

    it('should detect invalid shuttle type', async () => {
      // Arrange
      const csvContent = `name,phoneNumber,pickupAddress,dropoffAddress,shuttleType,groupId
홍길동,010-1234-5678,서울시 강남구 1번지,서울시 서초구 1번지,INVALID_TYPE,`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const stream = Readable.from(buffer);

      // Act
      const result = await service.parsePassengerFile(stream, 'test-institution-id');

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('shuttleType');
      expect(result.errors[0].message).toContain('must be one of');
    });

    it('should handle empty CSV file', async () => {
      // Arrange
      const csvContent = `name,phoneNumber,pickupAddress,dropoffAddress,shuttleType,groupId`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const stream = Readable.from(buffer);

      // Act
      const result = await service.parsePassengerFile(stream, 'test-institution-id');

      // Assert
      expect(result.validRows).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject same pickup and dropoff addresses', async () => {
      // Arrange
      const csvContent = `name,phoneNumber,pickupAddress,dropoffAddress,shuttleType,groupId
홍길동,010-1234-5678,서울시 강남구 1번지,서울시 강남구 1번지,MORNING,`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const stream = Readable.from(buffer);

      // Act
      const result = await service.parsePassengerFile(stream, 'test-institution-id');

      // Assert
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('must be different');
    });

    it('should handle rows with extra whitespace', async () => {
      // Arrange
      const csvContent = `name,phoneNumber,pickupAddress,dropoffAddress,shuttleType,groupId
  홍길동  ,  010-1234-5678  ,  서울시 강남구 1번지  ,  서울시 서초구 1번지  ,  MORNING  ,`;

      const buffer = Buffer.from(csvContent, 'utf-8');
      const stream = Readable.from(buffer);

      // Act
      const result = await service.parsePassengerFile(stream, 'test-institution-id');

      // Assert
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].name).toBe('홍길동');
      expect(result.validRows[0].phoneNumber).toBe('010-1234-5678');
    });
  });

  describe('generateTemplate', () => {
    it('should generate CSV template with correct headers', () => {
      // Act
      const template = service.generateTemplate();

      // Assert
      expect(template).toContain('name');
      expect(template).toContain('phoneNumber');
      expect(template).toContain('pickupAddress');
      expect(template).toContain('dropoffAddress');
      expect(template).toContain('shuttleType');
      expect(template).toContain('groupId');
    });

    it('should include sample row in template', () => {
      // Act
      const template = service.generateTemplate();

      // Assert
      const lines = template.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2); // Header + sample row
      expect(lines[1]).toContain('010-');
    });
  });
});
