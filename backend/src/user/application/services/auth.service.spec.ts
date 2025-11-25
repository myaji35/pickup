import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { UserRepository } from '../../infrastructure/persistence/user.repository';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * T498: AuthService Unit Tests
 *
 * 인증 서비스 핵심 비즈니스 로직 검증:
 * - 로그인 성공/실패
 * - JWT 토큰 생성
 * - 비밀번호 검증
 */
describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: UserRepository;
  let jwtService: JwtService;

  beforeEach(() => {
    // Mock dependencies
    userRepository = {
      findByEmail: vi.fn(),
      update: vi.fn(),
    } as any;

    jwtService = {
      signAsync: vi.fn(),
    } as any;

    authService = new AuthService(userRepository, jwtService);
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'INSTITUTION_ADMIN' as any,
        name: 'Test User',
        isActive: true,
        institutionId: 'inst-1',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isSuperAdmin: () => false,
        isInstitutionAdmin: () => true,
        isDriver: () => false,
        belongsToInstitution: () => true,
        updateName: vi.fn(),
        updatePassword: vi.fn(),
        activate: vi.fn(),
        deactivate: vi.fn(),
        recordLogin: vi.fn(),
      };

      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser as any);

      // Act
      const result = await authService.validateUser('test@example.com', 'password123');

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('user-1');
      expect(result?.email).toBe('test@example.com');
      expect((result as any).password).toBeUndefined();
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

      // Act
      const result = await authService.validateUser('nonexistent@example.com', 'password');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 10),
        role: 'INSTITUTION_ADMIN' as any,
      } as any;

      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);

      // Act
      const result = await authService.validateUser('test@example.com', 'wrongpassword');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        isActive: false,
      } as any;

      vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);

      // Act
      const result = await authService.validateUser('test@example.com', 'password123');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token and user info on successful login', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'SUPER_ADMIN',
        name: 'Admin',
        institutionId: null,
        recordLogin: vi.fn(),
      } as any;

      const mockToken = 'mock.jwt.token';
      vi.spyOn(jwtService, 'signAsync').mockResolvedValue(mockToken);
      vi.spyOn(userRepository, 'update').mockResolvedValue(mockUser);

      // Act
      const result = await authService.login(mockUser);

      // Assert
      expect(result.access_token).toBe(mockToken);
      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.role).toBe('SUPER_ADMIN');
      expect(mockUser.recordLogin).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith('user-1', expect.any(Object));
    });

    it('should generate JWT with correct payload', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        role: 'INSTITUTION_ADMIN',
        institutionId: 'inst-1',
        recordLogin: vi.fn(),
      } as any;

      vi.spyOn(jwtService, 'signAsync').mockResolvedValue('token');
      vi.spyOn(userRepository, 'update').mockResolvedValue(mockUser);

      // Act
      await authService.login(mockUser);

      // Assert
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'INSTITUTION_ADMIN',
        institutionId: 'inst-1',
      });
    });
  });
});
