# Data Model: 차량 및 승객명단 관리 + 8시간 케어 검증

**Feature**: 001-fleet-roster-management (통합 구현)
**Created**: 2025-11-18
**Phase**: Phase 1 - Data Modeling
**Related Docs**: [spec.md](./spec.md), [research.md](./research.md)

---

## Table of Contents

1. [Entity Relationship Diagram (ERD)](#1-entity-relationship-diagram-erd)
2. [완전한 Prisma Schema](#2-완전한-prisma-schema)
3. [Entity 상세 설명](#3-entity-상세-설명)
4. [데이터 제약사항 및 규칙](#4-데이터-제약사항-및-규칙)
5. [마이그레이션 전략](#5-마이그레이션-전략)
6. [데이터 시드 전략](#6-데이터-시드-전략)

---

## 1. Entity Relationship Diagram (ERD)

### 1.1 ERD 다이어그램 (Mermaid)

```mermaid
erDiagram
    Institution ||--o{ Vehicle : "manages"
    Institution ||--o{ PassengerGroup : "owns"
    Institution ||--o| InstitutionType : "has type"

    Vehicle }o--|| PassengerGroup : "connected to (currentGroup)"

    PassengerGroup ||--o{ Passenger : "contains"

    Institution ||--o{ Passenger : "manages"

    Passenger ||--o| PassengerSchedule : "has schedule"

    Institution {
        uuid id PK
        string businessRegistrationNo UK "사업자등록번호 (10자리)"
        string name "기관명"
        uuid institutionTypeId FK "기관 유형"
        timestamp createdAt
        timestamp updatedAt
    }

    InstitutionType {
        uuid id PK
        string typeCode UK "유형 코드 (DAYCARE, GENERAL)"
        string typeName "유형명 (주간보호, 일반)"
        int minimumCareTimeHours "최소 케어 시간 (주간보호: 8, 일반: null)"
        timestamp createdAt
        timestamp updatedAt
    }

    Vehicle {
        uuid id PK
        string lastFourDigits "차량번호 뒤 4자리"
        int passengerCapacity "승객 정원 (5-15)"
        uuid institutionId FK
        uuid currentGroupId FK "현재 연결된 그룹"
        timestamp createdAt
        timestamp updatedAt
    }

    PassengerGroup {
        uuid id PK
        uuid institutionId FK
        string groupCode UK "그룹 코드 (기관 내 고유)"
        string name "그룹명"
        int totalPassengerCount "총 승객 수"
        timestamp createdAt
        timestamp updatedAt
    }

    Passenger {
        uuid id PK
        string name "승객 이름"
        string phoneNumber "연락처 (고유 식별자)"
        string pickupAddress "탑승지 주소"
        string dropoffAddress "하차지 주소"
        enum shuttleType "셔틀 유형 (MORNING, EVENING, TEMPORARY)"
        uuid institutionId FK
        uuid groupId FK "소속 그룹 (nullable)"
        timestamp createdAt
        timestamp updatedAt
    }

    PassengerSchedule {
        uuid id PK
        uuid passengerId FK UK "1:1 관계"
        string desiredPickupTime "희망 탑승 시간 (HH:MM)"
        string desiredDropoffTime "희망 하차 시간 (HH:MM)"
        float careTimeHours "케어 시간 간격 (시간 단위, 계산값)"
        boolean isCareTimeInsufficient "케어 시간 부족 여부"
        timestamp createdAt
        timestamp updatedAt
    }
```

### 1.2 관계 설명

| 관계 | Cardinality | 설명 | Cascade 동작 |
|-----|-------------|------|-------------|
| Institution ↔ InstitutionType | N:1 | 각 기관은 하나의 유형을 가짐 (주간보호 or 일반) | Restrict (유형 삭제 시 기관 먼저 삭제 필요) |
| Institution ↔ Vehicle | 1:N | 한 기관이 여러 차량 관리 | Cascade (기관 삭제 시 차량 삭제) |
| Institution ↔ PassengerGroup | 1:N | 한 기관이 여러 승객 그룹 관리 | Cascade (기관 삭제 시 그룹 삭제) |
| Institution ↔ Passenger | 1:N | 한 기관이 여러 승객 관리 | Cascade (기관 삭제 시 승객 삭제) |
| Vehicle ↔ PassengerGroup | N:1 | 여러 차량이 하나의 그룹에 연결 가능 (시간에 따라 변경) | SetNull (그룹 삭제 시 차량의 currentGroupId를 null로) |
| PassengerGroup ↔ Passenger | 1:N | 한 그룹이 여러 승객 포함 | SetNull (그룹 삭제 시 승객의 groupId를 null로) |
| Passenger ↔ PassengerSchedule | 1:0..1 | 승객은 최대 하나의 스케줄 보유 (Optional) | Cascade (승객 삭제 시 스케줄 삭제) |

---

## 2. 완전한 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// Institution Context
// ============================================================================

/// 기관 유형 (주간보호 시설, 일반 시설 등)
/// 002번 기능: 주간보호 시설은 8시간 케어 검증 필수
model InstitutionType {
  id                    String   @id @default(uuid())
  typeCode              String   @unique @db.VarChar(20)  // DAYCARE, GENERAL
  typeName              String   @db.VarChar(50)          // 주간보호, 일반
  minimumCareTimeHours  Int?                             // 주간보호: 8, 일반: null

  // Relations
  institutions          Institution[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@map("institution_types")
}

/// 기관 (재가장기요양기관 등)
/// B2B 서비스의 핵심 엔티티 - 사업자등록번호로 식별
model Institution {
  id                    String   @id @default(uuid())
  businessRegistrationNo String  @unique @db.VarChar(10)  // 사업자등록번호 (10자리, 하이픈 제거)
  name                  String   @db.VarChar(100)

  // 002번 기능: 기관 유형 연결
  institutionTypeId     String?
  institutionType       InstitutionType? @relation(fields: [institutionTypeId], references: [id], onDelete: Restrict)

  // Relations
  vehicles              Vehicle[]
  passengerGroups       PassengerGroup[]
  passengers            Passenger[]

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([businessRegistrationNo])
  @@index([institutionTypeId])
  @@map("institutions")
}

// ============================================================================
// Fleet Context
// ============================================================================

/// 차량 (5-15인승)
/// 차량번호 뒤 4자리로 식별 (기관 내 고유)
model Vehicle {
  id                String   @id @default(uuid())
  lastFourDigits    String   @db.VarChar(4)              // 차량번호 뒤 4자리 (예: "1234")
  passengerCapacity Int                                  // 승객 정원 (5-15)

  // Institution 관계
  institutionId     String
  institution       Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)

  // 현재 연결된 승객 그룹 (차량 교체 시 변경됨)
  currentGroupId    String?
  currentGroup      PassengerGroup? @relation(fields: [currentGroupId], references: [id], onDelete: SetNull)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([institutionId, lastFourDigits])  // 기관 내에서 차량번호 뒤 4자리 고유
  @@index([institutionId, currentGroupId])   // 기관별 차량-그룹 조회 최적화
  @@index([lastFourDigits])                  // 차량번호 검색
  @@map("vehicles")
}

// ============================================================================
// Roster Context
// ============================================================================

/// 승객 그룹 (차량 교체 시 지속성 보장)
/// FR-024~031: 그룹 코드로 승객들을 묶어 관리
model PassengerGroup {
  id                   String   @id @default(uuid())
  institutionId        String
  institution          Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)

  groupCode            String   @db.VarChar(20)         // 그룹 코드 (예: "GRP-001")
  name                 String   @db.VarChar(100)        // 그룹명 (예: "오전 A조")
  totalPassengerCount  Int      @default(0)             // 총 승객 수 (캐싱 값)

  // Relations
  passengers           Passenger[]
  vehicles             Vehicle[]                        // 이 그룹에 연결된 차량들

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@unique([institutionId, groupCode])  // 기관 내에서 그룹 코드 고유
  @@index([institutionId, groupCode])   // 기관 내 그룹 검색
  @@map("passenger_groups")
}

/// 승객 (셔틀 서비스 이용자)
/// 연락처를 고유 식별자로 사용 (기관 내 중복 불가)
model Passenger {
  id              String   @id @default(uuid())
  name            String   @db.VarChar(50)
  phoneNumber     String   @db.VarChar(15)              // 하이픈 제거된 전화번호 (01012345678)
  pickupAddress   String   @db.VarChar(200)             // 탑승지 주소
  dropoffAddress  String   @db.VarChar(200)             // 하차지 주소
  shuttleType     ShuttleType                           // 셔틀 유형 (MORNING, EVENING, TEMPORARY)

  // Institution 관계
  institutionId   String
  institution     Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)

  // PassengerGroup 관계 (Optional)
  groupId         String?
  group           PassengerGroup? @relation(fields: [groupId], references: [id], onDelete: SetNull)

  // 002번 기능: 케어 시간 정보 (1:1 관계, Optional)
  schedule        PassengerSchedule?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([institutionId, phoneNumber])   // 기관 내에서 연락처 고유
  @@index([institutionId, shuttleType])    // 기관별 셔틀 유형 필터링
  @@index([institutionId, name])           // 기관 내 이름 검색
  @@index([groupId])                       // 그룹별 승객 조회
  @@map("passengers")
}

/// 셔틀 유형 Enum
enum ShuttleType {
  MORNING    // 오전 셔틀 (여러 탑승지 → 기관)
  EVENING    // 오후 셔틀 (기관 → 여러 하차지)
  TEMPORARY  // 임시 셔틀 (동적 요청)

  @@map("shuttle_type")
}

/// 승객 스케줄 (002번 기능: 8시간 케어 검증)
/// 주간보호 시설 승객의 희망 탑승/하차 시간 관리
model PassengerSchedule {
  id                     String   @id @default(uuid())
  passengerId            String   @unique                // 1:1 관계
  passenger              Passenger @relation(fields: [passengerId], references: [id], onDelete: Cascade)

  desiredPickupTime      String   @db.VarChar(5)         // HH:MM 형식 (예: "09:00")
  desiredDropoffTime     String   @db.VarChar(5)         // HH:MM 형식 (예: "17:30")

  // 계산 값 (캐싱)
  careTimeHours          Float                           // 케어 시간 간격 (시간 단위, 예: 8.5)
  isCareTimeInsufficient Boolean  @default(false)        // 8시간 미만 여부 (경고 플래그)

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  @@index([isCareTimeInsufficient])  // 케어 시간 부족 승객 필터링
  @@index([passengerId])             // 1:1이지만 조회 최적화
  @@map("passenger_schedules")
}

// ============================================================================
// Future Extensions (Stage 2/3 - Commented Out)
// ============================================================================

// /// 운행 기록 (Stage 2: BI 대시보드용)
// model Trip {
//   id              String   @id @default(uuid())
//   vehicleId       String
//   vehicle         Vehicle @relation(fields: [vehicleId], references: [id])
//
//   driverId        String   // User Context 연동
//   startTime       DateTime
//   endTime         DateTime?
//   totalDistance   Float?   // km
//
//   createdAt       DateTime @default(now())
//   updatedAt       DateTime @updatedAt
//
//   @@index([vehicleId, startTime])
//   @@map("trips")
// }

// /// 탑승 기록 (Stage 3: 자동 체크인)
// model BoardingRecord {
//   id              String   @id @default(uuid())
//   passengerId     String
//   passenger       Passenger @relation(fields: [passengerId], references: [id])
//   tripId          String
//   trip            Trip @relation(fields: [tripId], references: [id])
//
//   boardedAt       DateTime
//   alightedAt      DateTime?
//   checkInMethod   CheckInMethod  // MANUAL, QR, NFC, BLE
//
//   createdAt       DateTime @default(now())
//
//   @@index([passengerId, tripId])
//   @@map("boarding_records")
// }

// enum CheckInMethod {
//   MANUAL
//   QR
//   NFC
//   BLE
// }
```

---

## 3. Entity 상세 설명

### 3.1 InstitutionType (기관 유형)

**목적**: 기관을 주간보호 시설과 일반 시설로 구분하여 케어 시간 검증 규칙 적용

**필드**:
- `typeCode`: 유형 코드 (DAYCARE, GENERAL 등) - 비즈니스 키
- `typeName`: 사용자 친화적 이름 (주간보호, 일반)
- `minimumCareTimeHours`: 주간보호는 8, 일반은 null (검증 불필요)

**기본 데이터** (Seed 필요):
```typescript
const institutionTypes = [
  { typeCode: 'DAYCARE', typeName: '주간보호', minimumCareTimeHours: 8 },
  { typeCode: 'GENERAL', typeName: '일반', minimumCareTimeHours: null },
];
```

**비즈니스 규칙**:
- 시스템 전체에 2개의 기본 유형만 존재 (확장 가능)
- 기관 생성 시 유형 선택 필수 (FR-011)
- 유형 삭제 시 연결된 기관이 있으면 제한 (onDelete: Restrict)

### 3.2 Institution (기관)

**목적**: B2B 서비스의 고객사, 모든 엔티티의 루트

**필드**:
- `businessRegistrationNo`: 사업자등록번호 10자리 (하이픈 제거) - 법적 고유 식별자
- `name`: 기관명 (예: "서울 재가요양센터")
- `institutionTypeId`: 기관 유형 (주간보호 or 일반)

**비즈니스 규칙**:
- 사업자등록번호는 전국적으로 고유 (정부 발급)
- 기관 삭제 시 모든 하위 엔티티 CASCADE 삭제 (차량, 그룹, 승객)
- Soft Delete는 Stage 2에서 고려 (감사 추적 필요 시)

**검증 로직**:
```typescript
// 사업자등록번호 검증 (Luhn 알고리즘)
function validateBusinessRegistrationNo(brn: string): boolean {
  if (!/^\d{10}$/.test(brn)) return false;

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  const digits = brn.split('').map(Number);
  const checksum = digits.slice(0, 9).reduce((sum, digit, i) => sum + digit * weights[i], 0);
  const calculatedCheckDigit = (10 - (checksum % 10)) % 10;

  return calculatedCheckDigit === digits[9];
}
```

### 3.3 Vehicle (차량)

**목적**: 기관이 운영하는 5-15인승 차량 관리

**필드**:
- `lastFourDigits`: 차량번호 뒤 4자리 (예: "1234") - 사용자 친화적 식별
- `passengerCapacity`: 승객 정원 (5-15 범위 검증 필요)
- `currentGroupId`: 현재 연결된 승객 그룹 (차량 교체 시 변경됨)

**비즈니스 규칙**:
- 차량번호 뒤 4자리는 기관 내에서 고유 (@@unique 제약)
- 승객 정원은 5-15 사이여야 함 (DTO 검증)
- 차량 삭제 시 연결된 그룹은 유지 (currentGroupId만 null로)
- 그룹 삭제 시 차량의 currentGroupId는 SetNull

**차량 교체 시나리오** (FR-013, FR-031):
1. 기존 차량 삭제 (또는 Soft Delete)
2. 새 차량 생성
3. 새 차량의 currentGroupId를 기존 그룹으로 설정
4. 승객들은 자동으로 새 차량에 연결됨 (그룹을 통해)

### 3.4 PassengerGroup (승객 그룹)

**목적**: 차량 교체 시에도 승객 관계 유지를 위한 중간 추상화

**필드**:
- `groupCode`: 그룹 코드 (기관 내 고유, 예: "GRP-001", "오전A조")
- `name`: 사용자 친화적 그룹명
- `totalPassengerCount`: 총 승객 수 (캐싱 값, 조회 성능 최적화)

**비즈니스 규칙**:
- 그룹 코드는 기관 내에서 고유 (@@unique 제약)
- 그룹 생성 시 최소 1명 이상의 승객 필요 (FR-024)
- 그룹 삭제 시 승객의 groupId는 SetNull (승객 유지)
- totalPassengerCount는 승객 추가/삭제 시 자동 업데이트

**그룹 생성 시나리오** (FR-024~026):
1. 승객 목록에서 여러 승객 선택
2. 그룹 코드 및 이름 입력
3. 트랜잭션으로 그룹 생성 + 승객들의 groupId 업데이트
4. totalPassengerCount 자동 계산

### 3.5 Passenger (승객)

**목적**: 셔틀 서비스 이용자 정보 관리

**필드**:
- `name`: 승객 이름
- `phoneNumber`: 연락처 (하이픈 제거, 기관 내 고유 식별자)
- `pickupAddress`, `dropoffAddress`: 탑승지/하차지 주소
- `shuttleType`: 셔틀 유형 (MORNING, EVENING, TEMPORARY)
- `groupId`: 소속 그룹 (Optional, 차량 교체 시 지속성 보장)

**비즈니스 규칙**:
- 연락처는 기관 내에서 고유 (@@unique 제약)
- 탑승지와 하차지는 서로 달라야 함 (도메인 로직 검증)
- 그룹 할당은 선택적 (그룹 없이도 승객 등록 가능)
- 승객 삭제 시 PassengerSchedule도 CASCADE 삭제

**연락처 정규화**:
```typescript
// 010-1234-5678 → 01012345678
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/-/g, '');
}

// 저장된 번호를 표시용으로 변환
function formatPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
}
```

### 3.6 ShuttleType (셔틀 유형 Enum)

**값**:
- `MORNING`: 오전 셔틀 (여러 탑승지 → 기관)
- `EVENING`: 오후 셔틀 (기관 → 여러 하차지)
- `TEMPORARY`: 임시 셔틀 (동적 요청, Stage 2)

**비즈니스 규칙**:
- 하나의 승객은 하나의 셔틀 유형만 가짐
- 필터링 시 자주 사용 (@@index 필요)

### 3.7 PassengerSchedule (승객 스케줄)

**목적**: 주간보호 시설 승객의 8시간 케어 검증 (002번 기능)

**필드**:
- `desiredPickupTime`, `desiredDropoffTime`: HH:MM 형식 (예: "09:00", "17:30")
- `careTimeHours`: 케어 시간 간격 (시간 단위, 계산값)
- `isCareTimeInsufficient`: 8시간 미만 여부 (경고 플래그)

**비즈니스 규칙**:
- Passenger와 1:1 관계 (passengerId가 UNIQUE)
- 주간보호 기관의 승객만 필수, 일반 기관은 Optional
- 탑승 시간 < 하차 시간 (같은 날 기준, 자정 넘어가는 케이스는 Out of Scope)
- careTimeHours와 isCareTimeInsufficient는 자동 계산 (도메인 서비스)

**자동 계산 로직**:
```typescript
// 002-FR-007: 케어 시간 간격 계산
function calculateCareTimeHours(pickupTime: string, dropoffTime: string): number {
  const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number);
  const [dropoffHour, dropoffMinute] = dropoffTime.split(':').map(Number);

  const pickupMinutes = pickupHour * 60 + pickupMinute;
  const dropoffMinutes = dropoffHour * 60 + dropoffMinute;

  const diffMinutes = dropoffMinutes - pickupMinutes;

  if (diffMinutes < 0) {
    throw new Error('하차 시간은 탑승 시간 이후여야 합니다');
  }

  return diffMinutes / 60; // 시간 단위 변환
}

// 002-FR-008: 8시간 검증
function isCareTimeSufficient(careTimeHours: number, institutionType: InstitutionType): boolean {
  if (!institutionType.minimumCareTimeHours) return true; // 일반 기관은 검증 안 함
  return careTimeHours >= institutionType.minimumCareTimeHours;
}
```

---

## 4. 데이터 제약사항 및 규칙

### 4.1 UNIQUE 제약

| 엔티티 | 컬럼 | 범위 | 근거 |
|-------|------|------|------|
| InstitutionType | typeCode | 전역 | 시스템 전체에서 유형 코드 고유 |
| Institution | businessRegistrationNo | 전역 | 정부 발급 사업자등록번호 고유 |
| Vehicle | lastFourDigits | 기관 내 | 같은 기관 내에서 차량번호 뒤 4자리 고유 |
| PassengerGroup | groupCode | 기관 내 | 같은 기관 내에서 그룹 코드 고유 |
| Passenger | phoneNumber | 기관 내 | 같은 기관 내에서 연락처 고유 |
| PassengerSchedule | passengerId | 전역 | 1:1 관계 보장 |

### 4.2 NOT NULL 제약

**모든 엔티티 공통**:
- `id`, `createdAt`, `updatedAt`: 항상 NOT NULL

**Optional 필드** (nullable):
- `Institution.institutionTypeId`: 기관 유형 미설정 가능 (기본값 없음)
- `InstitutionType.minimumCareTimeHours`: 일반 기관은 null
- `Vehicle.currentGroupId`: 그룹 미연결 가능
- `Passenger.groupId`: 그룹 미소속 가능
- `Passenger.schedule`: PassengerSchedule이 없을 수 있음 (일반 기관 승객)

### 4.3 CHECK 제약 (Application Level)

**Prisma는 CHECK 제약을 지원하지 않으므로 DTO 검증으로 구현**:

```typescript
// 차량 정원 검증
@Min(5, { message: '승객 정원은 최소 5명이어야 합니다' })
@Max(15, { message: '승객 정원은 최대 15명이어야 합니다' })
passengerCapacity: number;

// 시간 형식 검증
@Matches(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, {
  message: '시간은 HH:MM 형식이어야 합니다 (예: 09:00)',
})
desiredPickupTime: string;

// 탑승지 ≠ 하차지 검증 (커스텀 밸리데이터)
@Validate(AddressNotEqualConstraint)
addresses: { pickup: string; dropoff: string };
```

### 4.4 인덱스 전략 요약

| 엔티티 | 인덱스 | 타입 | 목적 |
|-------|-------|------|------|
| Institution | businessRegistrationNo | UNIQUE | 기관 조회 (로그인 시) |
| Institution | institutionTypeId | INDEX | 유형별 기관 필터링 |
| Vehicle | [institutionId, lastFourDigits] | UNIQUE | 기관 내 차량 고유성 |
| Vehicle | [institutionId, currentGroupId] | INDEX | 기관별 차량-그룹 조회 |
| Vehicle | lastFourDigits | INDEX | 차량번호 검색 |
| PassengerGroup | [institutionId, groupCode] | UNIQUE | 기관 내 그룹 고유성 |
| PassengerGroup | [institutionId, groupCode] | INDEX | 그룹 검색 최적화 |
| Passenger | [institutionId, phoneNumber] | UNIQUE | 기관 내 연락처 고유성 |
| Passenger | [institutionId, shuttleType] | INDEX | 셔틀 유형 필터링 |
| Passenger | [institutionId, name] | INDEX | 이름 검색 (부분 일치) |
| Passenger | groupId | INDEX | 그룹별 승객 조회 |
| PassengerSchedule | isCareTimeInsufficient | INDEX | 케어 시간 부족 필터링 |
| PassengerSchedule | passengerId | UNIQUE | 1:1 관계 보장 |

---

## 5. 마이그레이션 전략

### 5.1 초기 마이그레이션 (MVP)

**순서** (외래 키 의존성 고려):
1. `InstitutionType` (독립 엔티티)
2. `Institution` (InstitutionType에 의존)
3. `PassengerGroup` (Institution에 의존)
4. `Vehicle` (Institution, PassengerGroup에 의존)
5. `Passenger` (Institution, PassengerGroup에 의존)
6. `PassengerSchedule` (Passenger에 의존)

**명령어**:
```bash
# 1. Prisma 스키마 기반 마이그레이션 파일 생성
npx prisma migrate dev --name init

# 2. 마이그레이션 적용
npx prisma migrate deploy

# 3. Prisma Client 재생성
npx prisma generate
```

### 5.2 마이그레이션 파일 예시

```sql
-- migrations/20250118_init/migration.sql

-- CreateEnum
CREATE TYPE "shuttle_type" AS ENUM ('MORNING', 'EVENING', 'TEMPORARY');

-- CreateTable
CREATE TABLE "institution_types" (
    "id" TEXT NOT NULL,
    "typeCode" VARCHAR(20) NOT NULL,
    "typeName" VARCHAR(50) NOT NULL,
    "minimumCareTimeHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institution_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "businessRegistrationNo" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "institutionTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passenger_groups" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "groupCode" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "totalPassengerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passenger_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "lastFourDigits" VARCHAR(4) NOT NULL,
    "passengerCapacity" INTEGER NOT NULL,
    "institutionId" TEXT NOT NULL,
    "currentGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passengers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "phoneNumber" VARCHAR(15) NOT NULL,
    "pickupAddress" VARCHAR(200) NOT NULL,
    "dropoffAddress" VARCHAR(200) NOT NULL,
    "shuttleType" "shuttle_type" NOT NULL,
    "institutionId" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passenger_schedules" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "desiredPickupTime" VARCHAR(5) NOT NULL,
    "desiredDropoffTime" VARCHAR(5) NOT NULL,
    "careTimeHours" DOUBLE PRECISION NOT NULL,
    "isCareTimeInsufficient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passenger_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "institution_types_typeCode_key" ON "institution_types"("typeCode");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_businessRegistrationNo_key" ON "institutions"("businessRegistrationNo");
CREATE INDEX "institutions_businessRegistrationNo_idx" ON "institutions"("businessRegistrationNo");
CREATE INDEX "institutions_institutionTypeId_idx" ON "institutions"("institutionTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "passenger_groups_institutionId_groupCode_key" ON "passenger_groups"("institutionId", "groupCode");
CREATE INDEX "passenger_groups_institutionId_groupCode_idx" ON "passenger_groups"("institutionId", "groupCode");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_institutionId_lastFourDigits_key" ON "vehicles"("institutionId", "lastFourDigits");
CREATE INDEX "vehicles_institutionId_currentGroupId_idx" ON "vehicles"("institutionId", "currentGroupId");
CREATE INDEX "vehicles_lastFourDigits_idx" ON "vehicles"("lastFourDigits");

-- CreateIndex
CREATE UNIQUE INDEX "passengers_institutionId_phoneNumber_key" ON "passengers"("institutionId", "phoneNumber");
CREATE INDEX "passengers_institutionId_shuttleType_idx" ON "passengers"("institutionId", "shuttleType");
CREATE INDEX "passengers_institutionId_name_idx" ON "passengers"("institutionId", "name");
CREATE INDEX "passengers_groupId_idx" ON "passengers"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "passenger_schedules_passengerId_key" ON "passenger_schedules"("passengerId");
CREATE INDEX "passenger_schedules_isCareTimeInsufficient_idx" ON "passenger_schedules"("isCareTimeInsufficient");
CREATE INDEX "passenger_schedules_passengerId_idx" ON "passenger_schedules"("passengerId");

-- AddForeignKey
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_institutionTypeId_fkey"
    FOREIGN KEY ("institutionTypeId") REFERENCES "institution_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_groups" ADD CONSTRAINT "passenger_groups_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_currentGroupId_fkey"
    FOREIGN KEY ("currentGroupId") REFERENCES "passenger_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "passenger_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passenger_schedules" ADD CONSTRAINT "passenger_schedules_passengerId_fkey"
    FOREIGN KEY ("passengerId") REFERENCES "passengers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 5.3 롤백 전략

```bash
# 마지막 마이그레이션 롤백
npx prisma migrate resolve --rolled-back <migration_name>

# 특정 마이그레이션까지 롤백 (수동)
psql -U username -d pickup_dev -f migrations/<target_migration>/migration.sql
```

**주의사항**:
- 프로덕션 환경에서는 롤백 스크립트 사전 준비 필수
- 데이터 손실 가능성 있으므로 백업 필수

---

## 6. 데이터 시드 전략

### 6.1 시드 데이터 범위

**필수 시드** (시스템 동작 필수):
1. `InstitutionType`: DAYCARE, GENERAL

**개발 환경 시드** (로컬 테스트용):
2. `Institution`: 샘플 기관 3개 (주간보호 2개, 일반 1개)
3. `Vehicle`: 각 기관당 차량 2대
4. `PassengerGroup`: 각 기관당 그룹 2개
5. `Passenger`: 각 기관당 승객 20명 (일부는 스케줄 포함)
6. `PassengerSchedule`: 주간보호 기관 승객의 50%에 스케줄 추가

### 6.2 시드 스크립트

```typescript
// prisma/seed.ts
import { PrismaClient, ShuttleType } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/ko'; // 한국어 faker

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. InstitutionType 생성
  const institutionTypes = await Promise.all([
    prisma.institutionType.upsert({
      where: { typeCode: 'DAYCARE' },
      update: {},
      create: {
        typeCode: 'DAYCARE',
        typeName: '주간보호',
        minimumCareTimeHours: 8,
      },
    }),
    prisma.institutionType.upsert({
      where: { typeCode: 'GENERAL' },
      update: {},
      create: {
        typeCode: 'GENERAL',
        typeName: '일반',
        minimumCareTimeHours: null,
      },
    }),
  ]);

  console.log('✅ InstitutionTypes created:', institutionTypes.length);

  // 2. Institution 생성
  const institutions = await Promise.all([
    prisma.institution.upsert({
      where: { businessRegistrationNo: '1234567890' },
      update: {},
      create: {
        businessRegistrationNo: '1234567890',
        name: '서울 주간보호센터',
        institutionTypeId: institutionTypes[0].id, // DAYCARE
      },
    }),
    prisma.institution.upsert({
      where: { businessRegistrationNo: '2345678901' },
      update: {},
      create: {
        businessRegistrationNo: '2345678901',
        name: '부산 재가요양센터',
        institutionTypeId: institutionTypes[0].id, // DAYCARE
      },
    }),
    prisma.institution.upsert({
      where: { businessRegistrationNo: '3456789012' },
      update: {},
      create: {
        businessRegistrationNo: '3456789012',
        name: '대전 요양원',
        institutionTypeId: institutionTypes[1].id, // GENERAL
      },
    }),
  ]);

  console.log('✅ Institutions created:', institutions.length);

  // 3. PassengerGroup 생성
  const groups: any[] = [];
  for (const institution of institutions) {
    const group1 = await prisma.passengerGroup.create({
      data: {
        institutionId: institution.id,
        groupCode: `${institution.name.substring(0, 2)}-A`,
        name: '오전 A조',
        totalPassengerCount: 0,
      },
    });

    const group2 = await prisma.passengerGroup.create({
      data: {
        institutionId: institution.id,
        groupCode: `${institution.name.substring(0, 2)}-B`,
        name: '오후 B조',
        totalPassengerCount: 0,
      },
    });

    groups.push(group1, group2);
  }

  console.log('✅ PassengerGroups created:', groups.length);

  // 4. Vehicle 생성 (그룹에 연결)
  for (const institution of institutions) {
    const institutionGroups = groups.filter(g => g.institutionId === institution.id);

    await prisma.vehicle.create({
      data: {
        lastFourDigits: faker.string.numeric(4),
        passengerCapacity: faker.number.int({ min: 5, max: 15 }),
        institutionId: institution.id,
        currentGroupId: institutionGroups[0].id,
      },
    });

    await prisma.vehicle.create({
      data: {
        lastFourDigits: faker.string.numeric(4),
        passengerCapacity: faker.number.int({ min: 5, max: 15 }),
        institutionId: institution.id,
        currentGroupId: institutionGroups[1].id,
      },
    });
  }

  console.log('✅ Vehicles created');

  // 5. Passenger 생성 (주간보호 기관은 스케줄 포함)
  for (const institution of institutions) {
    const institutionGroups = groups.filter(g => g.institutionId === institution.id);
    const isDaycare = institution.institutionTypeId === institutionTypes[0].id;

    for (let i = 0; i < 20; i++) {
      const group = faker.helpers.arrayElement(institutionGroups);
      const shuttleType = faker.helpers.arrayElement([
        ShuttleType.MORNING,
        ShuttleType.EVENING,
      ]);

      const passenger = await prisma.passenger.create({
        data: {
          name: faker.person.fullName(),
          phoneNumber: `010${faker.string.numeric(8)}`,
          pickupAddress: faker.location.streetAddress(),
          dropoffAddress: faker.location.streetAddress(),
          shuttleType,
          institutionId: institution.id,
          groupId: group.id,
        },
      });

      // 주간보호 기관의 50% 승객에게 스케줄 추가
      if (isDaycare && Math.random() > 0.5) {
        const pickupHour = faker.number.int({ min: 7, max: 10 });
        const dropoffHour = faker.number.int({ min: 15, max: 19 });
        const pickupTime = `${String(pickupHour).padStart(2, '0')}:00`;
        const dropoffTime = `${String(dropoffHour).padStart(2, '0')}:00`;

        const careTimeHours = dropoffHour - pickupHour;
        const isCareTimeInsufficient = careTimeHours < 8;

        await prisma.passengerSchedule.create({
          data: {
            passengerId: passenger.id,
            desiredPickupTime: pickupTime,
            desiredDropoffTime: dropoffTime,
            careTimeHours,
            isCareTimeInsufficient,
          },
        });
      }
    }

    // totalPassengerCount 업데이트
    for (const group of institutionGroups) {
      const count = await prisma.passenger.count({
        where: { groupId: group.id },
      });

      await prisma.passengerGroup.update({
        where: { id: group.id },
        data: { totalPassengerCount: count },
      });
    }
  }

  console.log('✅ Passengers and Schedules created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**실행 명령어**:
```bash
# package.json에 추가
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}

# 시드 실행
npx prisma db seed
```

### 6.3 시드 데이터 검증

```sql
-- 시드 데이터 확인
SELECT
  (SELECT COUNT(*) FROM institution_types) AS institution_types_count,
  (SELECT COUNT(*) FROM institutions) AS institutions_count,
  (SELECT COUNT(*) FROM passenger_groups) AS groups_count,
  (SELECT COUNT(*) FROM vehicles) AS vehicles_count,
  (SELECT COUNT(*) FROM passengers) AS passengers_count,
  (SELECT COUNT(*) FROM passenger_schedules) AS schedules_count;

-- 케어 시간 부족 승객 확인 (002번 기능 검증)
SELECT
  i.name AS institution_name,
  p.name AS passenger_name,
  ps.desiredPickupTime,
  ps.desiredDropoffTime,
  ps.careTimeHours,
  ps.isCareTimeInsufficient
FROM passenger_schedules ps
JOIN passengers p ON ps.passengerId = p.id
JOIN institutions i ON p.institutionId = i.id
WHERE ps.isCareTimeInsufficient = true;
```

---

## 7. 추가 고려사항

### 7.1 Soft Delete 마이그레이션 (Stage 2)

**변경사항**:
```prisma
model Vehicle {
  // ... 기존 필드
  deletedAt DateTime? // Soft Delete 타임스탬프
}

model Passenger {
  // ... 기존 필드
  deletedAt DateTime?
}
```

**쿼리 수정**:
```typescript
// 삭제되지 않은 차량만 조회
const vehicles = await prisma.vehicle.findMany({
  where: {
    institutionId,
    deletedAt: null, // Soft Delete 필터
  },
});

// Soft Delete 수행
await prisma.vehicle.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

### 7.2 Full-Text Search 인덱스 (Stage 2)

**PostgreSQL GIN 인덱스 추가**:
```sql
-- 승객 이름 Full-Text Search
CREATE INDEX idx_passenger_name_fts
ON passengers USING GIN (to_tsvector('korean', name));

-- 주소 Full-Text Search
CREATE INDEX idx_passenger_address_fts
ON passengers USING GIN (to_tsvector('korean', pickupAddress || ' ' || dropoffAddress));
```

**Prisma 원시 쿼리 활용**:
```typescript
const passengers = await prisma.$queryRaw`
  SELECT * FROM passengers
  WHERE institutionId = ${institutionId}
  AND to_tsvector('korean', name) @@ to_tsquery('korean', ${keyword})
`;
```

### 7.3 Read Replica 설정 (Stage 3)

**Prisma 멀티 데이터소스**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Write (Primary)
}

// Read Replica (Prisma 5.0+에서 지원 예정)
// datasource dbReplica {
//   provider = "postgresql"
//   url      = env("DATABASE_REPLICA_URL")
// }
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Next Steps**: Create OpenAPI contracts and quickstart guide (Phase 1 계속)
