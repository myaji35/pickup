# Implementation Plan: 통합 차량/승객 관리 및 8시간 케어 검증

**Branch**: `001-fleet-roster-management` | **Date**: 2025-11-18 | **Spec**: [001-spec](./spec.md) + [002-spec](../002-daycare-8hour-validation/spec.md)
**Input**: 두 개의 feature specification을 통합한 구현 계획
- Feature 001: 기관 차량 및 승객명단 관리
- Feature 002: 주간보호 8시간 케어 스케줄 검증

## Summary

이 구현 계획은 **B2B 송영(셔틀) MaaS 플랫폼의 핵심 관리 기능 2개를 통합**하여 설계합니다:

**001번 기능 (차량/승객/그룹 관리)**:
- 기관 관리자가 운행 차량, 승객, 승객 그룹을 관리
- 승객 그룹 개념을 통한 효율적인 차량 교체 시나리오 지원
- 엑셀 일괄 업로드로 대규모 승객 등록 지원

**002번 기능 (8시간 케어 검증)**:
- 재가장기요양기관 주간보호 서비스의 법적 8시간 케어 요건 검증
- 기관 유형별 케어 시간 규칙 설정
- 케어 시간 준수 현황 모니터링 및 리포트

**통합 설계 포인트**:
- `Passenger` 엔티티 확장: 001번의 기본 정보 + 002번의 시간 정보
- `Institution` 엔티티 확장: 기관 유형 설정 추가
- 단일 관리자 포털에서 모든 기능 통합 제공
- RESTful API 설계로 향후 확장성 보장

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20.x LTS)
**Primary Dependencies**:
- Backend: NestJS (API), Prisma (ORM), class-validator (검증)
- Frontend: Next.js 14 (App Router), React 18, TailwindCSS
- File Processing: xlsx (엑셀 파싱)

**Storage**: PostgreSQL 15+ (관계형 데이터, 트랜잭션 지원 필수)
**Testing**: Jest (단위/통합), Playwright (E2E)
**Target Platform**:
- Backend: Linux 서버 (Docker 컨테이너)
- Frontend: 웹 브라우저 (Chrome, Safari, Edge 최신 2버전)

**Project Type**: Web application (Backend API + Frontend Admin Portal)

**Performance Goals**:
- API 응답 시간: 평균 200ms 이하 (p95 < 500ms)
- 승객 목록 조회 (100명): 3초 이내
- 엑셀 업로드 (50명): 5분 이내 (검증 포함)

**Constraints**:
- 엑셀 파일: 최대 5MB, 최대 1000행
- 동시 접속 사용자: 100명 (초기 MVP 기준)
- 트랜잭션 무결성: ACID 보장 (승객-그룹 배정, 차량-그룹 연결)

**Scale/Scope**:
- 초기 목표: 기관 10개, 차량 100대, 승객 1000명
- API 엔드포인트: 약 30개
- 데이터베이스 테이블: 8개

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Pass: 마이크로서비스 우선 (Microservices-First)

**현재 평가**: ⚠️ 부분 위반 (초기 단계 면제)

**근거**:
- 001번과 002번 기능은 동일한 Admin Portal 내에서 구현 (단일 모놀리스)
- Constitution은 "모든 기능은 마이크로서비스로 설계"를 요구하지만, **Stage 1 (MVP)에서는 고정 경로 허용**
- 현재는 MVP 단계이므로 모놀리스로 시작하되, 다음 조건 준수:
  - **Bounded Context 명확화**: Institution, Fleet, Roster를 별도 모듈로 분리
  - **데이터베이스 스키마 분리 가능성 확보**: 각 Context별 테이블 접두사 사용
  - **API 설계 시 서비스 경계 준수**: RESTful 리소스 기반 엔드포인트

**향후 마이그레이션 계획**:
- Stage 2에서 VRP 엔진 도입 시 Route Context를 별도 마이크로서비스로 분리
- API Gateway 도입 및 Kafka 이벤트 스트림 구축

**정당화**: MVP에서 빠른 검증을 위해 모놀리스로 시작하되, 마이크로서비스 전환을 고려한 설계 적용

### ✅ Pass: 테스트 우선 개발 (Test-First Development)

**준수 계획**:
- TDD 강제: 모든 비즈니스 로직은 테스트 먼저 작성
- 단위 테스트 커버리지: 90% 이상 (핵심 로직)
- 통합 테스트: API 엔드포인트, 데이터베이스 트랜잭션 검증
- E2E 테스트: 주요 사용자 시나리오 (차량 등록, 승객 업로드, 8시간 검증)

**테스트 전략**:
```
1. Red: 실패하는 테스트 작성 (요구사항 기반)
2. Green: 최소한의 코드로 테스트 통과
3. Refactor: 코드 품질 개선 (테스트 유지)
```

### ⚠️ 조건부 Pass: AI 기반 최적화 중심 (AI-Driven Optimization)

**현재 평가**: ⚠️ Out of Scope (Stage 1 제외)

**근거**:
- Constitution은 "AI VRP 엔진 필수"를 요구하지만, **Stage 1 (MVP)은 고정 경로 허용**
- 001번/002번 기능은 모두 차량/승객 **관리** 기능이며, 경로 최적화는 별도 기능 (Out of Scope)
- 현재 설계는 Stage 2의 VRP 엔진 통합을 위한 데이터 구조 준비
  - `Passenger Group` 개념: VRP 입력 데이터 그룹핑
  - `Passenger` 테이블에 `pickupAddress`, `dropoffAddress` 저장: VRP 노드 정보

**정당화**: MVP는 관리 기능에 집중하며, Stage 2에서 VRP 엔진 도입 예정

### ✅ Pass: 실시간 데이터 파이프라인 신뢰성 (Real-time Data Pipeline Reliability)

**현재 평가**: ✅ Out of Scope (이 기능에서는 해당 없음)

**근거**:
- GPS 트래킹, 차량 텔레메트리는 별도 기능 (Out of Scope)
- 현재 기능은 정적 데이터 관리 (차량 등록, 승객 명단)
- 향후 연동 준비: `Vehicle`, `Passenger` 테이블은 Fleet/Roster Context로 분리 가능

### ✅ Pass: 관측 가능성 및 투명성 (Observability & Transparency)

**준수 계획**:
- 구조화된 로깅: NestJS Logger (JSON 포맷)
- 주요 이벤트 로깅:
  - 차량 등록/삭제/수정
  - 승객 그룹 생성/차량 연결
  - 엑셀 업로드 성공/실패 (행 번호별 오류)
  - 8시간 케어 검증 경고/실패
- 감사 추적: 모든 CUD 작업에 `createdAt`, `updatedAt`, `createdBy` 기록

### 종합 평가

**Status**: ✅ 조건부 통과

**조건**:
1. Bounded Context 분리 (모듈 구조)
2. TDD 강제 (테스트 먼저 작성)
3. 구조화된 로깅 및 감사 추적
4. Stage 2 마이그레이션 계획 문서화

## Project Structure

### Documentation (this feature)

```text
specs/001-fleet-roster-management/
├── plan.md              # 이 파일 (통합 구현 계획)
├── research.md          # Phase 0: 기술 조사 결과
├── data-model.md        # Phase 1: 통합 데이터 모델
├── quickstart.md        # Phase 1: 개발 환경 설정
├── contracts/           # Phase 1: API 계약 (OpenAPI)
│   ├── openapi.yaml     # RESTful API 명세
│   ├── vehicles.yaml    # 차량 API
│   ├── passengers.yaml  # 승객 API
│   ├── groups.yaml      # 승객 그룹 API
│   └── institutions.yaml # 기관 유형 API
└── tasks.md             # Phase 2: 구현 작업 분해 (/speckit.tasks)
```

### Source Code (repository root)

```text
# Web application 구조 (Backend API + Frontend Admin Portal)

backend/
├── src/
│   ├── contexts/                    # Bounded Contexts (DDD)
│   │   ├── institution/             # Institution Context
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── institution.entity.ts
│   │   │   │   │   └── institution-type.entity.ts
│   │   │   │   └── value-objects/
│   │   │   ├── application/
│   │   │   │   ├── services/
│   │   │   │   │   └── institution-type.service.ts
│   │   │   │   └── dtos/
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/
│   │   │   │       └── institution-type.repository.ts
│   │   │   └── interface/
│   │   │       └── controllers/
│   │   │           └── institution-type.controller.ts
│   │   ├── fleet/                   # Fleet Context
│   │   │   ├── domain/
│   │   │   │   └── entities/
│   │   │   │       └── vehicle.entity.ts
│   │   │   ├── application/
│   │   │   │   └── services/
│   │   │   │       └── vehicle.service.ts
│   │   │   ├── infrastructure/
│   │   │   │   └── repositories/
│   │   │   │       └── vehicle.repository.ts
│   │   │   └── interface/
│   │   │       └── controllers/
│   │   │           └── vehicle.controller.ts
│   │   └── roster/                  # Roster Context
│   │       ├── domain/
│   │       │   └── entities/
│   │       │       ├── passenger.entity.ts
│   │       │       ├── passenger-group.entity.ts
│   │       │       ├── passenger-schedule.entity.ts (002번)
│   │       │       └── vehicle-group-connection.entity.ts
│   │       ├── application/
│   │       │   ├── services/
│   │       │   │   ├── passenger.service.ts
│   │       │   │   ├── passenger-group.service.ts
│   │       │   │   ├── excel-upload.service.ts
│   │       │   │   ├── care-time-validation.service.ts (002번)
│   │       │   │   └── care-time-report.service.ts (002번)
│   │       │   └── dtos/
│   │       │       ├── create-passenger.dto.ts
│   │       │       ├── update-passenger.dto.ts
│   │       │       ├── excel-upload-result.dto.ts
│   │       │       └── care-time-validation.dto.ts (002번)
│   │       ├── infrastructure/
│   │       │   ├── repositories/
│   │       │   │   ├── passenger.repository.ts
│   │       │   │   └── passenger-group.repository.ts
│   │       │   └── parsers/
│   │       │       └── excel-parser.service.ts
│   │       └── interface/
│   │           └── controllers/
│   │               ├── passenger.controller.ts
│   │               ├── passenger-group.controller.ts
│   │               └── care-time.controller.ts (002번)
│   ├── shared/                      # 공통 모듈
│   │   ├── database/
│   │   │   ├── prisma.service.ts
│   │   │   └── schema.prisma
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   └── validators/
│   │       ├── phone-number.validator.ts
│   │       └── care-time.validator.ts (002번)
│   ├── app.module.ts
│   └── main.ts
└── tests/
    ├── unit/                        # 단위 테스트
    │   ├── services/
    │   │   ├── vehicle.service.spec.ts
    │   │   ├── passenger.service.spec.ts
    │   │   ├── passenger-group.service.spec.ts
    │   │   ├── excel-upload.service.spec.ts
    │   │   └── care-time-validation.service.spec.ts (002번)
    │   └── validators/
    │       ├── phone-number.validator.spec.ts
    │       └── care-time.validator.spec.ts (002번)
    ├── integration/                 # 통합 테스트
    │   ├── api/
    │   │   ├── vehicle.e2e.spec.ts
    │   │   ├── passenger.e2e.spec.ts
    │   │   ├── passenger-group.e2e.spec.ts
    │   │   └── care-time.e2e.spec.ts (002번)
    │   └── database/
    │       └── transactions.spec.ts
    └── e2e/                         # E2E 테스트
        ├── vehicle-registration.spec.ts
        ├── passenger-excel-upload.spec.ts
        ├── vehicle-group-connection.spec.ts
        └── care-time-validation.spec.ts (002번)

frontend/ (admin-portal)
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (dashboard)/
│   │   │   ├── vehicles/
│   │   │   │   ├── page.tsx        # 차량 목록
│   │   │   │   ├── new/page.tsx    # 차량 등록
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── passengers/
│   │   │   │   ├── page.tsx        # 승객 목록
│   │   │   │   ├── new/page.tsx    # 승객 등록
│   │   │   │   ├── upload/page.tsx # 엑셀 업로드
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── groups/
│   │   │   │   ├── page.tsx        # 승객 그룹 목록
│   │   │   │   ├── new/page.tsx    # 그룹 생성
│   │   │   │   └── [id]/page.tsx   # 그룹 상세
│   │   │   ├── care-time/           # 002번
│   │   │   │   ├── page.tsx        # 케어 시간 리포트
│   │   │   │   └── settings/page.tsx # 기관 유형 설정
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   ├── components/                  # React 컴포넌트
│   │   ├── vehicles/
│   │   │   ├── VehicleForm.tsx
│   │   │   ├── VehicleList.tsx
│   │   │   └── VehicleCard.tsx
│   │   ├── passengers/
│   │   │   ├── PassengerForm.tsx
│   │   │   ├── PassengerList.tsx
│   │   │   ├── PassengerCard.tsx
│   │   │   ├── ExcelUploadForm.tsx
│   │   │   └── CareTimeIndicator.tsx (002번)
│   │   ├── groups/
│   │   │   ├── GroupForm.tsx
│   │   │   ├── GroupList.tsx
│   │   │   └── GroupMemberList.tsx
│   │   ├── care-time/               # 002번
│   │   │   ├── CareTimeReport.tsx
│   │   │   ├── InstitutionTypeSelector.tsx
│   │   │   └── CareTimeChart.tsx
│   │   └── shared/
│   │       ├── Table.tsx
│   │       ├── SearchBar.tsx
│   │       └── FilterPanel.tsx
│   ├── lib/                         # 유틸리티
│   │   ├── api/
│   │   │   ├── vehicles.ts
│   │   │   ├── passengers.ts
│   │   │   ├── groups.ts
│   │   │   └── care-time.ts (002번)
│   │   ├── validation/
│   │   │   ├── phone-number.ts
│   │   │   └── care-time.ts (002번)
│   │   └── utils/
│   │       ├── format-date.ts
│   │       └── format-time.ts (002번)
│   └── types/                       # TypeScript 타입
│       ├── vehicle.ts
│       ├── passenger.ts
│       ├── group.ts
│       └── care-time.ts (002번)
└── tests/
    └── e2e/                         # Playwright E2E
        ├── vehicle-crud.spec.ts
        ├── passenger-excel.spec.ts
        └── care-time-validation.spec.ts (002번)

shared/                              # Backend-Frontend 공유 타입
└── types/
    ├── api-responses.ts
    └── entities.ts
```

**Structure Decision**:
- **Web application 구조 선택** (Backend API + Frontend Admin Portal)
- **Bounded Context 기반 모듈 분리** (Institution, Fleet, Roster)
- **계층형 아키텍처** (Domain, Application, Infrastructure, Interface)
- **공유 타입 디렉토리**: Backend-Frontend 간 타입 일관성 유지

## Complexity Tracking

> 002번 기능을 001번에 통합하면서 추가되는 복잡도 정당화

### Added Complexity: 승객 엔티티 확장 (시간 정보)

**Why**:
- 002번 기능(8시간 케어 검증)은 001번의 `Passenger` 엔티티에 시간 필드 추가 필요
- 별도 엔티티로 분리하면 JOIN 쿼리 증가 및 데이터 정합성 관리 복잡

**Justification**:
- `PassengerSchedule` 테이블을 별도로 만들되, `Passenger`와 1:1 관계로 설계
- 001번 기능만 사용하는 기관은 `PassengerSchedule` 테이블이 비어있음 (nullable)
- 002번 기능 사용 시에만 데이터 입력

**Alternatives Considered**:
- ❌ `Passenger` 테이블에 시간 필드 직접 추가: 001번만 사용하는 기관에게 불필요한 필드 노출
- ✅ `PassengerSchedule` 별도 테이블 + 1:1 관계: 관심사 분리, 선택적 사용 가능

### Added Complexity: 기관 유형 설정

**Why**:
- 002번 기능은 기관별로 케어 시간 규칙이 다름 (주간보호 8시간, 일반 제약 없음)
- `Institution` 엔티티에 유형 설정 필요

**Justification**:
- `InstitutionType` 테이블로 분리하여 확장 가능 (단기보호 24시간 등 추가 가능)
- `Institution`-`InstitutionType` 관계는 다대일 (여러 기관이 동일 유형 공유)

**Impact**:
- 데이터베이스 테이블 2개 추가 (`InstitutionType`, `InstitutionTypeConfiguration`)
- API 엔드포인트 3개 추가 (기관 유형 CRUD, 기관 유형 적용)

---

## Phase 0: Research & Decision Log

> **Note**: 이 섹션은 기술 조사 후 `research.md`로 분리됩니다. 현재는 플레이스홀더입니다.

### Research Tasks

1. **엑셀 파싱 라이브러리 선택**
   - 후보: xlsx, exceljs, node-xlsx
   - 기준: 성능 (1000행 처리), 메모리 사용량, 오류 처리
   - 결정: [research.md에서 작성]

2. **PostgreSQL 스키마 설계 최적화**
   - 연구: 승객-그룹 배정 쿼리 성능 (인덱스 전략)
   - 연구: 차량-그룹 연결 트랜잭션 무결성 (Foreign Key, Check Constraint)
   - 결정: [research.md에서 작성]

3. **NestJS 모듈 구조 베스트 프랙티스**
   - 연구: Bounded Context별 모듈 분리 패턴
   - 연구: 공유 모듈 설계 (Shared Module)
   - 결정: [research.md에서 작성]

4. **시간 간격 계산 라이브러리**
   - 후보: date-fns, dayjs, luxon
   - 기준: 타임존 지원, 번들 크기, API 직관성
   - 결정: [research.md에서 작성]

5. **프론트엔드 상태 관리**
   - 후보: React Query, Zustand, Redux Toolkit
   - 기준: 서버 상태 캐싱, 학습 곡선, 번들 크기
   - 결정: [research.md에서 작성]

---

## Phase 1: Design Artifacts

> **Note**: 이 섹션은 설계 완료 후 별도 파일로 분리됩니다.
> - `data-model.md`: 통합 데이터 모델 및 ERD
> - `contracts/`: OpenAPI 명세 (API 계약)
> - `quickstart.md`: 개발 환경 설정 가이드

### Data Model Preview (상세는 data-model.md 참조)

**Core Entities (001번 + 002번 통합)**:

```prisma
// Institution Context
model Institution {
  id                    String   @id @default(uuid())
  businessRegistrationNo String  @unique
  name                  String
  institutionTypeId     String?
  institutionType       InstitutionType? @relation(fields: [institutionTypeId], references: [id])
  vehicles              Vehicle[]
  passengerGroups       PassengerGroup[]
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

model InstitutionType {
  id                String   @id @default(uuid())
  code              String   @unique  // "daycare", "general" 등
  name              String
  minCareTimeHours  Int?     // 8 (주간보호), null (일반)
  description       String?
  institutions      Institution[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Fleet Context
model Vehicle {
  id                String   @id @default(uuid())
  licensePlateLastFour String
  capacity          Int      // 5-15
  institutionId     String
  institution       Institution @relation(fields: [institutionId], references: [id])
  groupId           String?  @unique
  group             PassengerGroup? @relation(fields: [groupId], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([institutionId, licensePlateLastFour])
}

// Roster Context
model Passenger {
  id                String   @id @default(uuid())
  name              String
  phoneNumber       String
  pickupAddress     String
  dropoffAddress    String
  shuttleType       ShuttleType  // MORNING, EVENING, TEMPORARY
  institutionId     String
  institution       Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  groupId           String?
  group             PassengerGroup? @relation(fields: [groupId], references: [id], onDelete: SetNull)
  schedule          PassengerSchedule?  // 002번: 1:1 관계
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([institutionId, phoneNumber])
}

model PassengerGroup {
  id                String   @id @default(uuid())
  code              String
  name              String
  institutionId     String
  institution       Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
  passengers        Passenger[]
  vehicle           Vehicle?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([institutionId, code])
}

// 002번 기능: 8시간 케어 스케줄
model PassengerSchedule {
  id                    String   @id @default(uuid())
  passengerId           String   @unique
  passenger             Passenger @relation(fields: [passengerId], references: [id], onDelete: Cascade)
  desiredPickupTime     String   // HH:MM 형식
  desiredDropoffTime    String   // HH:MM 형식
  careTimeHours         Float    // 계산값 (캐싱)
  isCareTimeInsufficient Boolean @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}

enum ShuttleType {
  MORNING
  EVENING
  TEMPORARY
}
```

### API Contract Preview (상세는 contracts/ 참조)

**RESTful 엔드포인트 (약 30개)**:

```
# 차량 관리 (001번)
GET    /api/vehicles                    # 차량 목록 조회
POST   /api/vehicles                    # 차량 등록
GET    /api/vehicles/:id                # 차량 상세 조회
PATCH  /api/vehicles/:id                # 차량 수정
DELETE /api/vehicles/:id                # 차량 삭제

# 승객 관리 (001번)
GET    /api/passengers                  # 승객 목록 조회 (검색/필터링 지원)
POST   /api/passengers                  # 승객 등록
GET    /api/passengers/:id              # 승객 상세 조회
PATCH  /api/passengers/:id              # 승객 수정
DELETE /api/passengers/:id              # 승객 삭제
POST   /api/passengers/upload           # 엑셀 일괄 업로드
GET    /api/passengers/template         # 엑셀 템플릿 다운로드

# 승객 그룹 관리 (001번)
GET    /api/passenger-groups            # 그룹 목록 조회
POST   /api/passenger-groups            # 그룹 생성
GET    /api/passenger-groups/:id        # 그룹 상세 조회 (할당된 승객 포함)
PATCH  /api/passenger-groups/:id        # 그룹 수정
DELETE /api/passenger-groups/:id        # 그룹 삭제
POST   /api/passenger-groups/:id/passengers  # 승객 그룹 할당
DELETE /api/passenger-groups/:id/passengers/:passengerId  # 승객 그룹 해제

# 차량-그룹 연결 (001번)
POST   /api/vehicles/:id/group          # 차량에 그룹 연결
DELETE /api/vehicles/:id/group          # 차량-그룹 연결 해제

# 기관 유형 관리 (002번)
GET    /api/institution-types           # 기관 유형 목록
POST   /api/institution-types           # 기관 유형 생성
GET    /api/institution-types/:id       # 기관 유형 상세
PATCH  /api/institutions/:id/type       # 기관 유형 적용

# 케어 시간 검증 (002번)
POST   /api/passengers/:id/schedule     # 승객 스케줄 설정 (8시간 검증 포함)
GET    /api/care-time/report            # 케어 시간 준수 리포트
GET    /api/care-time/insufficient      # 케어 시간 부족 승객 목록
```

---

## Implementation Notes

### Critical Path

1. **데이터베이스 스키마 확정** (Prisma migration)
2. **공유 타입 정의** (Backend-Frontend 간 타입 일관성)
3. **엑셀 파싱 서비스** (xlsx 라이브러리 통합, 검증 로직)
4. **케어 시간 검증 로직** (시간 간격 계산, 기관 유형별 규칙 적용)
5. **트랜잭션 무결성** (승객-그룹 배정, 차량-그룹 연결 시 정원 초과 방지)

### Risks & Mitigation

**Risk 1**: 엑셀 업로드 시 대용량 파일 메모리 부족
- **Mitigation**: 스트리밍 파싱 (xlsx 라이브러리의 스트림 모드), 5MB/1000행 제한

**Risk 2**: 승객-그룹 배정 시 동시성 문제 (정원 초과)
- **Mitigation**: 데이터베이스 트랜잭션 + Optimistic Locking

**Risk 3**: 케어 시간 계산 오류 (자정 넘어가는 경우)
- **Mitigation**: Assumptions에서 Out of Scope 명시, 향후 확장 대비 에러 핸들링

### Performance Optimization

- **인덱스 전략**:
  - `Passenger.phoneNumber` (unique 검색)
  - `Passenger.groupId` (그룹별 조회)
  - `PassengerGroup.code` (그룹 코드 검색)
  - `Vehicle.licensePlateLastFour` (차량 검색)

- **쿼리 최적화**:
  - 승객 목록 조회 시 N+1 문제 방지 (Prisma `include` 사용)
  - 케어 시간 리포트는 `careTimeHours` 캐싱 (계산값 저장)

### Security Considerations

- **입력 검증**: class-validator + DTO
- **SQL Injection 방지**: Prisma ORM (Parameterized Query)
- **파일 업로드 보안**: MIME 타입 검증, 파일 크기 제한
- **인증/인가**: 추후 JWT 기반 인증 통합 대비 설계 (현재는 Out of Scope)

---

## Next Steps

1. **Phase 0 완료**: `research.md` 작성 (기술 조사 및 결정 사항)
2. **Phase 1 완료**:
   - `data-model.md` 작성 (ERD, Prisma 스키마)
   - `contracts/` 작성 (OpenAPI YAML)
   - `quickstart.md` 작성 (개발 환경 설정 가이드)
3. **Agent Context 업데이트**: `.specify/scripts/bash/update-agent-context.sh claude` 실행
4. **Phase 2 준비**: `/speckit.tasks` 명령어로 작업 분해 (tasks.md 생성)

---

**End of Plan** | Next Command: Begin Phase 0 research
