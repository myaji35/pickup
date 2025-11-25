import { User, UserRole } from '../entities/user.entity';

/**
 * User Repository Interface
 * DDD Repository Pattern
 */
export interface IUserRepository {
  /**
   * 새로운 사용자 생성
   */
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;

  /**
   * ID로 사용자 조회
   */
  findById(id: string): Promise<User | null>;

  /**
   * 이메일로 사용자 조회 (로그인용)
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * 모든 사용자 조회 (관리자용)
   */
  findAll(): Promise<User[]>;

  /**
   * 기관별 사용자 조회
   */
  findByInstitutionId(institutionId: string): Promise<User[]>;

  /**
   * 역할별 사용자 조회
   */
  findByRole(role: UserRole): Promise<User[]>;

  /**
   * 사용자 정보 업데이트
   */
  update(
    id: string,
    data: Partial<Pick<User, 'name' | 'isActive' | 'lastLoginAt'>>,
  ): Promise<User>;

  /**
   * 비밀번호 변경
   */
  updatePassword(id: string, hashedPassword: string): Promise<User>;

  /**
   * 사용자 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 이메일 중복 확인
   */
  existsByEmail(email: string): Promise<boolean>;
}
