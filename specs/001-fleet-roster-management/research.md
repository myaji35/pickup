# Technical Research: 차량 및 승객명단 관리 + 8시간 케어 검증

**Feature**: 001-fleet-roster-management (통합 구현)
**Created**: 2025-11-18
**Phase**: Phase 0 - Technology Research & Decision Making
**Related Specs**: [001-spec.md](./spec.md), [002-spec.md](../002-daycare-8hour-validation/spec.md)

---

## Table of Contents

1. [Excel 파싱 라이브러리 선택](#1-excel-파싱-라이브러리-선택)
2. [PostgreSQL 스키마 최적화 전략](#2-postgresql-스키마-최적화-전략)
3. [NestJS Bounded Context 모듈 구조](#3-nestjs-bounded-context-모듈-구조)
4. [시간 계산 라이브러리 비교](#4-시간-계산-라이브러리-비교)
5. [프론트엔드 상태 관리 솔루션](#5-프론트엔드-상태-관리-솔루션)
6. [추가 기술 결정 사항](#6-추가-기술-결정-사항)

---

## 1. Excel 파싱 라이브러리 선택

### 요구사항 분석

**FR-015**: 기관관리자는 승객 정보를 엑셀 파일로 일괄 업로드할 수 있어야 한다
- 대량 승객 데이터 처리 (100명 이상 가정)
- .xlsx 및 .xls 형식 지원
- 한글 인코딩 문제 없이 처리
- 에러 행 검증 및 상세 피드백 제공
- 메모리 효율성 (서버리스 환경 고려)

### 후보 라이브러리 비교

| 라이브러리 | GitHub Stars | 주간 다운로드 | .xlsx 지원 | .xls 지원 | 스트리밍 | 메모리 효율 | 타입스크립트 지원 |
|-----------|-------------|--------------|-----------|-----------|---------|-----------|-----------------|
| **xlsx** (SheetJS) | 34.5k | ~4M | ✅ | ✅ | ❌ | 중간 | ✅ (@types/xlsx) |
| **exceljs** | 12.8k | ~2M | ✅ | ❌ | ✅ | 높음 | ✅ (네이티브) |
| **node-xlsx** | 1.7k | ~150k | ✅ | ❌ | ❌ | 낮음 | ✅ (@types/node-xlsx) |
| **xlsx-populate** | 950 | ~80k | ✅ | ❌ | ❌ | 중간 | ❌ |

### 세부 평가

#### 1.1 xlsx (SheetJS Community Edition)

**장점**:
- 업계 표준 (npm에서 가장 많이 사용)
- .xls 레거시 형식 지원 (일부 기관에서 구 버전 엑셀 사용 가능성)
- 광범위한 커뮤니티 지원 및 문서
- 다양한 포맷 변환 기능 (JSON, CSV, HTML 등)

**단점**:
- 전체 파일을 메모리에 로드 (스트리밍 불가)
- Pro 버전은 상용 라이선스 필요
- 대용량 파일(10MB+) 처리 시 메모리 부담

**코드 예시**:
```typescript
import * as XLSX from 'xlsx';

export class ExcelParserService {
  parsePassengerFile(buffer: Buffer): PassengerDto[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // JSON 변환 (헤더 인식)
    const jsonData = XLSX.utils.sheet_to_json<PassengerRow>(worksheet, {
      header: ['name', 'phoneNumber', 'pickupAddress', 'dropoffAddress', 'shuttleType'],
      range: 1, // 첫 행은 헤더로 스킵
      defval: '', // 빈 셀 기본값
    });

    return this.validateAndTransform(jsonData);
  }
}
```

#### 1.2 exceljs

**장점**:
- 네이티브 타입스크립트 지원 (타입 안정성 우수)
- 스트리밍 읽기/쓰기 지원 (대용량 파일 처리 최적)
- 셀 스타일, 수식, 이미지 등 고급 기능 지원
- 메모리 효율적인 row-by-row 파싱 가능

**단점**:
- .xls 레거시 형식 미지원 (xlsx만 가능)
- xlsx보다 다소 느린 파싱 속도 (스트리밍 사용 시 상쇄)
- 상대적으로 적은 커뮤니티 규모

**코드 예시**:
```typescript
import { Workbook } from 'exceljs';

export class ExcelParserService {
  async parsePassengerFileStreaming(stream: Stream): Promise<PassengerDto[]> {
    const workbook = new Workbook();
    const worksheet = await workbook.xlsx.read(stream);
    const passengers: PassengerDto[] = [];

    worksheet.getWorksheet(1).eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 헤더 스킵

      const passenger = {
        name: row.getCell(1).value as string,
        phoneNumber: row.getCell(2).value as string,
        pickupAddress: row.getCell(3).value as string,
        dropoffAddress: row.getCell(4).value as string,
        shuttleType: row.getCell(5).value as ShuttleType,
      };

      passengers.push(this.validate(passenger, rowNumber));
    });

    return passengers;
  }
}
```

#### 1.3 node-xlsx

**장점**:
- 가장 가벼운 의존성
- 간단한 API (학습 곡선 낮음)
- 빠른 JSON 변환

**단점**:
- 기능 제한적 (기본 읽기/쓰기만 가능)
- .xls 미지원
- 스트리밍 미지원
- 유지보수 활동 저조 (마지막 업데이트 1년 이상)

### 최종 결정: **exceljs** ✅

**선택 근거**:

1. **타입 안정성**: 네이티브 타입스크립트 지원으로 개발 생산성 및 유지보수성 향상
2. **확장성**: 초기에는 소규모 엑셀 파일이지만, Stage 2/3에서 대규모 기관 데이터 처리 가능성 대비
3. **메모리 효율**: 스트리밍 파싱으로 서버리스(Lambda, Cloud Functions) 배포 시 메모리 제약 극복
4. **Constitution 원칙 부합**: "확장 가능한 설계" 원칙에 부합 (대용량 처리 대비)
5. **레거시 형식 제외 가능**: 2025년 기준 .xls 형식 요구사항 없음 (필요 시 사용자에게 .xlsx 변환 요청)

**설치 명령어**:
```bash
npm install exceljs
```

**대안 시나리오**:
- 만약 .xls 레거시 지원이 필수 요구사항으로 확인될 경우 → `xlsx` 라이브러리로 전환 고려

---

## 2. PostgreSQL 스키마 최적화 전략

### 요구사항 분석

**성능 목표** (Success Criteria 기반):
- **SC-001**: 차량/승객 등록 및 수정이 1분 이내 완료
- **SC-002**: 승객 그룹 생성이 5초 이내 완료
- **SC-004**: 100명의 승객 목록 조회가 3초 이내 완료
- **SC-005**: 20개 이상 차량 관리 시 3초 이내 전체 목록 조회
- **002-SC-002**: 케어 시간 간격이 실시간(1초 이내) 계산
- **002-SC-004**: 100명 기준 케어 시간 부족 리포트 생성이 3초 이내

### 2.1 인덱스 전략

#### 기본 인덱스 (Prisma 자동 생성)

```prisma
model Institution {
  id                    String   @id @default(uuid()) // PRIMARY KEY (자동 인덱스)
  businessRegistrationNo String  @unique              // UNIQUE INDEX (자동)
  // ...
}

model Passenger {
  id              String   @id @default(uuid())      // PRIMARY KEY
  institutionId   String                              // FOREIGN KEY (자동 인덱스)
  groupId         String?                             // FOREIGN KEY (자동 인덱스)

  @@unique([institutionId, phoneNumber])              // UNIQUE COMPOSITE INDEX
}
```

#### 추가 필요 인덱스

**1) Passenger 조회 최적화**

```prisma
model Passenger {
  // ...

  @@index([institutionId, shuttleType])        // 기관별 셔틀 유형 필터링
  @@index([groupId])                           // 그룹별 승객 조회 (이미 FK로 인덱스됨)
  @@index([institutionId, name])               // 기관 내 이름 검색
}
```

**근거**:
- FR-008: 셔틀 유형별 필터링 기능 → `institutionId + shuttleType` 복합 인덱스로 빠른 필터링
- FR-009: 이름/연락처 검색 → 부분 일치 검색은 LIKE 쿼리이므로 전체 인덱스 효과 제한적이지만, 정렬 시 도움

**2) PassengerSchedule 검증 최적화**

```prisma
model PassengerSchedule {
  // ...

  @@index([isCareTimeInsufficient])            // 케어 시간 부족 필터링
  @@index([passengerId])                       // 1:1 관계지만 명시적 검색 가능성
}
```

**근거**:
- 002-FR-017: 케어 시간 부족 승객 필터링 → Boolean 인덱스로 빠른 조회
- 002-SC-004: 100명 리포트 생성 3초 목표 → 인덱스 없으면 Full Table Scan 발생

**3) Vehicle-PassengerGroup 조인 최적화**

```prisma
model Vehicle {
  // ...

  @@index([institutionId, currentGroupId])     // 기관별 차량-그룹 조회
  @@index([lastFourDigits])                    // 차량번호 검색 (부분 일치)
}

model PassengerGroup {
  // ...

  @@index([institutionId, groupCode])          // 기관 내 그룹 코드 검색
}
```

#### 인덱스 크기 및 유지보수 고려사항

**트레이드오프**:
- 인덱스는 INSERT/UPDATE 성능 저하 (10-15% 오버헤드)
- 디스크 공간 사용량 증가 (인덱스 크기 ≈ 원본 데이터의 20-30%)

**완화 전략**:
- MVP 단계에서는 READ 최적화 우선 (관리자 포털은 조회 중심)
- Stage 2 이후 대용량 INSERT(승객 일괄 업로드) 발생 시 배치 처리 최적화
  - `COPY` 명령 또는 Prisma의 `createMany` 사용
  - 인덱스 임시 비활성화 후 재생성 (`REINDEX`) 고려

### 2.2 트랜잭션 전략

#### 2.2.1 승객 그룹 생성 시나리오 (FR-024~026)

**요구사항**: 여러 승객을 선택하여 그룹 생성 시 원자성 보장

```typescript
// ❌ 잘못된 방법: 개별 쿼리 (Race Condition 발생 가능)
async createGroupBad(dto: CreateGroupDto) {
  const group = await this.prisma.passengerGroup.create({
    data: { groupCode: dto.groupCode, name: dto.name, institutionId: dto.institutionId },
  });

  for (const passengerId of dto.passengerIds) {
    await this.prisma.passenger.update({
      where: { id: passengerId },
      data: { groupId: group.id },
    }); // 중간에 실패 시 일부만 그룹 할당됨 → 데이터 불일치
  }
}

// ✅ 올바른 방법: 트랜잭션 사용
async createGroupGood(dto: CreateGroupDto) {
  return this.prisma.$transaction(async (tx) => {
    // 1. 그룹 생성
    const group = await tx.passengerGroup.create({
      data: {
        groupCode: dto.groupCode,
        name: dto.name,
        institutionId: dto.institutionId,
        totalPassengerCount: dto.passengerIds.length,
      },
    });

    // 2. 승객들의 그룹 할당 (배치 업데이트)
    await tx.passenger.updateMany({
      where: {
        id: { in: dto.passengerIds },
        institutionId: dto.institutionId, // 보안: 다른 기관 승객 방지
      },
      data: { groupId: group.id },
    });

    return group;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // 기본값, 충분
    timeout: 10000, // 10초 타임아웃
  });
}
```

#### 2.2.2 차량 삭제 후 그룹 재연결 시나리오 (FR-013, FR-031)

**요구사항**: 차량 삭제 → 새 차량 등록 → 그룹 재연결 시 데이터 일관성

```typescript
async replaceVehicle(dto: ReplaceVehicleDto) {
  return this.prisma.$transaction(async (tx) => {
    // 1. 기존 차량의 그룹 정보 조회
    const oldVehicle = await tx.vehicle.findUnique({
      where: { id: dto.oldVehicleId },
      select: { currentGroupId: true },
    });

    if (!oldVehicle?.currentGroupId) {
      throw new Error('Old vehicle has no group assigned');
    }

    // 2. 기존 차량 삭제 (Soft Delete 권장)
    await tx.vehicle.update({
      where: { id: dto.oldVehicleId },
      data: { deletedAt: new Date() }, // Soft Delete
    });

    // 3. 새 차량 생성 및 그룹 연결
    const newVehicle = await tx.vehicle.create({
      data: {
        lastFourDigits: dto.newLastFourDigits,
        passengerCapacity: dto.passengerCapacity,
        institutionId: dto.institutionId,
        currentGroupId: oldVehicle.currentGroupId, // 그룹 재연결
      },
    });

    return newVehicle;
  });
}
```

**Soft Delete vs Hard Delete**:
- **Hard Delete** (현재 스키마): `onDelete: Cascade` → 차량 삭제 시 관련 기록 전부 삭제
  - 장점: 데이터베이스 용량 절약, GDPR 준수 용이
  - 단점: 운행 이력 추적 불가 (Stage 2 BI 대시보드 구현 시 문제)

- **Soft Delete** (권장): `deletedAt` 컬럼 추가
  - 장점: 감사 추적(Audit Trail) 가능, 복구 가능
  - 단점: 쿼리 복잡도 증가 (`WHERE deletedAt IS NULL` 조건 항상 필요)

**결정**: MVP는 Hard Delete 유지, Stage 2에서 Soft Delete 마이그레이션

#### 2.2.3 엑셀 일괄 업로드 트랜잭션 (FR-015)

```typescript
async bulkCreatePassengers(dto: BulkCreatePassengersDto) {
  const validatedData = dto.passengers.map(p => this.validatePassenger(p));

  return this.prisma.$transaction(async (tx) => {
    // createMany는 트랜잭션 내부에서 원자성 보장
    const result = await tx.passenger.createMany({
      data: validatedData,
      skipDuplicates: true, // 중복 시 에러 대신 스킵 (Optional)
    });

    return result;
  }, {
    timeout: 30000, // 대용량 업로드 대비 30초 타임아웃
  });
}
```

**성능 최적화**:
- `createMany`는 단일 INSERT 쿼리로 변환됨 (PostgreSQL의 batch insert 활용)
- 100명 기준 시간 복잡도: O(1) 쿼리 vs O(N) 쿼리 (개별 create 대비 10-50배 빠름)

### 2.3 쿼리 최적화 패턴

#### 2.3.1 N+1 쿼리 문제 방지

**문제 시나리오**: 승객 목록 조회 시 각 승객마다 그룹 정보 개별 쿼리

```typescript
// ❌ N+1 쿼리 발생
async getPassengersBad(institutionId: string) {
  const passengers = await this.prisma.passenger.findMany({
    where: { institutionId },
  });

  // 각 승객마다 그룹 정보 개별 조회 → 100명이면 101개 쿼리
  for (const passenger of passengers) {
    passenger.group = await this.prisma.passengerGroup.findUnique({
      where: { id: passenger.groupId },
    });
  }

  return passengers;
}

// ✅ Eager Loading으로 해결
async getPassengersGood(institutionId: string) {
  return this.prisma.passenger.findMany({
    where: { institutionId },
    include: {
      group: true,              // 1개의 JOIN 쿼리로 해결
      schedule: true,           // 002번 기능: 케어 시간 정보 포함
    },
    orderBy: { name: 'asc' },
  });
  // 총 1개의 쿼리로 완료 (JOIN 사용)
}
```

#### 2.3.2 페이지네이션 전략

**요구사항**: SC-004 (100명 승객 3초 이내 조회)

```typescript
// Cursor-based Pagination (권장: 대규모 데이터셋)
async getPassengersPaginated(institutionId: string, cursor?: string, limit = 50) {
  return this.prisma.passenger.findMany({
    where: { institutionId },
    take: limit,
    skip: cursor ? 1 : 0, // 커서가 있으면 해당 레코드 스킵
    cursor: cursor ? { id: cursor } : undefined,
    include: { group: true, schedule: true },
    orderBy: { createdAt: 'desc' },
  });
}

// Offset-based Pagination (간단하지만 대규모 오프셋에서 느림)
async getPassengersOffset(institutionId: string, page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.prisma.passenger.findMany({
      where: { institutionId },
      skip,
      take: limit,
      include: { group: true, schedule: true },
    }),
    this.prisma.passenger.count({ where: { institutionId } }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}
```

**선택 기준**:
- **Cursor-based**: 무한 스크롤 UI, 대규모 데이터(1000명+), 성능 중시
- **Offset-based**: 페이지 번호 UI, 소규모 데이터(~500명), 개발 편의성

**MVP 결정**: Offset-based (기관당 평균 승객 수 100-200명 예상, 페이지 UI 직관적)

#### 2.3.3 부분 일치 검색 최적화 (FR-009)

```typescript
// ❌ 성능 문제: 앞뒤 와일드카드
async searchPassengersSlow(institutionId: string, keyword: string) {
  return this.prisma.passenger.findMany({
    where: {
      institutionId,
      OR: [
        { name: { contains: keyword } },          // ILIKE '%keyword%' → 인덱스 미사용
        { phoneNumber: { contains: keyword } },
      ],
    },
  });
}

// ✅ 개선: 앞쪽 일치 + PostgreSQL Full-Text Search
async searchPassengersOptimized(institutionId: string, keyword: string) {
  // 1. 간단한 접두사 검색 (인덱스 활용 가능)
  if (keyword.length <= 2) {
    return this.prisma.passenger.findMany({
      where: {
        institutionId,
        OR: [
          { name: { startsWith: keyword } },       // ILIKE 'keyword%' → 인덱스 사용
          { phoneNumber: { startsWith: keyword } },
        ],
      },
    });
  }

  // 2. Full-Text Search (3글자 이상일 때)
  return this.prisma.$queryRaw`
    SELECT * FROM "Passenger"
    WHERE "institutionId" = ${institutionId}
    AND (
      to_tsvector('korean', name) @@ to_tsquery('korean', ${keyword})
      OR "phoneNumber" LIKE ${keyword + '%'}
    )
  `;
}
```

**Full-Text Search 인덱스 생성** (Prisma 마이그레이션 후 수동 실행):
```sql
-- GIN 인덱스 생성 (한글 형태소 분석 지원)
CREATE INDEX idx_passenger_name_fts ON "Passenger" USING GIN (to_tsvector('korean', name));
```

**트레이드오프**:
- Full-Text Search는 초기 설정 복잡도 증가
- MVP에서는 `startsWith` 정도로 충분 (기관당 승객 수 제한적)
- Stage 2에서 필요 시 Full-Text Search 도입

### 2.4 데이터베이스 연결 풀 설정

**Prisma Client 설정** (`prisma/schema.prisma`):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // 연결 풀 설정 (DATABASE_URL에 추가 가능)
  // postgresql://user:password@host:port/dbname?connection_limit=10&pool_timeout=20
}
```

**권장 설정** (NestJS 환경):
```typescript
// src/database/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['query', 'error', 'warn'], // 개발 환경에서만
    });
  }

  async onModuleInit() {
    await this.$connect();

    // 연결 풀 모니터링 (Optional)
    this.$on('query', (e) => {
      if (e.duration > 1000) { // 1초 이상 쿼리 로깅
        console.warn(`Slow query: ${e.query} (${e.duration}ms)`);
      }
    });
  }
}
```

**연결 풀 크기 결정**:
- **공식**: `connections = ((core_count × 2) + effective_spindle_count)`
- **MVP 예시**: 4 vCPU 서버 → 약 10-20 연결 권장
- **주의**: 너무 크면 PostgreSQL 리소스 고갈, 너무 작으면 대기 시간 증가

---

## 3. NestJS Bounded Context 모듈 구조

### 3.1 Bounded Context 정의 (DDD)

**Constitution 원칙**: "도메인 주도 설계(DDD)를 적용하여 각 Bounded Context를 독립적인 모듈로 설계"

**식별된 Bounded Contexts**:

1. **Institution Context** (기관 관리)
   - Aggregate Root: Institution
   - Entities: Institution, InstitutionType
   - Value Objects: BusinessRegistrationNumber

2. **Fleet Context** (차량 관리)
   - Aggregate Root: Vehicle
   - Entities: Vehicle
   - Value Objects: LicensePlateLastFour

3. **Roster Context** (승객 및 명단 관리)
   - Aggregate Root: PassengerGroup
   - Entities: Passenger, PassengerGroup, PassengerSchedule
   - Value Objects: PhoneNumber, Address, GroupCode

### 3.2 디렉토리 구조 (Modular Monolith)

```
src/
├── common/                                    # 공통 모듈
│   ├── database/
│   │   └── prisma.service.ts                  # Prisma Client Singleton
│   ├── filters/
│   │   └── http-exception.filter.ts           # 전역 에러 핸들러
│   ├── guards/
│   │   └── jwt-auth.guard.ts                  # JWT 인증 가드
│   └── validators/
│       └── korean-phone.validator.ts          # 한국 전화번호 검증
│
├── institution/                               # Institution Bounded Context
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── institution.entity.ts
│   │   │   └── institution-type.entity.ts
│   │   ├── value-objects/
│   │   │   └── business-registration-number.vo.ts
│   │   └── repositories/
│   │       └── institution.repository.interface.ts  # 도메인 인터페이스
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-institution.command.ts
│   │   │   └── update-institution-type.command.ts
│   │   ├── queries/
│   │   │   └── get-institution.query.ts
│   │   └── services/
│   │       └── institution.service.ts         # 유즈케이스 오케스트레이션
│   ├── infrastructure/
│   │   └── persistence/
│   │       └── institution.repository.ts      # Prisma 구현체
│   ├── interface/
│   │   ├── dtos/
│   │   │   ├── create-institution.dto.ts
│   │   │   └── institution-response.dto.ts
│   │   └── controllers/
│   │       └── institution.controller.ts
│   └── institution.module.ts
│
├── fleet/                                     # Fleet Bounded Context
│   ├── domain/
│   │   ├── entities/
│   │   │   └── vehicle.entity.ts
│   │   └── repositories/
│   │       └── vehicle.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-vehicle.command.ts
│   │   │   └── replace-vehicle.command.ts     # FR-013 차량 교체
│   │   └── services/
│   │       └── vehicle.service.ts
│   ├── infrastructure/
│   │   └── persistence/
│   │       └── vehicle.repository.ts
│   ├── interface/
│   │   ├── dtos/
│   │   │   └── create-vehicle.dto.ts
│   │   └── controllers/
│   │       └── vehicle.controller.ts
│   └── fleet.module.ts
│
├── roster/                                    # Roster Bounded Context
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── passenger.entity.ts
│   │   │   ├── passenger-group.entity.ts
│   │   │   └── passenger-schedule.entity.ts   # 002번 기능
│   │   ├── value-objects/
│   │   │   ├── phone-number.vo.ts
│   │   │   ├── address.vo.ts
│   │   │   └── group-code.vo.ts
│   │   ├── services/
│   │   │   └── care-time-calculator.domain-service.ts  # 002-FR-007 도메인 로직
│   │   └── repositories/
│   │       ├── passenger.repository.interface.ts
│   │       └── passenger-group.repository.interface.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-passenger.command.ts
│   │   │   ├── bulk-create-passengers.command.ts     # FR-015 엑셀 업로드
│   │   │   ├── create-passenger-group.command.ts     # FR-024
│   │   │   └── update-passenger-schedule.command.ts  # 002-FR-001
│   │   ├── queries/
│   │   │   ├── get-passengers.query.ts
│   │   │   └── get-care-time-report.query.ts         # 002-FR-018
│   │   └── services/
│   │       ├── passenger.service.ts
│   │       ├── passenger-group.service.ts
│   │       ├── excel-parser.service.ts               # FR-015 엑셀 파싱
│   │       └── care-time-validator.service.ts        # 002-FR-006~010
│   ├── infrastructure/
│   │   └── persistence/
│   │       ├── passenger.repository.ts
│   │       └── passenger-group.repository.ts
│   ├── interface/
│   │   ├── dtos/
│   │   │   ├── create-passenger.dto.ts
│   │   │   ├── bulk-upload-passengers.dto.ts
│   │   │   ├── create-passenger-group.dto.ts
│   │   │   └── passenger-schedule.dto.ts
│   │   └── controllers/
│   │       ├── passenger.controller.ts
│   │       └── passenger-group.controller.ts
│   └── roster.module.ts
│
└── app.module.ts                              # Root Module
```

### 3.3 레이어별 역할 상세

#### 3.3.1 Domain Layer (도메인 계층)

**책임**: 비즈니스 로직의 핵심, 프레임워크 독립적

**Entities** (`domain/entities/`):
```typescript
// roster/domain/entities/passenger.entity.ts
export class Passenger {
  constructor(
    public readonly id: string,
    public name: string,
    public phoneNumber: PhoneNumber,      // Value Object
    public pickupAddress: Address,         // Value Object
    public dropoffAddress: Address,
    public shuttleType: ShuttleType,
    public institutionId: string,
    public groupId?: string,
  ) {}

  // 도메인 로직: 그룹 할당 가능 여부 검증
  canAssignToGroup(group: PassengerGroup): boolean {
    if (this.institutionId !== group.institutionId) {
      throw new DomainException('Cannot assign passenger to different institution group');
    }
    return true;
  }

  // 도메인 로직: 탑승/하차 주소 변경 검증
  updateAddresses(pickup: Address, dropoff: Address): void {
    if (pickup.equals(dropoff)) {
      throw new DomainException('Pickup and dropoff addresses must be different');
    }
    this.pickupAddress = pickup;
    this.dropoffAddress = dropoff;
  }
}
```

**Value Objects** (`domain/value-objects/`):
```typescript
// roster/domain/value-objects/phone-number.vo.ts
export class PhoneNumber {
  private readonly value: string;

  constructor(phoneNumber: string) {
    this.validate(phoneNumber);
    this.value = this.normalize(phoneNumber);
  }

  private validate(phoneNumber: string): void {
    const regex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!regex.test(phoneNumber)) {
      throw new DomainException('Invalid Korean phone number format');
    }
  }

  private normalize(phoneNumber: string): string {
    return phoneNumber.replace(/-/g, ''); // 하이픈 제거
  }

  toString(): string {
    return this.value;
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }
}
```

**Domain Services** (`domain/services/`):
```typescript
// roster/domain/services/care-time-calculator.domain-service.ts
export class CareTimeCalculator {
  // 002-FR-007: 케어 시간 간격 계산
  calculateCareTimeHours(pickupTime: string, dropoffTime: string): number {
    const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number);
    const [dropoffHour, dropoffMinute] = dropoffTime.split(':').map(Number);

    const pickupMinutes = pickupHour * 60 + pickupMinute;
    const dropoffMinutes = dropoffHour * 60 + dropoffMinute;

    const diffMinutes = dropoffMinutes - pickupMinutes;

    if (diffMinutes < 0) {
      throw new DomainException('Dropoff time must be after pickup time (same-day only)');
    }

    return diffMinutes / 60; // 시간 단위 변환
  }

  // 002-FR-008: 8시간 검증
  isCareTimeSufficient(careTimeHours: number, requiredHours: number): boolean {
    return careTimeHours >= requiredHours;
  }
}
```

#### 3.3.2 Application Layer (애플리케이션 계층)

**책임**: 유즈케이스 오케스트레이션, 트랜잭션 관리

**Commands** (쓰기 작업):
```typescript
// roster/application/commands/create-passenger-group.command.ts
export class CreatePassengerGroupCommand {
  constructor(
    public readonly institutionId: string,
    public readonly groupCode: string,
    public readonly name: string,
    public readonly passengerIds: string[],
  ) {}
}

// roster/application/commands/create-passenger-group.handler.ts
@Injectable()
export class CreatePassengerGroupHandler {
  constructor(
    private readonly passengerGroupRepo: PassengerGroupRepository,
    private readonly passengerRepo: PassengerRepository,
  ) {}

  async execute(command: CreatePassengerGroupCommand): Promise<PassengerGroup> {
    // 1. 도메인 객체 생성
    const group = new PassengerGroup(
      uuid(),
      command.institutionId,
      new GroupCode(command.groupCode),
      command.name,
      command.passengerIds.length,
    );

    // 2. 저장 (리포지토리가 트랜잭션 처리)
    return this.passengerGroupRepo.createWithPassengers(group, command.passengerIds);
  }
}
```

**Queries** (읽기 작업):
```typescript
// roster/application/queries/get-care-time-report.query.ts
export class GetCareTimeReportQuery {
  constructor(
    public readonly institutionId: string,
    public readonly filterInsufficient?: boolean,
  ) {}
}

// roster/application/queries/get-care-time-report.handler.ts
@Injectable()
export class GetCareTimeReportHandler {
  constructor(private readonly passengerRepo: PassengerRepository) {}

  async execute(query: GetCareTimeReportQuery): Promise<CareTimeReportDto> {
    const passengers = await this.passengerRepo.findWithSchedules({
      institutionId: query.institutionId,
      isCareTimeInsufficient: query.filterInsufficient,
    });

    return {
      totalPassengers: passengers.length,
      insufficientCount: passengers.filter(p => p.schedule?.isCareTimeInsufficient).length,
      passengers: passengers.map(p => this.toDto(p)),
    };
  }
}
```

**Services** (유즈케이스 조합):
```typescript
// roster/application/services/passenger.service.ts
@Injectable()
export class PassengerService {
  constructor(
    private readonly createHandler: CreatePassengerHandler,
    private readonly bulkCreateHandler: BulkCreatePassengersHandler,
    private readonly getPassengersHandler: GetPassengersQueryHandler,
    private readonly excelParser: ExcelParserService,
  ) {}

  // FR-015: 엑셀 일괄 업로드
  async bulkUploadFromExcel(
    institutionId: string,
    file: Express.Multer.File,
  ): Promise<BulkUploadResultDto> {
    // 1. 엑셀 파싱 (애플리케이션 서비스 활용)
    const parsedData = await this.excelParser.parsePassengerFile(file.buffer);

    // 2. Command 생성 및 실행
    const command = new BulkCreatePassengersCommand(institutionId, parsedData);
    return this.bulkCreateHandler.execute(command);
  }
}
```

#### 3.3.3 Infrastructure Layer (인프라 계층)

**책임**: 외부 의존성 구현 (DB, API 등)

**Repository 구현체**:
```typescript
// roster/infrastructure/persistence/passenger.repository.ts
@Injectable()
export class PassengerRepository implements IPassengerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Passenger | null> {
    const data = await this.prisma.passenger.findUnique({
      where: { id },
      include: { schedule: true },
    });

    return data ? this.toDomain(data) : null;
  }

  async save(passenger: Passenger): Promise<Passenger> {
    const data = await this.prisma.passenger.create({
      data: this.toPrisma(passenger),
    });

    return this.toDomain(data);
  }

  // Prisma 모델 ↔ 도메인 엔티티 변환
  private toDomain(data: PrismaPassenger): Passenger {
    return new Passenger(
      data.id,
      data.name,
      new PhoneNumber(data.phoneNumber),
      new Address(data.pickupAddress),
      new Address(data.dropoffAddress),
      data.shuttleType as ShuttleType,
      data.institutionId,
      data.groupId,
    );
  }

  private toPrisma(passenger: Passenger): Prisma.PassengerCreateInput {
    return {
      id: passenger.id,
      name: passenger.name,
      phoneNumber: passenger.phoneNumber.toString(),
      pickupAddress: passenger.pickupAddress.toString(),
      dropoffAddress: passenger.dropoffAddress.toString(),
      shuttleType: passenger.shuttleType,
      institution: { connect: { id: passenger.institutionId } },
      group: passenger.groupId ? { connect: { id: passenger.groupId } } : undefined,
    };
  }
}
```

#### 3.3.4 Interface Layer (인터페이스 계층)

**책임**: HTTP 요청/응답 처리, DTO 변환

**Controllers**:
```typescript
// roster/interface/controllers/passenger.controller.ts
@Controller('institutions/:institutionId/passengers')
@UseGuards(JwtAuthGuard)
export class PassengerController {
  constructor(private readonly passengerService: PassengerService) {}

  // FR-001: 승객 등록
  @Post()
  async create(
    @Param('institutionId') institutionId: string,
    @Body() dto: CreatePassengerDto,
  ): Promise<PassengerResponseDto> {
    const command = new CreatePassengerCommand(institutionId, dto);
    return this.passengerService.create(command);
  }

  // FR-015: 엑셀 일괄 업로드
  @Post('bulk-upload')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(
    @Param('institutionId') institutionId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BulkUploadResultDto> {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    return this.passengerService.bulkUploadFromExcel(institutionId, file);
  }

  // FR-007: 승객 목록 조회
  @Get()
  async getAll(
    @Param('institutionId') institutionId: string,
    @Query() query: GetPassengersQueryDto,
  ): Promise<PaginatedPassengersDto> {
    return this.passengerService.getPassengers(institutionId, query);
  }
}
```

**DTOs**:
```typescript
// roster/interface/dtos/create-passenger.dto.ts
export class CreatePassengerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, {
    message: 'Invalid Korean phone number format',
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @IsString()
  @IsNotEmpty()
  dropoffAddress: string;

  @IsEnum(ShuttleType)
  shuttleType: ShuttleType;

  @IsOptional()
  @IsString()
  groupId?: string;

  // 002번 기능: 케어 시간 정보 (Optional)
  @IsOptional()
  @ValidateNested()
  @Type(() => PassengerScheduleDto)
  schedule?: PassengerScheduleDto;
}

// roster/interface/dtos/passenger-schedule.dto.ts
export class PassengerScheduleDto {
  @IsString()
  @Matches(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:MM format',
  })
  desiredPickupTime: string;

  @IsString()
  @Matches(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:MM format',
  })
  desiredDropoffTime: string;
}
```

### 3.4 모듈 간 통신 전략

#### 3.4.1 직접 의존성 주입 (MVP 단계)

**시나리오**: Fleet Context에서 Roster Context 정보 조회 필요

```typescript
// fleet/application/services/vehicle.service.ts
@Injectable()
export class VehicleService {
  constructor(
    private readonly vehicleRepo: VehicleRepository,
    private readonly passengerGroupRepo: PassengerGroupRepository, // Roster Context 리포지토리
  ) {}

  // FR-031: 차량-그룹 연결
  async connectToGroup(vehicleId: string, groupId: string): Promise<Vehicle> {
    // 1. 그룹 존재 여부 확인 (Cross-Context 조회)
    const group = await this.passengerGroupRepo.findById(groupId);
    if (!group) {
      throw new NotFoundException('Passenger group not found');
    }

    // 2. 차량 업데이트
    const vehicle = await this.vehicleRepo.findById(vehicleId);
    vehicle.connectToGroup(groupId);

    return this.vehicleRepo.save(vehicle);
  }
}
```

**장점**: 간단하고 빠른 구현, 트랜잭션 관리 용이
**단점**: 모듈 간 강결합, 마이크로서비스 전환 시 리팩토링 필요

#### 3.4.2 이벤트 기반 통신 (Stage 2 권장)

**시나리오**: 승객 그룹 삭제 시 연결된 차량의 그룹 ID 초기화

```typescript
// roster/application/commands/delete-passenger-group.handler.ts
@Injectable()
export class DeletePassengerGroupHandler {
  constructor(
    private readonly passengerGroupRepo: PassengerGroupRepository,
    private readonly eventBus: EventBus, // NestJS CQRS 모듈
  ) {}

  async execute(command: DeletePassengerGroupCommand): Promise<void> {
    // 1. 그룹 삭제
    await this.passengerGroupRepo.delete(command.groupId);

    // 2. 도메인 이벤트 발행 (비동기 처리)
    this.eventBus.publish(new PassengerGroupDeletedEvent(command.groupId));
  }
}

// fleet/application/event-handlers/passenger-group-deleted.handler.ts
@EventsHandler(PassengerGroupDeletedEvent)
export class PassengerGroupDeletedHandler implements IEventHandler<PassengerGroupDeletedEvent> {
  constructor(private readonly vehicleRepo: VehicleRepository) {}

  async handle(event: PassengerGroupDeletedEvent): Promise<void> {
    // 연결된 차량의 그룹 ID 초기화
    await this.vehicleRepo.updateMany(
      { currentGroupId: event.groupId },
      { currentGroupId: null },
    );
  }
}
```

**설정** (`app.module.ts`):
```typescript
@Module({
  imports: [
    CqrsModule, // NestJS CQRS 지원
    InstitutionModule,
    FleetModule,
    RosterModule,
  ],
})
export class AppModule {}
```

**장점**: 느슨한 결합, 마이크로서비스 전환 용이 (이벤트 버스 → Kafka/RabbitMQ)
**단점**: 복잡도 증가, 디버깅 어려움, 이벤트 순서 보장 필요

### 3.5 모듈 등록 및 의존성 주입

**Root Module** (`app.module.ts`):
```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Database
    DatabaseModule, // PrismaService 제공

    // Bounded Contexts
    InstitutionModule,
    FleetModule,
    RosterModule,

    // CQRS (Stage 2)
    // CqrsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

**Roster Module** (`roster/roster.module.ts`):
```typescript
@Module({
  imports: [DatabaseModule], // PrismaService 주입
  controllers: [
    PassengerController,
    PassengerGroupController,
  ],
  providers: [
    // Application Services
    PassengerService,
    PassengerGroupService,
    ExcelParserService,
    CareTimeValidatorService,

    // Domain Services
    CareTimeCalculator,

    // Repositories
    {
      provide: 'IPassengerRepository',
      useClass: PassengerRepository,
    },
    {
      provide: 'IPassengerGroupRepository',
      useClass: PassengerGroupRepository,
    },

    // Command/Query Handlers
    CreatePassengerHandler,
    BulkCreatePassengersHandler,
    GetPassengersQueryHandler,
    GetCareTimeReportHandler,
  ],
  exports: [
    'IPassengerRepository',          // Fleet 모듈에서 사용 가능
    'IPassengerGroupRepository',
    PassengerService,
  ],
})
export class RosterModule {}
```

---

## 4. 시간 계산 라이브러리 비교

### 요구사항 분석

**002-FR-007**: 희망 탑승 시간과 희망 하차 시간 간의 간격을 **시간 단위로 자동 계산**
**002-SC-002**: 케어 시간 간격이 **실시간으로 1초 이내에 계산**

**핵심 기능**:
- HH:MM 형식 문자열 파싱
- 시간 간격 계산 (분 단위 → 시간 단위 변환)
- 8시간 미만 검증
- 타임존 처리 불필요 (한국 표준시 고정)

### 후보 라이브러리 비교

| 라이브러리 | GitHub Stars | 번들 크기 (minified + gzipped) | 불변성 | 타입스크립트 지원 | 학습 곡선 | 타임존 지원 |
|-----------|-------------|-------------------------------|-------|-----------------|----------|-----------|
| **date-fns** | 34k | ~13KB (tree-shakable) | ✅ | ✅ (네이티브) | 낮음 | ✅ (date-fns-tz) |
| **Day.js** | 46k | ~2KB | ❌ (플러그인으로 가능) | ✅ (@types/dayjs) | 낮음 | ✅ (플러그인) |
| **Luxon** | 15k | ~25KB | ✅ | ✅ (네이티브) | 중간 | ✅ (네이티브 Intl) |
| **Moment.js** | 48k | ~67KB | ❌ | ✅ | 낮음 | ✅ |

**Note**: Moment.js는 공식적으로 유지보수 모드(deprecated)로 신규 프로젝트 비권장

### 세부 평가

#### 4.1 date-fns

**장점**:
- 함수형 프로그래밍 스타일 (순수 함수, 사이드 이펙트 없음)
- Tree-shaking 지원 (사용하는 함수만 번들에 포함)
- 네이티브 Date 객체 사용 (학습 비용 낮음)
- 광범위한 로케일 지원 (한국어 포함)

**단점**:
- 타임존 처리는 별도 라이브러리(`date-fns-tz`) 필요
- 번들 크기가 Day.js보다 큼

**코드 예시**:
```typescript
import { parse, differenceInMinutes, formatDuration, intervalToDuration } from 'date-fns';
import { ko } from 'date-fns/locale';

export class CareTimeCalculator {
  calculateCareTimeHours(pickupTime: string, dropoffTime: string): number {
    // HH:MM → Date 객체 변환 (임의의 날짜 사용)
    const baseDate = new Date(2025, 0, 1); // 2025-01-01
    const pickup = parse(pickupTime, 'HH:mm', baseDate);
    const dropoff = parse(dropoffTime, 'HH:mm', baseDate);

    const diffMinutes = differenceInMinutes(dropoff, pickup);

    if (diffMinutes < 0) {
      throw new Error('Dropoff time must be after pickup time');
    }

    return diffMinutes / 60;
  }

  // 사용자 친화적 표시 (예: "8시간 30분")
  formatCareTime(hours: number): string {
    const duration = intervalToDuration({ start: 0, end: hours * 60 * 60 * 1000 });
    return formatDuration(duration, { locale: ko }); // "8시간 30분"
  }
}
```

#### 4.2 Day.js

**장점**:
- 극도로 작은 번들 크기 (2KB)
- Moment.js와 유사한 API (기존 개발자 친숙)
- 플러그인 시스템으로 필요 기능만 추가

**단점**:
- 기본적으로 불변성 미지원 (플러그인 필요)
- 타입스크립트 지원이 @types 패키지 의존

**코드 예시**:
```typescript
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';

dayjs.extend(customParseFormat);
dayjs.extend(duration);

export class CareTimeCalculator {
  calculateCareTimeHours(pickupTime: string, dropoffTime: string): number {
    const pickup = dayjs(pickupTime, 'HH:mm');
    const dropoff = dayjs(dropoffTime, 'HH:mm');

    const diffMinutes = dropoff.diff(pickup, 'minute');

    if (diffMinutes < 0) {
      throw new Error('Dropoff time must be after pickup time');
    }

    return diffMinutes / 60;
  }

  formatCareTime(hours: number): string {
    const dur = dayjs.duration(hours, 'hours');
    return `${dur.hours()}시간 ${dur.minutes()}분`;
  }
}
```

#### 4.3 Luxon

**장점**:
- Intl API 기반 타임존 처리 (별도 라이브러리 불필요)
- 불변 객체 기본 제공
- 네이티브 타입스크립트 지원
- ISO 8601 표준 준수

**단점**:
- 번들 크기가 가장 큼 (25KB)
- 학습 곡선 높음 (새로운 API 체계)
- 브라우저 Intl API 의존 (폴리필 필요할 수 있음)

**코드 예시**:
```typescript
import { DateTime, Duration } from 'luxon';

export class CareTimeCalculator {
  calculateCareTimeHours(pickupTime: string, dropoffTime: string): number {
    const pickup = DateTime.fromFormat(pickupTime, 'HH:mm');
    const dropoff = DateTime.fromFormat(dropoffTime, 'HH:mm');

    const diff = dropoff.diff(pickup, 'minutes');

    if (diff.minutes < 0) {
      throw new Error('Dropoff time must be after pickup time');
    }

    return diff.as('hours');
  }

  formatCareTime(hours: number): string {
    return Duration.fromObject({ hours }).toFormat('h시간 m분', { locale: 'ko' });
  }
}
```

### 최종 결정: **date-fns** ✅

**선택 근거**:

1. **요구사항 충족**: 타임존 처리 불필요 (한국 시간만 사용) → Luxon의 장점 불필요
2. **번들 최적화**: Tree-shaking으로 필요 함수만 포함 (실제 사용 시 ~5KB 예상)
3. **타입 안정성**: 네이티브 타입스크립트 지원으로 컴파일 타임 에러 감지
4. **유지보수성**: 함수형 프로그래밍 스타일로 테스트 작성 용이
5. **확장성**: Stage 2/3에서 타임존 기능 필요 시 `date-fns-tz` 추가 가능
6. **Constitution 원칙**: "확장 가능한 설계" 및 "테스트 주도 개발" 원칙 부합

**설치 명령어**:
```bash
npm install date-fns
```

**대안 시나리오**:
- 만약 번들 크기가 절대적 우선순위라면 → Day.js 고려 (프론트엔드에서 특히 유용)

---

## 5. 프론트엔드 상태 관리 솔루션

### 요구사항 분석

**프론트엔드 기술 스택**: Next.js 14 App Router (React Server Components 활용)

**상태 관리 필요 영역**:
1. **서버 상태** (API 데이터): 승객 목록, 차량 목록, 그룹 목록 등
2. **클라이언트 상태** (UI 상태): 모달 열림/닫힘, 폼 입력값, 선택된 행 등
3. **폼 상태**: 승객 등록 폼, 엑셀 업로드 폼 등

**성능 요구사항**:
- SC-004: 100명 승객 목록 조회 3초 이내
- SC-002: 실시간 케어 시간 계산 (1초 이내)
- 낙관적 업데이트(Optimistic Update)로 UX 개선

### 후보 솔루션 비교

| 솔루션 | 타입 | 번들 크기 | 러닝 커브 | 서버 상태 관리 | 캐싱 | Optimistic Update | TypeScript 지원 |
|-------|------|----------|----------|--------------|-----|-------------------|----------------|
| **React Query (TanStack Query)** | 서버 상태 | ~13KB | 낮음 | ✅ (전문) | ✅ | ✅ | ✅ (네이티브) |
| **Zustand** | 클라이언트 상태 | ~1KB | 낮음 | ❌ | ❌ | ❌ | ✅ (네이티브) |
| **Redux Toolkit** | 클라이언트 상태 | ~15KB | 중간 | ⚠️ (RTK Query) | ✅ | ✅ | ✅ (네이티브) |
| **Recoil** | 클라이언트 상태 | ~14KB | 중간 | ❌ | ❌ | ❌ | ✅ (네이티브) |
| **Jotai** | 클라이언트 상태 | ~3KB | 낮음 | ❌ | ❌ | ❌ | ✅ (네이티브) |

### 세부 평가

#### 5.1 React Query (TanStack Query)

**목적**: 서버 상태 관리 전문 (API 캐싱, 동기화, Prefetching)

**장점**:
- 자동 캐싱 및 백그라운드 리패칭
- Stale-While-Revalidate 전략으로 빠른 UX
- 낙관적 업데이트 및 에러 롤백 내장
- Next.js App Router와 완벽 통합 (Server Components + Client Components)
- Devtools 제공 (캐시 상태 시각화)

**단점**:
- 클라이언트 상태 관리는 별도 라이브러리 필요
- 초기 설정 복잡도 (QueryClient, Provider 등)

**코드 예시**:
```typescript
// app/providers.tsx (Client Component)
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,        // 1분간 fresh 상태 유지
        cacheTime: 5 * 60 * 1000,    // 5분간 캐시 유지
        refetchOnWindowFocus: false, // 윈도우 포커스 시 리패칭 비활성화
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// app/institutions/[id]/passengers/page.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function PassengerListPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();

  // 승객 목록 조회 (자동 캐싱)
  const { data, isLoading, error } = useQuery({
    queryKey: ['passengers', params.id],
    queryFn: () => fetchPassengers(params.id),
  });

  // 승객 삭제 (낙관적 업데이트)
  const deleteMutation = useMutation({
    mutationFn: (passengerId: string) => deletePassenger(passengerId),
    onMutate: async (passengerId) => {
      // 백그라운드 리패칭 취소
      await queryClient.cancelQueries({ queryKey: ['passengers', params.id] });

      // 이전 값 백업
      const previousPassengers = queryClient.getQueryData(['passengers', params.id]);

      // 낙관적 업데이트 (UI에서 즉시 제거)
      queryClient.setQueryData(['passengers', params.id], (old: Passenger[]) =>
        old.filter(p => p.id !== passengerId)
      );

      return { previousPassengers };
    },
    onError: (err, passengerId, context) => {
      // 에러 발생 시 롤백
      queryClient.setQueryData(['passengers', params.id], context?.previousPassengers);
    },
    onSettled: () => {
      // 성공/실패 관계없이 서버 데이터로 동기화
      queryClient.invalidateQueries({ queryKey: ['passengers', params.id] });
    },
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <PassengerTable
      passengers={data}
      onDelete={(id) => deleteMutation.mutate(id)}
    />
  );
}
```

#### 5.2 Zustand

**목적**: 경량 클라이언트 상태 관리 (모달, 폼, UI 상태)

**장점**:
- 극도로 작은 번들 크기 (1KB)
- Boilerplate 최소화 (Provider 불필요)
- React 외부에서도 상태 접근 가능
- 미들웨어로 Redux DevTools 연동 가능

**단점**:
- 서버 상태 관리는 별도 라이브러리 필요
- 대규모 상태 관리 시 구조화 어려움

**코드 예시**:
```typescript
// stores/ui-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  isPassengerModalOpen: boolean;
  selectedPassengerIds: string[];

  openPassengerModal: () => void;
  closePassengerModal: () => void;
  togglePassengerSelection: (id: string) => void;
  clearSelection: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isPassengerModalOpen: false,
      selectedPassengerIds: [],

      openPassengerModal: () => set({ isPassengerModalOpen: true }),
      closePassengerModal: () => set({ isPassengerModalOpen: false }),

      togglePassengerSelection: (id) => set((state) => ({
        selectedPassengerIds: state.selectedPassengerIds.includes(id)
          ? state.selectedPassengerIds.filter(pid => pid !== id)
          : [...state.selectedPassengerIds, id],
      })),

      clearSelection: () => set({ selectedPassengerIds: [] }),
    }),
    { name: 'UI Store' }
  )
);

// components/PassengerTable.tsx
'use client';

import { useUIStore } from '@/stores/ui-store';

export function PassengerTable({ passengers }: { passengers: Passenger[] }) {
  const { selectedPassengerIds, togglePassengerSelection } = useUIStore();

  return (
    <table>
      {passengers.map(passenger => (
        <tr key={passenger.id}>
          <td>
            <input
              type="checkbox"
              checked={selectedPassengerIds.includes(passenger.id)}
              onChange={() => togglePassengerSelection(passenger.id)}
            />
          </td>
          <td>{passenger.name}</td>
        </tr>
      ))}
    </table>
  );
}
```

#### 5.3 Redux Toolkit (RTK) + RTK Query

**목적**: 전통적 전역 상태 관리 + 서버 상태 관리

**장점**:
- 강력한 DevTools (시간 여행 디버깅)
- RTK Query로 서버 상태 관리 통합
- 대규모 팀 협업에 유리한 구조화된 패턴
- 광범위한 커뮤니티 및 문서

**단점**:
- 높은 학습 곡선 (Slice, Reducer, Action 등)
- Boilerplate 많음 (RTK로 개선되었지만 여전히 많음)
- 번들 크기 큼 (React Query + Zustand 조합보다 큼)

**코드 예시**:
```typescript
// store/api-slice.ts (RTK Query)
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Passenger', 'Vehicle'],
  endpoints: (builder) => ({
    getPassengers: builder.query<Passenger[], string>({
      query: (institutionId) => `/institutions/${institutionId}/passengers`,
      providesTags: ['Passenger'],
    }),
    deletePassenger: builder.mutation<void, string>({
      query: (id) => ({
        url: `/passengers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Passenger'], // 자동 리패칭
    }),
  }),
});

export const { useGetPassengersQuery, useDeletePassengerMutation } = apiSlice;

// components/PassengerList.tsx
import { useGetPassengersQuery, useDeletePassengerMutation } from '@/store/api-slice';

export function PassengerList({ institutionId }: { institutionId: string }) {
  const { data, isLoading } = useGetPassengersQuery(institutionId);
  const [deletePassenger] = useDeletePassengerMutation();

  return (
    <ul>
      {data?.map(passenger => (
        <li key={passenger.id}>
          {passenger.name}
          <button onClick={() => deletePassenger(passenger.id)}>삭제</button>
        </li>
      ))}
    </ul>
  );
}
```

### 최종 결정: **React Query + Zustand** ✅

**선택 근거**:

1. **관심사 분리**:
   - **React Query**: 서버 상태 (API 캐싱, Prefetching, 낙관적 업데이트)
   - **Zustand**: 클라이언트 상태 (모달, 선택 상태, 임시 폼 데이터)

2. **Next.js 14 App Router 최적화**:
   - React Query는 Server Components와 Client Components 혼용 환경에서 최적
   - Server Components에서 초기 데이터 Prefetch, Client Components에서 React Query 활용

3. **성능**:
   - React Query의 Stale-While-Revalidate 전략으로 SC-004(3초 이내 조회) 달성
   - Zustand의 경량 번들(1KB)로 초기 로딩 시간 최소화

4. **개발 생산성**:
   - React Query는 데이터 페칭 보일러플레이트 80% 감소
   - Zustand는 Provider 불필요, Redux 대비 코드량 50% 감소

5. **확장성**:
   - Stage 2/3에서 복잡한 상태 필요 시 Zustand로 모듈화 가능
   - React Query의 캐싱 전략이 대규모 데이터셋에서도 우수한 성능

**설치 명령어**:
```bash
npm install @tanstack/react-query zustand
npm install --save-dev @tanstack/react-query-devtools
```

**폴더 구조**:
```
frontend/
├── app/
│   ├── providers.tsx                    # React Query Provider
│   └── layout.tsx
├── hooks/
│   ├── queries/
│   │   ├── use-passengers.ts            # React Query 커스텀 훅
│   │   ├── use-vehicles.ts
│   │   └── use-passenger-groups.ts
│   └── mutations/
│       ├── use-create-passenger.ts
│       └── use-bulk-upload-passengers.ts
└── stores/
    ├── ui-store.ts                      # Zustand UI 상태
    └── form-store.ts                    # Zustand 폼 상태
```

**대안 시나리오**:
- Redux 경험이 풍부한 팀이라면 → RTK Query로 통합 고려
- 극단적 단순성 우선이라면 → Next.js의 Server Actions만으로 충분할 수 있음

---

## 6. 추가 기술 결정 사항

### 6.1 폼 검증 라이브러리

**요구사항**: 승객 등록 폼, 엑셀 업로드 검증 (FR-001~005, FR-015)

**결정**: **Zod** + **React Hook Form** ✅

**근거**:
- Zod는 스키마 기반 타입 안전 검증 (타입스크립트와 완벽 통합)
- React Hook Form은 비제어 컴포넌트 방식으로 성능 우수 (불필요한 리렌더링 방지)
- Zod 스키마를 백엔드 DTO 검증에도 재사용 가능 (풀스택 타입 안정성)

**코드 예시**:
```typescript
// shared/schemas/passenger.schema.ts (프론트엔드 + 백엔드 공유)
import { z } from 'zod';

export const passengerSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  phoneNumber: z.string().regex(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, '유효한 전화번호를 입력해주세요'),
  pickupAddress: z.string().min(1, '탑승지를 입력해주세요'),
  dropoffAddress: z.string().min(1, '하차지를 입력해주세요'),
  shuttleType: z.enum(['MORNING', 'EVENING', 'TEMPORARY']),
  schedule: z.object({
    desiredPickupTime: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/),
    desiredDropoffTime: z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/),
  }).optional(),
});

export type PassengerInput = z.infer<typeof passengerSchema>;

// frontend/components/PassengerForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function PassengerForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<PassengerInput>({
    resolver: zodResolver(passengerSchema),
  });

  const onSubmit = (data: PassengerInput) => {
    // 타입 안전하게 검증된 데이터
    createPassengerMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* ... */}
    </form>
  );
}

// backend/src/roster/interface/dtos/create-passenger.dto.ts
import { passengerSchema } from '@/shared/schemas/passenger.schema';
import { createZodDto } from 'nestjs-zod';

export class CreatePassengerDto extends createZodDto(passengerSchema) {}
```

**설치 명령어**:
```bash
npm install zod react-hook-form @hookform/resolvers
npm install nestjs-zod  # 백엔드용
```

### 6.2 UI 컴포넌트 라이브러리

**요구사항**: 빠른 프로토타이핑, 접근성, 커스터마이징 (MVP 우선)

**결정**: **shadcn/ui** (Radix UI + Tailwind CSS) ✅

**근거**:
- 복사-붙여넣기 방식 (의존성 최소화, 완전한 커스터마이징 가능)
- Radix UI 기반 (WAI-ARIA 준수, 키보드 네비게이션)
- Tailwind CSS로 일관된 디자인 시스템 유지
- TypeScript 네이티브 지원

**설치 명령어**:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button table form dialog
```

**대안**: Ant Design (한국 B2B 시장에서 검증됨), MUI (Material Design 선호 시)

### 6.3 테스트 프레임워크

**요구사항**: TDD, 90% 테스트 커버리지 (Constitution 원칙)

**결정**:
- **유닛 테스트**: **Vitest** (Jest 호환, Vite 기반으로 빠름)
- **E2E 테스트**: **Playwright** (크로스 브라우저, 안정적)

**근거**:
- Vitest는 Jest보다 10배 빠른 실행 속도 (ESM 네이티브)
- Playwright는 Cypress 대비 안정적인 대기 메커니즘, 병렬 실행 우수

**설치 명령어**:
```bash
# 백엔드 (NestJS)
npm install --save-dev vitest @vitest/ui

# 프론트엔드 (Next.js)
npm install --save-dev @playwright/test
```

**설정 예시** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
```

### 6.4 API 문서화

**요구사항**: OpenAPI 명세 자동 생성 (Phase 1 산출물)

**결정**: **@nestjs/swagger** ✅

**근거**:
- NestJS 데코레이터로 자동 OpenAPI 3.0 스펙 생성
- Swagger UI 내장 (개발 시 즉시 테스트 가능)
- DTO 스키마 자동 추출

**설치 명령어**:
```bash
npm install @nestjs/swagger
```

**설정 예시** (`main.ts`):
```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Pickup MaaS API')
    .setDescription('기관 차량 및 승객명단 관리 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
```

### 6.5 환경 변수 관리

**요구사항**: 개발/스테이징/프로덕션 환경 분리, 비밀키 보안

**결정**: **dotenv** + **@nestjs/config** ✅

**설정 예시** (`.env.example`):
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pickup_dev?schema=public"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="1d"

# File Upload
MAX_FILE_SIZE_MB=10

# Stage 2 준비
# KAFKA_BROKERS="localhost:9092"
# REDIS_URL="redis://localhost:6379"
```

**보안 주의사항**:
- `.env` 파일은 `.gitignore`에 추가 (커밋 금지)
- 프로덕션은 환경 변수 주입 (Docker secrets, AWS Secrets Manager 등)

---

## 7. 연구 결과 요약

| 분야 | 선택된 기술 | 주요 근거 |
|-----|-----------|---------|
| Excel 파싱 | **exceljs** | 스트리밍 지원, 타입스크립트 네이티브, 대용량 처리 대비 |
| PostgreSQL 최적화 | **복합 인덱스 + 트랜잭션** | N+1 쿼리 방지, 원자성 보장, 성능 목표 달성 |
| NestJS 구조 | **DDD Bounded Context** | 마이크로서비스 전환 대비, 모듈 독립성 확보 |
| 시간 계산 | **date-fns** | Tree-shaking, 함수형 프로그래밍, 테스트 용이성 |
| 상태 관리 | **React Query + Zustand** | 서버/클라이언트 상태 분리, Next.js 14 최적화 |
| 폼 검증 | **Zod + React Hook Form** | 풀스택 타입 안전성, 성능 우수 |
| UI 라이브러리 | **shadcn/ui** | 커스터마이징 자유도, 접근성, Tailwind 통합 |
| 테스트 | **Vitest + Playwright** | 빠른 실행 속도, 안정적 E2E |
| API 문서 | **@nestjs/swagger** | 자동 OpenAPI 생성, Swagger UI |

---

## 8. Next Steps

이 연구 문서는 **Phase 0**의 산출물입니다. 다음 단계는:

1. ✅ **Phase 0 완료**: 기술 스택 결정 (본 문서)
2. ⏭️ **Phase 1**: 상세 설계
   - `data-model.md` 생성 (완전한 Prisma 스키마, ERD)
   - `contracts/` 디렉토리에 OpenAPI YAML 명세 작성
   - `quickstart.md` 작성 (개발 환경 구축 가이드)
3. ⏭️ **Phase 2**: `tasks.md` 생성 (Epic/Story/Task 분해)
4. ⏭️ **Phase 3**: 구현 시작

**다음 명령어**: Phase 1 설계 문서 생성 시작

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Contributors**: Claude (Technical Research Agent)
