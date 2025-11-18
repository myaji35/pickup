import { Passenger } from '../entities/passenger.entity';

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  shuttleType?: string;
  search?: string;
  groupId?: string;
}

/**
 * Passenger Repository Interface
 * DDD Repository Pattern
 */
export interface IPassengerRepository {
  /**
   * 새로운 승객 생성
   */
  create(passenger: Omit<Passenger, 'id' | 'createdAt' | 'updatedAt'>): Promise<Passenger>;

  /**
   * 승객 일괄 생성
   */
  createMany(passengers: Omit<Passenger, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Passenger[]>;

  /**
   * 기관의 승객 목록 조회 (페이지네이션)
   */
  findAll(institutionId: string, options?: PaginationOptions): Promise<Passenger[]>;

  /**
   * ID로 승객 조회
   */
  findById(id: string): Promise<Passenger | null>;

  /**
   * 전화번호로 승객 조회 (중복 검사용)
   */
  findByPhoneNumber(institutionId: string, phoneNumber: string): Promise<Passenger | null>;

  /**
   * 승객 정보 업데이트
   */
  update(id: string, data: Partial<Pick<Passenger, 'name' | 'groupId'>>): Promise<Passenger>;

  /**
   * 승객 삭제
   */
  delete(id: string): Promise<void>;
}
