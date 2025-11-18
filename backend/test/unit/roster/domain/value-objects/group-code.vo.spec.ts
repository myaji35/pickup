import { describe, it, expect } from 'vitest';
import { GroupCode } from '../../../../../src/roster/domain/value-objects/group-code.vo';

describe('GroupCode Value Object', () => {
  describe('creation', () => {
    it('should create valid group code with alphanumeric characters', () => {
      const validCodes = ['GRP001', 'GROUP-A', 'G123', 'MORNING_1'];

      validCodes.forEach((code) => {
        const groupCode = new GroupCode(code);
        expect(groupCode.value).toBe(code);
      });
    });

    it('should reject empty group code', () => {
      expect(() => {
        new GroupCode('');
      }).toThrow('Group code cannot be empty');
    });

    it('should reject group code longer than 20 characters', () => {
      expect(() => {
        new GroupCode('VERYLONGGROUPCODENAME1234567890');
      }).toThrow('Group code must be 1-20 characters');
    });

    it('should trim whitespace', () => {
      const groupCode = new GroupCode('  GRP001  ');
      expect(groupCode.value).toBe('GRP001');
    });

    it('should reject group code with only whitespace', () => {
      expect(() => {
        new GroupCode('   ');
      }).toThrow('Group code cannot be empty');
    });

    it('should accept group codes with hyphens and underscores', () => {
      const codesWithSpecialChars = ['GRP-001', 'GRP_001', 'A-B-C'];

      codesWithSpecialChars.forEach((code) => {
        const groupCode = new GroupCode(code);
        expect(groupCode.value).toBe(code);
      });
    });
  });

  describe('equality', () => {
    it('should consider two group codes with same value as equal', () => {
      const code1 = new GroupCode('GRP001');
      const code2 = new GroupCode('GRP001');

      expect(code1.equals(code2)).toBe(true);
    });

    it('should consider two group codes with different values as not equal', () => {
      const code1 = new GroupCode('GRP001');
      const code2 = new GroupCode('GRP002');

      expect(code1.equals(code2)).toBe(false);
    });

    it('should be case-sensitive', () => {
      const code1 = new GroupCode('GRP001');
      const code2 = new GroupCode('grp001');

      expect(code1.equals(code2)).toBe(false);
    });
  });
});
