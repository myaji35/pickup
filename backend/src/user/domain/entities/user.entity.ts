/**
 * UserRole
 * SUPER_ADMIN: 시스템 관리자 (모든 회원사 관리)
 * INSTITUTION_ADMIN: 회원사 관리자 (자사 데이터 관리)
 * DRIVER: 운전기사 (운행 정보 조회)
 */
export type UserRole = 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'DRIVER';

/**
 * User Domain Entity
 * 시스템 사용자 (Phase 11)
 *
 * 비즈니스 규칙:
 * - 이메일은 시스템 전체에서 고유해야 함
 * - SUPER_ADMIN은 institutionId가 null
 * - INSTITUTION_ADMIN, DRIVER는 반드시 institutionId가 필요
 * - 비밀번호는 bcrypt로 해싱되어 저장
 */
export class User {
  constructor(
    public readonly id: string,
    private _email: string,
    private _password: string, // bcrypt hashed
    private _role: UserRole,
    private _name: string,
    private _isActive: boolean,
    private _institutionId: string | null,
    private _lastLoginAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validateEmail(_email);
    this.validateName(_name);
    this.validateRole(_role, _institutionId);
  }

  get email(): string {
    return this._email;
  }

  get password(): string {
    return this._password;
  }

  get role(): UserRole {
    return this._role;
  }

  get name(): string {
    return this._name;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get institutionId(): string | null {
    return this._institutionId;
  }

  get lastLoginAt(): Date | null {
    return this._lastLoginAt;
  }

  /**
   * 사용자 이름 변경
   */
  updateName(name: string): void {
    this.validateName(name);
    this._name = name;
  }

  /**
   * 비밀번호 변경 (이미 해싱된 비밀번호)
   */
  updatePassword(hashedPassword: string): void {
    if (!hashedPassword || hashedPassword.trim().length === 0) {
      throw new Error('Password cannot be empty');
    }
    this._password = hashedPassword;
  }

  /**
   * 사용자 활성화
   */
  activate(): void {
    this._isActive = true;
  }

  /**
   * 사용자 비활성화
   */
  deactivate(): void {
    this._isActive = false;
  }

  /**
   * 마지막 로그인 시간 기록
   */
  recordLogin(): void {
    this._lastLoginAt = new Date();
  }

  /**
   * SUPER_ADMIN 여부 확인
   */
  isSuperAdmin(): boolean {
    return this._role === 'SUPER_ADMIN';
  }

  /**
   * INSTITUTION_ADMIN 여부 확인
   */
  isInstitutionAdmin(): boolean {
    return this._role === 'INSTITUTION_ADMIN';
  }

  /**
   * DRIVER 여부 확인
   */
  isDriver(): boolean {
    return this._role === 'DRIVER';
  }

  /**
   * 특정 기관에 속한 사용자인지 확인
   */
  belongsToInstitution(institutionId: string): boolean {
    return this._institutionId === institutionId;
  }

  private validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('User name cannot be empty');
    }
  }

  private validateRole(role: UserRole, institutionId: string | null): void {
    if (role === 'SUPER_ADMIN' && institutionId !== null) {
      throw new Error('SUPER_ADMIN cannot have institutionId');
    }
    if ((role === 'INSTITUTION_ADMIN' || role === 'DRIVER') && institutionId === null) {
      throw new Error(`${role} must have institutionId`);
    }
  }
}
