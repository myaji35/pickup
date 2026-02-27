# 구현 계획: SaaS Admin Portal (Phase 12)

**브랜치**: `003-admin-portal` | **작성일**: 2025-11-19 | **사양서**: [spec.md](./spec.md)
**입력**: `/specs/003-admin-portal/spec.md`의 기능 사양서

## 요약

Phase 12는 SUPER_ADMIN을 위한 웹 기반 관리 포털을 구현하여 회원사 승인/거부, 상태 관리(정지/재활성화), 요금제 CRUD, 시스템 사용자 관리 기능을 제공한다. Phase 11에서 구현된 Backend Admin API를 활용하며, 신규 SubscriptionPlan 및 Subscription 엔티티를 추가한다. React + TypeScript 기반 SPA로 구현하며, Vite + TailwindCSS + shadcn/ui를 사용하여 빠른 개발과 일관된 디자인을 보장한다.

## 기술 컨텍스트

**언어/버전**: TypeScript 5.x (Node.js 20.x LTS) - Backend, React 18.x + TypeScript 5.x - Frontend
**주요 의존성**:
- **Backend**: NestJS 10.x, Prisma 5.x, JWT (passport-jwt), bcrypt
- **Frontend**: React 18.x, React Router v6, TanStack Query v5, Axios, Zod, React Hook Form
- **UI**: Vite, TailwindCSS 3.x, shadcn/ui, Radix UI, Lucide React (아이콘)

**스토리지**: PostgreSQL 15+ (기존 pickup_dev 데이터베이스 확장)
**테스트**:
- **Backend**: Jest, Supertest (API 테스트)
- **Frontend**: Vitest, React Testing Library

**대상 플랫폼**: 웹 브라우저 (Chrome, Safari, Firefox 최신 버전), 모바일 브라우저 반응형 지원
**프로젝트 타입**: 웹 애플리케이션 (Backend + Frontend 분리)
**성능 목표**:
- API 응답 시간 <200ms (p95)
- 회원사 목록 100개 로드/렌더링 <2초
- 검색 결과 표시 <500ms (Debounce 적용)

**제약사항**:
- SUPER_ADMIN 권한 필수 (JWT 기반 인증, RolesGuard 적용)
- SUSPENDED 회원사 사용자 로그인 차단
- 요금제 삭제 시 참조 무결성 보장 (Soft Delete 또는 FK 제약)
- 동시성 처리 (Optimistic Locking 또는 상태 검증)

**규모/범위**:
- 초기 회원사 수: <100개 (향후 1,000개까지 확장 가능)
- SUPER_ADMIN 계정: 초기 1-3개
- 요금제: 초기 2-5개
- Admin Portal 화면: 약 10개 페이지/컴포넌트

## 헌장 준수 체크

*게이트: Phase 0 연구 전 통과 필수. Phase 1 설계 후 재검증.*

### I. 마이크로서비스 우선 (Microservices-First)

✅ **준수**: Admin Portal은 Institution Context 내에서 구현되며, 기존 Admin API (`/admin/institutions`)를 활용한다. 새로운 SubscriptionPlan 및 Subscription 엔티티는 Institution Context에 속하며, DDD Bounded Context를 준수한다.

**참고**: 현재 모놀리식 NestJS 애플리케이션이지만, Context별 모듈 분리(`institution.module.ts`, `user.module.ts`)로 마이크로서비스 전환 준비가 되어 있다.

### II. AI 기반 최적화 중심 (AI-Driven Optimization)

N/A - Phase 12는 Admin Portal UI이므로 VRP 엔진과 직접 관련 없음. (Phase 16에서 구현 예정)

### III. 테스트 우선 개발 (Test-First Development) - 타협 불가

✅ **준수 계획**:
- Backend: Subscription 엔티티, SubscriptionService, SubscriptionRepository에 대한 단위 테스트 (TDD 방식)
- Frontend: React 컴포넌트 (InstitutionList, InstitutionDetail, SubscriptionPlanForm)에 대한 React Testing Library 테스트
- E2E 테스트: Playwright 또는 Cypress로 핵심 워크플로우 (승인/거부, 정지/재활성화) 검증

**목표**: 핵심 비즈니스 로직 90% 이상 테스트 커버리지

### IV. 실시간 데이터 파이프라인 신뢰성 (Real-time Data Pipeline Reliability)

N/A - Phase 12는 관리 UI이므로 실시간 GPS/IoT 데이터와 무관. (Phase 14-15에서 구현 예정)

### V. 관측 가능성 및 투명성 (Observability & Transparency)

⚠️ **부분 준수**:
- 구조화된 로깅: NestJS Logger 사용 (JSON 포맷 설정 필요)
- 메트릭 수집: 현재 미구현 (Phase 17 BI 대시보드에서 본격 도입 예정)
- 분산 트레이싱: 현재 미구현 (Stage 3에서 도입 검토)

**Phase 12 범위**:
- 주요 관리 작업(승인, 거부, 정지, 재활성화)에 대한 구조화된 로그 기록
- 에러 로그 JSON 포맷 표준화

### VI. 단계별 가치 전달 우선순위 (Incremental Value Delivery)

✅ **준수**:
- Phase 11 (인증/인가 시스템) 완료 후 Phase 12 진행
- Phase 12 완료 후 독립적으로 배포 가능 (SUPER_ADMIN 회원사 관리 완전한 여정)
- P1 (승인/정지 워크플로우) → P2 (목록/필터링, 요금제) → P3 (대시보드, 시스템 사용자) 순차 구현

**기술 부채 정리**: Phase 11 JWT 타입 에러 수정 완료, 모든 테스트 통과 확인

## 프로젝트 구조

### 문서 (이번 기능)

```text
specs/003-admin-portal/
├── plan.md              # 본 파일 (/speckit.plan 출력)
├── research.md          # Phase 0 출력 (기술 조사)
├── data-model.md        # Phase 1 출력 (엔티티 모델)
├── quickstart.md        # Phase 1 출력 (개발 시작 가이드)
├── contracts/           # Phase 1 출력 (API 계약)
│   ├── admin-api.yaml   # Admin API OpenAPI 사양 (기존 Phase 11 + 신규 Subscription API)
│   └── frontend-api.ts  # Frontend용 TypeScript 타입 정의
└── tasks.md             # Phase 2 출력 (/speckit.tasks 명령어 - 본 명령어에서 생성 안 함)
```

### 소스 코드 (저장소 루트)

```text
# Backend (NestJS 모놀리스, Context별 모듈 분리)
backend/
├── src/
│   ├── institution/                      # Institution Context (기존)
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── institution.entity.ts # Phase 11 완료 (status, approvedBy 등)
│   │   │   │   ├── subscription-plan.entity.ts  # Phase 12 신규
│   │   │   │   └── subscription.entity.ts       # Phase 12 신규
│   │   │   └── repositories/
│   │   │       ├── institution.repository.interface.ts
│   │   │       ├── subscription-plan.repository.interface.ts  # Phase 12 신규
│   │   │       └── subscription.repository.interface.ts       # Phase 12 신규
│   │   ├── application/
│   │   │   └── services/
│   │   │       ├── institution.service.ts        # 기존
│   │   │       ├── subscription-plan.service.ts  # Phase 12 신규
│   │   │       └── subscription.service.ts       # Phase 12 신규
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── institution.repository.ts     # Phase 11 완료 (findByStatus, findAll 포함)
│   │   │       ├── subscription-plan.repository.ts  # Phase 12 신규
│   │   │       └── subscription.repository.ts       # Phase 12 신규
│   │   ├── interface/
│   │   │   └── controllers/
│   │   │       ├── admin.controller.ts           # Phase 11 완료 (7개 엔드포인트)
│   │   │       ├── subscription-plan.controller.ts  # Phase 12 신규 (SUPER_ADMIN 전용)
│   │   │       └── subscription.controller.ts       # Phase 12 신규 (회원사별 구독 관리)
│   │   └── institution.module.ts                 # 기존 (AdminController 등록 완료)
│   ├── user/                             # User Context (기존)
│   │   ├── domain/entities/user.entity.ts       # Phase 12: isActive 필드 추가
│   │   ├── application/services/
│   │   │   ├── auth.service.ts          # Phase 11 완료 (JWT, bcrypt)
│   │   │   └── user.service.ts          # Phase 12: SUPER_ADMIN CRUD 추가
│   │   ├── interface/controllers/
│   │   │   ├── auth.controller.ts       # Phase 11 완료 (login, register, refresh, me)
│   │   │   └── user.controller.ts       # Phase 12 신규 (SUPER_ADMIN 관리)
│   │   └── user.module.ts
│   └── prisma/
│       ├── schema.prisma                # Phase 12: SubscriptionPlan, Subscription 추가
│       └── migrations/                  # Prisma 마이그레이션
└── tests/
    ├── unit/
    │   ├── institution/
    │   │   ├── subscription-plan.service.spec.ts
    │   │   └── subscription.service.spec.ts
    │   └── user/
    │       └── user.service.spec.ts
    ├── integration/
    │   ├── admin-api.spec.ts            # Phase 11 Admin API 통합 테스트
    │   ├── subscription-plan-api.spec.ts # Phase 12 신규
    │   └── subscription-api.spec.ts      # Phase 12 신규
    └── e2e/
        └── admin-portal.e2e.spec.ts     # Phase 12 E2E 테스트 (Playwright/Cypress)

# Frontend (React SPA, Vite)
frontend/                                # Phase 12 신규 디렉토리
├── src/
│   ├── main.tsx                         # Vite 엔트리포인트
│   ├── App.tsx                          # React Router 설정
│   ├── routes/                          # 라우트 정의
│   │   ├── index.tsx                    # 라우트 설정
│   │   ├── dashboard.tsx                # P3: Admin 대시보드
│   │   ├── institutions/
│   │   │   ├── index.tsx                # P2: 회원사 목록 (필터, 검색, 페이지네이션)
│   │   │   └── [id].tsx                 # P1: 회원사 상세 (승인/거부/정지/재활성화)
│   │   ├── subscription-plans/
│   │   │   ├── index.tsx                # P2: 요금제 목록
│   │   │   ├── new.tsx                  # P2: 요금제 생성
│   │   │   └── [id].tsx                 # P2: 요금제 상세/수정
│   │   └── users/
│   │       └── index.tsx                # P3: 시스템 사용자 관리
│   ├── components/                      # 재사용 가능한 UI 컴포넌트
│   │   ├── ui/                          # shadcn/ui 컴포넌트 (Button, Card, Table, Dialog 등)
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx          # 공통 레이아웃 (헤더, 사이드바, 로그아웃)
│   │   │   └── Sidebar.tsx              # 네비게이션 메뉴
│   │   ├── institutions/
│   │   │   ├── InstitutionList.tsx      # P2: 회원사 목록 테이블
│   │   │   ├── InstitutionDetailCard.tsx # P1: 회원사 상세 정보
│   │   │   ├── InstitutionStatusBadge.tsx # 상태 배지 (PENDING/ACTIVE/SUSPENDED/INACTIVE)
│   │   │   ├── ApproveRejectDialog.tsx  # P1: 승인/거부 모달
│   │   │   └── SuspendReactivateDialog.tsx # P1: 정지/재활성화 모달
│   │   ├── subscription-plans/
│   │   │   ├── SubscriptionPlanList.tsx # P2: 요금제 목록 테이블
│   │   │   └── SubscriptionPlanForm.tsx # P2: 요금제 생성/수정 폼
│   │   └── dashboard/
│   │       └── StatisticsCard.tsx       # P3: 대시보드 통계 카드
│   ├── lib/                             # 유틸리티 및 설정
│   │   ├── api/                         # API 클라이언트
│   │   │   ├── client.ts                # Axios 인스턴스 (JWT 인터셉터)
│   │   │   ├── institutions.ts          # Institution API 호출
│   │   │   ├── subscription-plans.ts    # SubscriptionPlan API 호출
│   │   │   ├── subscriptions.ts         # Subscription API 호출
│   │   │   ├── users.ts                 # User API 호출
│   │   │   └── auth.ts                  # Auth API 호출
│   │   ├── hooks/                       # React Hooks
│   │   │   ├── useAuth.ts               # 인증 상태 관리
│   │   │   ├── useInstitutions.ts       # TanStack Query: Institution 데이터
│   │   │   ├── useSubscriptionPlans.ts  # TanStack Query: SubscriptionPlan 데이터
│   │   │   └── useUsers.ts              # TanStack Query: User 데이터
│   │   ├── schemas/                     # Zod 스키마 (폼 검증)
│   │   │   ├── subscription-plan.schema.ts
│   │   │   └── user.schema.ts
│   │   └── types/                       # TypeScript 타입 정의
│   │       ├── institution.ts
│   │       ├── subscription.ts
│   │       └── user.ts
│   └── styles/
│       └── globals.css                  # TailwindCSS 글로벌 스타일
├── public/                              # 정적 파일
├── index.html                           # Vite HTML 템플릿
├── vite.config.ts                       # Vite 설정
├── tailwind.config.ts                   # TailwindCSS 설정
├── tsconfig.json                        # TypeScript 설정
└── package.json

# Frontend Tests
frontend/
└── tests/
    ├── components/
    │   ├── InstitutionList.test.tsx
    │   ├── ApproveRejectDialog.test.tsx
    │   └── SubscriptionPlanForm.test.tsx
    └── e2e/
        └── admin-portal.spec.ts         # Playwright E2E 테스트
```

**구조 결정**: 웹 애플리케이션 (Backend + Frontend 분리) - Backend는 기존 NestJS 모놀리스에 Institution Context 확장, Frontend는 새로운 React SPA 디렉토리 생성

## 복잡도 추적

> **헌장 준수 체크에서 위반이 있고 정당화가 필요한 경우에만 작성**

| 위반 사항 | 필요한 이유 | 더 간단한 대안을 거부한 이유 |
|-----------|------------|------------------------------|
| N/A | N/A | N/A |

**참고**: Phase 12는 헌장의 모든 핵심 원칙을 준수하며, 복잡도 증가 없이 기존 아키텍처를 확장한다.

## Phase 0: 개요 및 연구

### 기술 조사 항목

Phase 12 구현을 위해 다음 항목에 대한 연구가 필요:

1. **Frontend UI 라이브러리 선택**
   - **질문**: Admin Portal UI에 shadcn/ui + TailwindCSS를 사용할 것인가, 아니면 Material-UI, Ant Design 등 다른 라이브러리를 선택할 것인가?
   - **조사 필요**: 각 라이브러리의 장단점, 프로젝트 규모에 적합성, 커스터마이징 용이성, 번들 크기

2. **상태 관리 라이브러리**
   - **질문**: TanStack Query (React Query)만으로 충분한가, 아니면 Redux/Zustand 같은 글로벌 상태 관리가 필요한가?
   - **조사 필요**: Admin Portal의 상태 복잡도, 서버 상태 vs 클라이언트 상태 비율

3. **폼 검증 및 관리**
   - **질문**: React Hook Form + Zod 조합을 사용할 것인가?
   - **조사 필요**: 폼 복잡도 (요금제 생성, 회원사 정보 수정), 타입 안전성 요구사항

4. **E2E 테스트 도구**
   - **질문**: Playwright vs Cypress 중 어느 것을 선택할 것인가?
   - **조사 필요**: NestJS 백엔드 + React 프론트엔드 통합 테스트 지원, 속도, 안정성

5. **Soft Delete vs Hard Delete 전략**
   - **질문**: SubscriptionPlan 삭제 시 Soft Delete (isActive=false)를 사용할 것인가, 아니면 Foreign Key 제약으로 Hard Delete를 차단할 것인가?
   - **조사 필요**: 데이터 무결성, 감사 추적, 성능 영향

6. **로그인 차단 구현 방법**
   - **질문**: SUSPENDED 회원사 사용자 로그인 차단을 JWT Strategy에서 처리할 것인가, 아니면 별도 Guard를 만들 것인가?
   - **조사 필요**: NestJS Guard 우선순위, 에러 메시지 커스터마이징 방법

7. **Prisma 마이그레이션 전략**
   - **질문**: SubscriptionPlan, Subscription 테이블 추가 시, User.isActive 필드 추가 시 마이그레이션을 어떻게 관리할 것인가?
   - **조사 필요**: 기존 데이터 마이그레이션 (User 테이블에 isActive=true 기본값 설정), 롤백 전략

### 연구 결과 (research.md)

Phase 0 완료 후 `specs/003-admin-portal/research.md`에 다음 내용 기록:

- **결정**: [선택된 기술/패턴]
- **근거**: [선택 이유]
- **검토된 대안**: [평가했던 다른 옵션]

**예시**:
```markdown
## 1. Frontend UI 라이브러리 선택

**결정**: shadcn/ui + TailwindCSS 사용

**근거**:
- 컴포넌트 소스 코드를 프로젝트에 복사하여 완전한 커스터마이징 가능
- TailwindCSS와 네이티브 통합으로 일관된 디자인 시스템 구축
- Radix UI 기반으로 접근성(a11y) 기본 지원
- 번들 크기 최소화 (트리 쉐이킹 최적화)
- Vite와 호환성 우수

**검토된 대안**:
- Material-UI: 완성도 높지만 번들 크기 크고 커스터마이징 어려움
- Ant Design: 기업용 UI에 적합하지만 디자인 변경 제한적
- Chakra UI: 좋은 선택지지만 shadcn/ui보다 추상화 레벨 높음

...
```

## Phase 1: 설계 및 계약

**전제조건**: `research.md` 완료

### 1. 데이터 모델 (data-model.md)

기능 사양서의 엔티티를 기반으로 `specs/003-admin-portal/data-model.md` 생성:

#### SubscriptionPlan 엔티티

**목적**: B2B 요금제 정보 저장

**필드**:
- `id`: UUID, Primary Key
- `name`: String, Required, Unique (요금제명, e.g., "Basic", "Premium", "Enterprise")
- `monthlyFee`: Decimal, Required (월 비용, KRW)
- `vehicleLimit`: Integer, Required (차량 수 제한, e.g., 5, 10, 무제한은 NULL)
- `isActive`: Boolean, Required, Default: true (활성 상태, Soft Delete용)
- `description`: String, Optional (요금제 설명)
- `features`: JSON, Optional (추가 기능 플래그, e.g., `{"ai_optimization": true, "bi_dashboard": false}`)
- `createdAt`: DateTime, Required
- `updatedAt`: DateTime, Required

**관계**:
- `Subscription` (1:N) - 하나의 요금제는 여러 구독을 가질 수 있음

**검증 규칙**:
- `name`: 빈 문자열 불가, 최대 100자
- `monthlyFee`: >= 0
- `vehicleLimit`: > 0 또는 NULL (무제한)
- `isActive=false`인 요금제는 새로운 구독 생성 불가

**상태 전환**: N/A (Soft Delete만 존재)

---

#### Subscription 엔티티

**목적**: 회원사별 구독 정보 및 이력 관리

**필드**:
- `id`: UUID, Primary Key
- `institutionId`: UUID, Foreign Key (Institution), Required
- `subscriptionPlanId`: UUID, Foreign Key (SubscriptionPlan), Required
- `startedAt`: DateTime, Required (구독 시작일)
- `endedAt`: DateTime, Optional (구독 종료일, NULL이면 현재 활성)
- `status`: Enum (SubscriptionStatus), Required
  - `ACTIVE`: 현재 활성 구독
  - `CANCELLED`: 사용자가 취소한 구독
  - `EXPIRED`: 종료일 지난 구독
- `createdAt`: DateTime, Required
- `updatedAt`: DateTime, Required

**관계**:
- `Institution` (N:1) - 하나의 회원사는 여러 구독 이력을 가질 수 있음
- `SubscriptionPlan` (N:1) - 하나의 요금제는 여러 구독에 사용됨

**검증 규칙**:
- 회원사당 동시에 1개의 `status=ACTIVE` Subscription만 존재 가능 (DB Unique Constraint)
- `endedAt` >= `startedAt` (종료일은 시작일 이후)
- `status=ACTIVE`인 구독은 `endedAt=NULL`이어야 함

**상태 전환**:
- `ACTIVE` → `CANCELLED` (사용자 취소 시)
- `ACTIVE` → `EXPIRED` (endedAt 지난 경우, 배치 작업)

---

#### Institution 엔티티 (기존 확장)

**Phase 12 추가 필드**:
- `currentSubscriptionId`: UUID, Foreign Key (Subscription), Optional - 현재 활성 구독

**관계 추가**:
- `Subscription` (1:N) - 구독 이력
- `SubscriptionPlan` (N:1 via Subscription) - 현재 요금제

**비즈니스 규칙**:
- 회원사 승인 시 기본 요금제 자동 할당 (e.g., "Basic" 요금제의 ACTIVE Subscription 생성)
- 회원사 정지 시 구독 상태는 유지 (SUSPENDED 회원사도 요금제 변경 가능)

---

#### User 엔티티 (기존 확장)

**Phase 12 추가 필드**:
- `isActive`: Boolean, Required, Default: true (계정 활성화 상태)
- `lastLoginAt`: DateTime, Optional (최근 로그인 일시, 현재 Phase에서는 Optional)

**검증 규칙**:
- `isActive=false`인 사용자는 로그인 차단
- `role=SUPER_ADMIN`이면서 본인 계정은 `isActive=false`로 변경 불가 (서비스 로직에서 검증)

### 2. API 계약 생성 (contracts/)

기능 요구사항에서 엔드포인트 추출하여 OpenAPI 사양 생성:

#### `specs/003-admin-portal/contracts/admin-api.yaml`

```yaml
openapi: 3.0.3
info:
  title: Pickup MaaS Admin API
  version: 1.0.0
  description: SUPER_ADMIN 전용 관리 API (Phase 11 + Phase 12)

servers:
  - url: http://localhost:3009/api
    description: 로컬 개발 서버

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    InstitutionStatus:
      type: string
      enum: [PENDING, ACTIVE, SUSPENDED, INACTIVE]

    SubscriptionStatus:
      type: string
      enum: [ACTIVE, CANCELLED, EXPIRED]

    Institution:
      type: object
      properties:
        id:
          type: string
          format: uuid
        businessRegistrationNo:
          type: string
        name:
          type: string
        institutionTypeId:
          type: string
          format: uuid
          nullable: true
        status:
          $ref: '#/components/schemas/InstitutionStatus'
        rejectionReason:
          type: string
          nullable: true
        approvedAt:
          type: string
          format: date-time
          nullable: true
        approvedBy:
          type: string
          format: uuid
          nullable: true
        suspendedAt:
          type: string
          format: date-time
          nullable: true
        suspensionReason:
          type: string
          nullable: true
        currentSubscriptionId:
          type: string
          format: uuid
          nullable: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    SubscriptionPlan:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        monthlyFee:
          type: number
          format: decimal
        vehicleLimit:
          type: integer
          nullable: true
        isActive:
          type: boolean
        description:
          type: string
          nullable: true
        features:
          type: object
          additionalProperties: true
          nullable: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    Subscription:
      type: object
      properties:
        id:
          type: string
          format: uuid
        institutionId:
          type: string
          format: uuid
        subscriptionPlanId:
          type: string
          format: uuid
        startedAt:
          type: string
          format: date-time
        endedAt:
          type: string
          format: date-time
          nullable: true
        status:
          $ref: '#/components/schemas/SubscriptionStatus'
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        role:
          type: string
          enum: [SUPER_ADMIN, INSTITUTION_ADMIN, DRIVER]
        institutionId:
          type: string
          format: uuid
          nullable: true
        isActive:
          type: boolean
        lastLoginAt:
          type: string
          format: date-time
          nullable: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

paths:
  # Phase 11: Institution Management (기존)
  /admin/institutions:
    get:
      summary: 회원사 목록 조회 (Admin)
      tags: [Admin - Institutions]
      security:
        - bearerAuth: []
      parameters:
        - name: status
          in: query
          schema:
            $ref: '#/components/schemas/InstitutionStatus'
        - name: skip
          in: query
          schema:
            type: integer
        - name: take
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: 성공
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode:
                    type: integer
                  message:
                    type: string
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Institution'

  /admin/institutions/pending:
    get:
      summary: 승인 대기 회원사 조회
      tags: [Admin - Institutions]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: 성공

  /admin/institutions/{id}:
    get:
      summary: 회원사 상세 조회
      tags: [Admin - Institutions]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: 성공
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode:
                    type: integer
                  message:
                    type: string
                  data:
                    $ref: '#/components/schemas/Institution'
        '404':
          description: 회원사를 찾을 수 없음

  /admin/institutions/{id}/approve:
    post:
      summary: 회원사 승인
      tags: [Admin - Institutions]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: 승인 성공
        '400':
          description: PENDING 상태가 아님
        '404':
          description: 회원사를 찾을 수 없음

  /admin/institutions/{id}/reject:
    post:
      summary: 회원사 거부
      tags: [Admin - Institutions]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
              required: [reason]
      responses:
        '200':
          description: 거부 성공
        '400':
          description: 거부 사유 없음 또는 PENDING 상태 아님

  /admin/institutions/{id}/suspend:
    post:
      summary: 회원사 정지
      tags: [Admin - Institutions]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
              required: [reason]
      responses:
        '200':
          description: 정지 성공
        '400':
          description: ACTIVE 상태 아님

  /admin/institutions/{id}/reactivate:
    post:
      summary: 회원사 재활성화
      tags: [Admin - Institutions]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: 재활성화 성공
        '400':
          description: SUSPENDED 상태 아님

  # Phase 12: Subscription Plans (신규)
  /admin/subscription-plans:
    get:
      summary: 요금제 목록 조회
      tags: [Admin - Subscription Plans]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: 성공
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode:
                    type: integer
                  message:
                    type: string
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/SubscriptionPlan'

    post:
      summary: 요금제 생성
      tags: [Admin - Subscription Plans]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                monthlyFee:
                  type: number
                vehicleLimit:
                  type: integer
                  nullable: true
                description:
                  type: string
                features:
                  type: object
              required: [name, monthlyFee]
      responses:
        '201':
          description: 생성 성공
        '400':
          description: 유효성 검사 실패

  /admin/subscription-plans/{id}:
    get:
      summary: 요금제 상세 조회
      tags: [Admin - Subscription Plans]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: 성공
        '404':
          description: 요금제를 찾을 수 없음

    patch:
      summary: 요금제 수정
      tags: [Admin - Subscription Plans]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                monthlyFee:
                  type: number
                vehicleLimit:
                  type: integer
                description:
                  type: string
                features:
                  type: object
      responses:
        '200':
          description: 수정 성공
        '404':
          description: 요금제를 찾을 수 없음

    delete:
      summary: 요금제 비활성화 (Soft Delete)
      tags: [Admin - Subscription Plans]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: 비활성화 성공
        '400':
          description: 사용 중인 요금제는 비활성화 불가
        '404':
          description: 요금제를 찾을 수 없음

  # Phase 12: Subscriptions (신규)
  /admin/institutions/{institutionId}/subscription:
    post:
      summary: 회원사 구독 변경
      tags: [Admin - Subscriptions]
      security:
        - bearerAuth: []
      parameters:
        - name: institutionId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                subscriptionPlanId:
                  type: string
                  format: uuid
              required: [subscriptionPlanId]
      responses:
        '200':
          description: 구독 변경 성공
        '400':
          description: 유효하지 않은 요금제
        '404':
          description: 회원사를 찾을 수 없음

    get:
      summary: 회원사 구독 이력 조회
      tags: [Admin - Subscriptions]
      security:
        - bearerAuth: []
      parameters:
        - name: institutionId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: 성공
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode:
                    type: integer
                  message:
                    type: string
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Subscription'

  # Phase 12: System Users (신규)
  /admin/users:
    get:
      summary: SUPER_ADMIN 계정 목록 조회
      tags: [Admin - Users]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: 성공
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode:
                    type: integer
                  message:
                    type: string
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'

    post:
      summary: SUPER_ADMIN 계정 생성
      tags: [Admin - Users]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
              required: [email, password]
      responses:
        '201':
          description: 생성 성공
        '400':
          description: 이미 존재하는 이메일

  /admin/users/{id}/deactivate:
    post:
      summary: SUPER_ADMIN 계정 비활성화
      tags: [Admin - Users]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: 비활성화 성공
        '400':
          description: 본인 계정은 비활성화 불가
        '404':
          description: 사용자를 찾을 수 없음

  # Phase 12: Dashboard Statistics (신규)
  /admin/dashboard/statistics:
    get:
      summary: Admin 대시보드 통계
      tags: [Admin - Dashboard]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: 성공
          content:
            application/json:
              schema:
                type: object
                properties:
                  statusCode:
                    type: integer
                  message:
                    type: string
                  data:
                    type: object
                    properties:
                      totalInstitutions:
                        type: integer
                      pendingInstitutions:
                        type: integer
                      activeInstitutions:
                        type: integer
                      suspendedInstitutions:
                        type: integer
                      inactiveInstitutions:
                        type: integer
                      newThisMonth:
                        type: integer
```

#### `specs/003-admin-portal/contracts/frontend-api.ts`

TypeScript 타입 정의 (Frontend에서 사용):

```typescript
// Frontend API Types (Auto-generated from OpenAPI or manually maintained)

export type InstitutionStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
export type UserRole = 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'DRIVER';

export interface Institution {
  id: string;
  businessRegistrationNo: string;
  name: string;
  institutionTypeId: string | null;
  status: InstitutionStatus;
  rejectionReason: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  suspendedAt: Date | null;
  suspensionReason: string | null;
  currentSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyFee: number;
  vehicleLimit: number | null;
  isActive: boolean;
  description: string | null;
  features: Record<string, boolean> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  institutionId: string;
  subscriptionPlanId: string;
  startedAt: Date;
  endedAt: Date | null;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  institutionId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStatistics {
  totalInstitutions: number;
  pendingInstitutions: number;
  activeInstitutions: number;
  suspendedInstitutions: number;
  inactiveInstitutions: number;
  newThisMonth: number;
}

// API Response Wrapper
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// Request DTOs
export interface CreateSubscriptionPlanDto {
  name: string;
  monthlyFee: number;
  vehicleLimit?: number | null;
  description?: string;
  features?: Record<string, boolean>;
}

export interface UpdateSubscriptionPlanDto {
  name?: string;
  monthlyFee?: number;
  vehicleLimit?: number | null;
  description?: string;
  features?: Record<string, boolean>;
}

export interface ChangeSubscriptionDto {
  subscriptionPlanId: string;
}

export interface CreateSuperAdminDto {
  email: string;
  password: string;
}

export interface RejectInstitutionDto {
  reason: string;
}

export interface SuspendInstitutionDto {
  reason: string;
}
```

### 3. Agent Context 업데이트

```bash
bash .specify/scripts/bash/update-agent-context.sh claude
```

**CLAUDE.md 업데이트 내용**:
- **Active Technologies** 섹션에 `React 18.x (Vite, TailwindCSS, shadcn/ui)` 추가
- **Recent Changes** 섹션에 `003-admin-portal: Added React 18.x (Vite, TailwindCSS, shadcn/ui)` 추가

## 최종 산출물

Phase 0-1 완료 후 다음 파일 생성:

```text
specs/003-admin-portal/
├── plan.md             # ✅ 본 파일
├── research.md         # Phase 0 출력
├── data-model.md       # Phase 1 출력
├── quickstart.md       # Phase 1 출력
└── contracts/          # Phase 1 출력
    ├── admin-api.yaml
    └── frontend-api.ts
```

**다음 단계**: `/speckit.tasks` 명령어로 Phase 2 태스크 분해 진행

## 헌장 재검증 (Phase 1 설계 완료 후)

### I. 마이크로서비스 우선 (Microservices-First)

✅ **재검증 결과**:
- SubscriptionPlan, Subscription 엔티티는 Institution Context에 속함 (DDD 준수)
- Backend 모듈 구조 유지 (institution.module.ts 내부에 새로운 Service/Repository/Controller 추가)
- Frontend는 독립적인 React SPA로 분리되어 있음 (향후 마이크로프론트엔드 전환 가능)

### III. 테스트 우선 개발 (Test-First Development) - 타협 불가

✅ **재검증 결과**:
- data-model.md에 모든 엔티티 검증 규칙 명시
- contracts/admin-api.yaml에 모든 API 엔드포인트 및 에러 응답 정의
- Phase 2 tasks.md에서 각 기능별 테스트 태스크 생성 예정

### V. 관측 가능성 및 투명성 (Observability & Transparency)

✅ **재검증 결과**:
- 주요 관리 작업(승인, 거부, 정지, 재활성화)에 대한 로그 기록 계획 수립
- NestJS Logger를 사용한 구조화된 로깅 (JSON 포맷)

**최종 판정**: Phase 12 설계는 헌장의 모든 핵심 원칙을 준수함.

---

**Phase 2**: `/speckit.tasks` 명령어로 위 계획을 실행 가능한 태스크로 분해
