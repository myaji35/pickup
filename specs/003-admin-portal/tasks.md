# 태스크: SaaS Admin Portal (Phase 12)

**입력**: `/specs/003-admin-portal/` 설계 문서
**전제조건**: plan.md (필수), spec.md (필수), constitution.md

**테스트**: Phase 12는 TDD 방식을 채택하므로 모든 사용자 스토리에 테스트 태스크 포함

**구성**: 태스크는 사용자 스토리별로 그룹화하여 각 스토리를 독립적으로 구현하고 테스트할 수 있도록 구성됨

## 포맷: `[ID] [P?] [Story] 설명`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 사용자 스토리 레이블 (US1, US2, US3, US4, US5, US6)
- 모든 설명에 정확한 파일 경로 포함

## 경로 규칙

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Shared**: `.specify/`, `specs/`

---

## Phase 1: 초기 설정 (공유 인프라)

**목적**: 프로젝트 초기화 및 기본 구조 생성

- [ ] T001 Frontend 프로젝트 생성: `npm create vite@latest frontend -- --template react-ts`
- [ ] T002 Frontend 의존성 설치: React Router v6, TanStack Query v5, Axios, Zod, React Hook Form
- [ ] T003 [P] TailwindCSS 설정: `frontend/tailwind.config.ts`, `frontend/src/styles/globals.css`
- [ ] T004 [P] shadcn/ui 초기화: `npx shadcn-ui@latest init` (Button, Card, Table, Dialog 컴포넌트)
- [ ] T005 [P] Vite 환경변수 설정: `frontend/.env.development`, `frontend/.env.production`
- [ ] T006 [P] TypeScript 설정 최적화: `frontend/tsconfig.json` (strict mode, path aliases)
- [ ] T007 [P] ESLint/Prettier 설정: `frontend/.eslintrc.cjs`, `frontend/.prettierrc`
- [ ] T008 Backend Prisma 스키마 업데이트 준비: `backend/prisma/schema.prisma` 백업
- [ ] T009 Frontend 디렉토리 구조 생성: `src/routes/`, `src/components/`, `src/lib/`, `src/styles/`

---

## Phase 2: 기반 레이어 (모든 스토리의 선행 조건)

**목적**: 모든 사용자 스토리가 의존하는 핵심 인프라 - 이 Phase가 완료되어야 사용자 스토리 작업 가능

**⚠️ 중요**: 이 Phase가 완료되기 전까지 사용자 스토리 작업 불가

### Backend 기반 작업

- [ ] T010 Prisma 스키마 확장: SubscriptionPlan 모델 추가 (`backend/prisma/schema.prisma`)
- [ ] T011 Prisma 스키마 확장: Subscription 모델 추가 (`backend/prisma/schema.prisma`)
- [ ] T012 Prisma 스키마 확장: Institution.currentSubscriptionId 필드 추가 (`backend/prisma/schema.prisma`)
- [ ] T013 Prisma 스키마 확장: User.isActive, User.lastLoginAt 필드 추가 (`backend/prisma/schema.prisma`)
- [ ] T014 Prisma 마이그레이션 생성: `npx prisma migrate dev --name add_subscription_models`
- [ ] T015 Prisma Client 재생성: `npx prisma generate`

### Frontend 기반 작업

- [ ] T016 [P] Axios 인스턴스 생성: JWT 인터셉터 구현 (`frontend/src/lib/api/client.ts`)
- [ ] T017 [P] TanStack Query 설정: QueryClient, QueryProvider 구성 (`frontend/src/lib/query-client.ts`)
- [ ] T018 [P] React Router 설정: RouterProvider, 라우트 정의 (`frontend/src/App.tsx`, `frontend/src/routes/index.tsx`)
- [ ] T019 [P] TypeScript 타입 정의: Institution, User, SubscriptionPlan, Subscription (`frontend/src/lib/types/`)
- [ ] T020 [P] Zod 스키마 정의: SubscriptionPlan, User 검증 스키마 (`frontend/src/lib/schemas/`)
- [ ] T021 [P] useAuth 훅 구현: 인증 상태 관리 (`frontend/src/lib/hooks/useAuth.ts`)
- [ ] T022 [P] AdminLayout 컴포넌트: 공통 레이아웃, 헤더, 로그아웃 (`frontend/src/components/layout/AdminLayout.tsx`)
- [ ] T023 [P] Sidebar 컴포넌트: 네비게이션 메뉴 (`frontend/src/components/layout/Sidebar.tsx`)
- [ ] T024 [P] shadcn/ui 추가 컴포넌트 설치: Badge, Input, Select, Textarea, Alert

**체크포인트**: 기반 레이어 완료 - 이제 사용자 스토리 병렬 구현 가능

---

## Phase 3: User Story 1 - 회원사 신청 승인/거부 워크플로우 (Priority: P1) 🎯 MVP

**목표**: SUPER_ADMIN이 PENDING 회원사를 승인/거부할 수 있는 UI 제공

**독립 테스트**: SUPER_ADMIN 로그인 → PENDING 회원사 상세 화면 → 승인/거부 버튼 클릭 → 상태 변경 확인

### Backend Tests (US1)

> **중요**: 테스트 먼저 작성, 실패 확인 후 구현

- [ ] T025 [P] [US1] AdminController 승인 엔드포인트 통합 테스트: `POST /admin/institutions/:id/approve` (`backend/tests/integration/admin-api.spec.ts`)
- [ ] T026 [P] [US1] AdminController 거부 엔드포인트 통합 테스트: `POST /admin/institutions/:id/reject` (`backend/tests/integration/admin-api.spec.ts`)
- [ ] T027 [P] [US1] Institution.approve() 메서드 단위 테스트 (`backend/tests/unit/institution/institution.entity.spec.ts`)
- [ ] T028 [P] [US1] Institution.reject() 메서드 단위 테스트 (`backend/tests/unit/institution/institution.entity.spec.ts`)

### Backend Implementation (US1)

- [ ] T029 [US1] AdminController 승인 로직 검증: PENDING 상태 확인, approvedBy 설정 (`backend/src/institution/interface/controllers/admin.controller.ts`)
- [ ] T030 [US1] AdminController 거부 로직 검증: PENDING 상태 확인, rejectionReason 필수 검증 (`backend/src/institution/interface/controllers/admin.controller.ts`)
- [ ] T031 [US1] 동시성 처리: 승인/거부 시 상태 재확인 (Optimistic Locking) (`backend/src/institution/interface/controllers/admin.controller.ts`)
- [ ] T032 [US1] 구조화된 로깅 추가: 승인/거부 작업 로그 (JSON 포맷) (`backend/src/institution/interface/controllers/admin.controller.ts`)

### Frontend Tests (US1)

- [ ] T033 [P] [US1] ApproveRejectDialog 컴포넌트 테스트 (`frontend/tests/components/ApproveRejectDialog.test.tsx`)
- [ ] T034 [P] [US1] InstitutionDetailCard 컴포넌트 테스트 (`frontend/tests/components/InstitutionDetailCard.test.tsx`)
- [ ] T035 [US1] 회원사 상세 페이지 통합 테스트: 승인/거부 워크플로우 (`frontend/tests/e2e/admin-portal.spec.ts`)

### Frontend Implementation (US1)

- [ ] T036 [P] [US1] Institution API 클라이언트: approveInstitution, rejectInstitution (`frontend/src/lib/api/institutions.ts`)
- [ ] T037 [P] [US1] useInstitutions 훅: useMutation for approve/reject (`frontend/src/lib/hooks/useInstitutions.ts`)
- [ ] T038 [P] [US1] InstitutionStatusBadge 컴포넌트: PENDING/ACTIVE/SUSPENDED/INACTIVE 배지 (`frontend/src/components/institutions/InstitutionStatusBadge.tsx`)
- [ ] T039 [US1] InstitutionDetailCard 컴포넌트: 회원사 상세 정보 표시 (`frontend/src/components/institutions/InstitutionDetailCard.tsx`)
- [ ] T040 [US1] ApproveRejectDialog 컴포넌트: 승인/거부 모달 (`frontend/src/components/institutions/ApproveRejectDialog.tsx`)
- [ ] T041 [US1] 회원사 상세 페이지: `/institutions/:id` 라우트 (`frontend/src/routes/institutions/[id].tsx`)
- [ ] T042 [US1] 승인 버튼 조건부 표시: PENDING 상태에서만 활성화 (`frontend/src/routes/institutions/[id].tsx`)
- [ ] T043 [US1] 거부 사유 입력 폼: Zod 검증, 필수 입력 (`frontend/src/components/institutions/ApproveRejectDialog.tsx`)
- [ ] T044 [US1] 승인/거부 성공 시 알림: Toast 또는 Alert 표시 (`frontend/src/routes/institutions/[id].tsx`)
- [ ] T045 [US1] 에러 핸들링: 동시성 에러 메시지 표시 ("이미 처리된 회원사입니다") (`frontend/src/routes/institutions/[id].tsx`)

**체크포인트**: User Story 1 완료 - 회원사 승인/거부 독립 테스트 가능

---

## Phase 4: User Story 2 - 회원사 상태 관리 (정지/재활성화) (Priority: P1)

**목표**: SUPER_ADMIN이 ACTIVE 회원사를 정지하거나 SUSPENDED 회원사를 재활성화할 수 있는 UI 제공

**독립 테스트**: ACTIVE 회원사 정지 → SUSPENDED 탭에서 확인 → 재활성화 → ACTIVE 탭에서 재확인

### Backend Tests (US2)

- [ ] T046 [P] [US2] AdminController 정지 엔드포인트 통합 테스트: `POST /admin/institutions/:id/suspend` (`backend/tests/integration/admin-api.spec.ts`)
- [ ] T047 [P] [US2] AdminController 재활성화 엔드포인트 통합 테스트: `POST /admin/institutions/:id/reactivate` (`backend/tests/integration/admin-api.spec.ts`)
- [ ] T048 [P] [US2] Institution.suspend() 메서드 단위 테스트 (`backend/tests/unit/institution/institution.entity.spec.ts`)
- [ ] T049 [P] [US2] Institution.reactivate() 메서드 단위 테스트 (`backend/tests/unit/institution/institution.entity.spec.ts`)

### Backend Implementation (US2)

- [ ] T050 [US2] AdminController 정지 로직: ACTIVE 상태 확인, suspensionReason 필수 검증 (`backend/src/institution/interface/controllers/admin.controller.ts`)
- [ ] T051 [US2] AdminController 재활성화 로직: SUSPENDED 상태 확인, reason/suspendedAt null 설정 (`backend/src/institution/interface/controllers/admin.controller.ts`)
- [ ] T052 [US2] 구조화된 로깅: 정지/재활성화 작업 로그 (`backend/src/institution/interface/controllers/admin.controller.ts`)
- [ ] T053 [US2] JwtStrategy 로그인 차단: SUSPENDED 회원사 사용자 로그인 차단 (`backend/src/user/application/strategies/jwt.strategy.ts`)
- [ ] T054 [US2] 로그인 차단 에러 메시지: "회원사가 정지 상태입니다. 관리자에게 문의하세요." (`backend/src/user/application/strategies/jwt.strategy.ts`)

### Frontend Tests (US2)

- [ ] T055 [P] [US2] SuspendReactivateDialog 컴포넌트 테스트 (`frontend/tests/components/SuspendReactivateDialog.test.tsx`)
- [ ] T056 [US2] 정지/재활성화 E2E 테스트 (`frontend/tests/e2e/admin-portal.spec.ts`)

### Frontend Implementation (US2)

- [ ] T057 [P] [US2] Institution API 클라이언트: suspendInstitution, reactivateInstitution (`frontend/src/lib/api/institutions.ts`)
- [ ] T058 [P] [US2] useInstitutions 훅: useMutation for suspend/reactivate (`frontend/src/lib/hooks/useInstitutions.ts`)
- [ ] T059 [US2] SuspendReactivateDialog 컴포넌트: 정지/재활성화 모달 (`frontend/src/components/institutions/SuspendReactivateDialog.tsx`)
- [ ] T060 [US2] 정지 버튼: ACTIVE 상태에서만 표시 (`frontend/src/routes/institutions/[id].tsx`)
- [ ] T061 [US2] 재활성화 버튼: SUSPENDED 상태에서만 표시 (`frontend/src/routes/institutions/[id].tsx`)
- [ ] T062 [US2] 정지 사유 입력 폼: Zod 검증, 필수 입력 (`frontend/src/components/institutions/SuspendReactivateDialog.tsx`)
- [ ] T063 [US2] SUSPENDED 상태 메타데이터 표시: suspensionReason, suspendedAt (`frontend/src/components/institutions/InstitutionDetailCard.tsx`)

**체크포인트**: User Story 2 완료 - 회원사 정지/재활성화 독립 테스트 가능

---

## Phase 5: User Story 3 - 회원사 목록 조회 및 필터링 (Priority: P2)

**목표**: SUPER_ADMIN이 모든 회원사를 조회하고 상태별 필터링, 검색, 페이지네이션 기능 제공

**독립 테스트**: 회원사 관리 메뉴 → 전체 목록 표시 → 상태 필터 → 검색 → 페이지네이션

### Backend Tests (US3)

- [ ] T064 [P] [US3] AdminController 목록 조회 통합 테스트: 상태 필터링 (`backend/tests/integration/admin-api.spec.ts`)
- [ ] T065 [P] [US3] AdminController 페이지네이션 테스트: skip, take 파라미터 (`backend/tests/integration/admin-api.spec.ts`)

### Backend Implementation (US3)

- [ ] T066 [US3] AdminController 검색 기능: 회원사명, 사업자등록번호 부분 일치 검색 추가 (`backend/src/institution/interface/controllers/admin.controller.ts`)
- [ ] T067 [US3] InstitutionRepository 검색 메서드: findBySearchQuery() (`backend/src/institution/infrastructure/persistence/institution.repository.ts`)

### Frontend Tests (US3)

- [ ] T068 [P] [US3] InstitutionList 컴포넌트 테스트: 목록 렌더링, 필터링 (`frontend/tests/components/InstitutionList.test.tsx`)
- [ ] T069 [US3] 회원사 목록 E2E 테스트: 필터, 검색, 페이지네이션 (`frontend/tests/e2e/admin-portal.spec.ts`)

### Frontend Implementation (US3)

- [ ] T070 [P] [US3] Institution API 클라이언트: getAllInstitutions (status, skip, take, search) (`frontend/src/lib/api/institutions.ts`)
- [ ] T071 [P] [US3] useInstitutions 훅: useQuery for list, useInfiniteQuery for pagination (`frontend/src/lib/hooks/useInstitutions.ts`)
- [ ] T072 [P] [US3] InstitutionList 컴포넌트: 회원사 목록 테이블 (`frontend/src/components/institutions/InstitutionList.tsx`)
- [ ] T073 [US3] 회원사 목록 페이지: `/institutions` 라우트 (`frontend/src/routes/institutions/index.tsx`)
- [ ] T074 [US3] 상태 필터 드롭다운: PENDING/ACTIVE/SUSPENDED/INACTIVE/전체 (`frontend/src/routes/institutions/index.tsx`)
- [ ] T075 [US3] 검색 입력창: 실시간 검색 (Debounce 500ms) (`frontend/src/routes/institutions/index.tsx`)
- [ ] T076 [US3] 페이지네이션 컴포넌트: 20개/페이지, 페이지 번호 표시 (`frontend/src/routes/institutions/index.tsx`)
- [ ] T077 [US3] 빈 목록 UI: "현재 회원사가 없습니다" Empty State (`frontend/src/routes/institutions/index.tsx`)
- [ ] T078 [US3] 검색 결과 없음 UI: "검색 결과가 없습니다" (`frontend/src/routes/institutions/index.tsx`)
- [ ] T079 [US3] 로딩 스피너: 목록 로딩 중 Skeleton UI (`frontend/src/routes/institutions/index.tsx`)

**체크포인트**: User Story 3 완료 - 회원사 목록 조회/필터링 독립 테스트 가능

---

## Phase 6: User Story 4 - 요금제 CRUD 및 회원사 구독 연결 (Priority: P2)

**목표**: SUPER_ADMIN이 요금제를 생성/수정/삭제하고, 회원사에 요금제를 할당

**독립 테스트**: 요금제 생성 → 회원사 상세 화면에서 요금제 변경 → 회원사 목록에서 요금제 정보 확인

### Backend Tests (US4)

- [ ] T080 [P] [US4] SubscriptionPlan 엔티티 단위 테스트: 검증 규칙 (`backend/tests/unit/institution/subscription-plan.entity.spec.ts`)
- [ ] T081 [P] [US4] Subscription 엔티티 단위 테스트: 상태 전환 (`backend/tests/unit/institution/subscription.entity.spec.ts`)
- [ ] T082 [P] [US4] SubscriptionPlanService 단위 테스트: CRUD 메서드 (`backend/tests/unit/institution/subscription-plan.service.spec.ts`)
- [ ] T083 [P] [US4] SubscriptionService 단위 테스트: 구독 변경, 이력 관리 (`backend/tests/unit/institution/subscription.service.spec.ts`)
- [ ] T084 [US4] SubscriptionPlan API 통합 테스트: 생성, 조회, 수정, 삭제 (`backend/tests/integration/subscription-plan-api.spec.ts`)
- [ ] T085 [US4] Subscription API 통합 테스트: 회원사 구독 변경, 이력 조회 (`backend/tests/integration/subscription-api.spec.ts`)

### Backend Implementation (US4)

- [ ] T086 [P] [US4] SubscriptionPlan 엔티티 생성 (`backend/src/institution/domain/entities/subscription-plan.entity.ts`)
- [ ] T087 [P] [US4] Subscription 엔티티 생성 (`backend/src/institution/domain/entities/subscription.entity.ts`)
- [ ] T088 [P] [US4] ISubscriptionPlanRepository 인터페이스 (`backend/src/institution/domain/repositories/subscription-plan.repository.interface.ts`)
- [ ] T089 [P] [US4] ISubscriptionRepository 인터페이스 (`backend/src/institution/domain/repositories/subscription.repository.interface.ts`)
- [ ] T090 [P] [US4] SubscriptionPlanRepository 구현 (`backend/src/institution/infrastructure/persistence/subscription-plan.repository.ts`)
- [ ] T091 [P] [US4] SubscriptionRepository 구현 (`backend/src/institution/infrastructure/persistence/subscription.repository.ts`)
- [ ] T092 [US4] SubscriptionPlanService 구현: create, findAll, findById, update, deactivate (`backend/src/institution/application/services/subscription-plan.service.ts`)
- [ ] T093 [US4] SubscriptionService 구현: changeSubscription, getSubscriptionHistory (`backend/src/institution/application/services/subscription.service.ts`)
- [ ] T094 [US4] SubscriptionPlanController 생성: CRUD 엔드포인트 (`backend/src/institution/interface/controllers/subscription-plan.controller.ts`)
- [ ] T095 [US4] SubscriptionController 생성: 회원사별 구독 관리 엔드포인트 (`backend/src/institution/interface/controllers/subscription.controller.ts`)
- [ ] T096 [US4] InstitutionModule 업데이트: SubscriptionPlan, Subscription Provider 등록 (`backend/src/institution/institution.module.ts`)
- [ ] T097 [US4] Soft Delete 로직: SubscriptionPlan 비활성화 시 사용 중인지 검증 (`backend/src/institution/application/services/subscription-plan.service.ts`)
- [ ] T098 [US4] 회원사 승인 시 기본 요금제 자동 할당 (`backend/src/institution/interface/controllers/admin.controller.ts`)

### Frontend Tests (US4)

- [ ] T099 [P] [US4] SubscriptionPlanForm 컴포넌트 테스트 (`frontend/tests/components/SubscriptionPlanForm.test.tsx`)
- [ ] T100 [P] [US4] SubscriptionPlanList 컴포넌트 테스트 (`frontend/tests/components/SubscriptionPlanList.test.tsx`)
- [ ] T101 [US4] 요금제 CRUD E2E 테스트 (`frontend/tests/e2e/admin-portal.spec.ts`)

### Frontend Implementation (US4)

- [ ] T102 [P] [US4] SubscriptionPlan API 클라이언트: CRUD 메서드 (`frontend/src/lib/api/subscription-plans.ts`)
- [ ] T103 [P] [US4] Subscription API 클라이언트: changeSubscription, getHistory (`frontend/src/lib/api/subscriptions.ts`)
- [ ] T104 [P] [US4] useSubscriptionPlans 훅: useQuery, useMutation (`frontend/src/lib/hooks/useSubscriptionPlans.ts`)
- [ ] T105 [P] [US4] SubscriptionPlan Zod 스키마: 생성/수정 검증 (`frontend/src/lib/schemas/subscription-plan.schema.ts`)
- [ ] T106 [P] [US4] SubscriptionPlanForm 컴포넌트: React Hook Form + Zod (`frontend/src/components/subscription-plans/SubscriptionPlanForm.tsx`)
- [ ] T107 [P] [US4] SubscriptionPlanList 컴포넌트: 요금제 목록 테이블 (`frontend/src/components/subscription-plans/SubscriptionPlanList.tsx`)
- [ ] T108 [US4] 요금제 목록 페이지: `/subscription-plans` 라우트 (`frontend/src/routes/subscription-plans/index.tsx`)
- [ ] T109 [US4] 요금제 생성 페이지: `/subscription-plans/new` 라우트 (`frontend/src/routes/subscription-plans/new.tsx`)
- [ ] T110 [US4] 요금제 상세/수정 페이지: `/subscription-plans/:id` 라우트 (`frontend/src/routes/subscription-plans/[id].tsx`)
- [ ] T111 [US4] 회원사 상세 화면에 구독 정보 표시 (`frontend/src/components/institutions/InstitutionDetailCard.tsx`)
- [ ] T112 [US4] 회원사 구독 변경 모달: 요금제 선택 드롭다운 (`frontend/src/components/institutions/ChangeSubscriptionDialog.tsx`)
- [ ] T113 [US4] 요금제 삭제 시 경고 메시지: "사용 중인 회원사가 있습니다" (`frontend/src/routes/subscription-plans/[id].tsx`)

**체크포인트**: User Story 4 완료 - 요금제 CRUD 및 구독 연결 독립 테스트 가능

---

## Phase 7: User Story 5 - 시스템 사용자 관리 (SUPER_ADMIN 전용) (Priority: P3)

**목표**: SUPER_ADMIN이 다른 SUPER_ADMIN 계정을 생성하거나 비활성화

**독립 테스트**: 새 SUPER_ADMIN 생성 → 로그아웃 → 새 계정 로그인 → Admin Portal 접근 확인

### Backend Tests (US5)

- [ ] T114 [P] [US5] UserService SUPER_ADMIN CRUD 단위 테스트 (`backend/tests/unit/user/user.service.spec.ts`)
- [ ] T115 [US5] User API 통합 테스트: 생성, 비활성화 (`backend/tests/integration/user-api.spec.ts`)

### Backend Implementation (US5)

- [ ] T116 [P] [US5] User 엔티티 업데이트: isActive 필드 추가 (`backend/src/user/domain/entities/user.entity.ts`)
- [ ] T117 [US5] UserService SUPER_ADMIN 생성 메서드: createSuperAdmin() (`backend/src/user/application/services/user.service.ts`)
- [ ] T118 [US5] UserService SUPER_ADMIN 비활성화 메서드: deactivateUser() (`backend/src/user/application/services/user.service.ts`)
- [ ] T119 [US5] UserService 본인 계정 비활성화 차단 로직 (`backend/src/user/application/services/user.service.ts`)
- [ ] T120 [US5] UserController 생성: SUPER_ADMIN 관리 엔드포인트 (`backend/src/user/interface/controllers/user.controller.ts`)
- [ ] T121 [US5] UserModule 업데이트: UserController 등록 (`backend/src/user/user.module.ts`)
- [ ] T122 [US5] isActive=false 사용자 로그인 차단: JwtStrategy 수정 (`backend/src/user/application/strategies/jwt.strategy.ts`)

### Frontend Tests (US5)

- [ ] T123 [US5] 시스템 사용자 관리 E2E 테스트 (`frontend/tests/e2e/admin-portal.spec.ts`)

### Frontend Implementation (US5)

- [ ] T124 [P] [US5] User API 클라이언트: getAllSuperAdmins, createSuperAdmin, deactivateUser (`frontend/src/lib/api/users.ts`)
- [ ] T125 [P] [US5] useUsers 훅: useQuery, useMutation (`frontend/src/lib/hooks/useUsers.ts`)
- [ ] T126 [P] [US5] User Zod 스키마: SUPER_ADMIN 생성 검증 (이메일, 비밀번호 8자 이상) (`frontend/src/lib/schemas/user.schema.ts`)
- [ ] T127 [US5] 시스템 사용자 페이지: `/users` 라우트 (`frontend/src/routes/users/index.tsx`)
- [ ] T128 [US5] SUPER_ADMIN 생성 모달: 이메일, 비밀번호 입력 (`frontend/src/components/users/CreateSuperAdminDialog.tsx`)
- [ ] T129 [US5] SUPER_ADMIN 비활성화 버튼: 본인 계정은 비활성화 불가 (버튼 숨김) (`frontend/src/routes/users/index.tsx`)

**체크포인트**: User Story 5 완료 - 시스템 사용자 관리 독립 테스트 가능

---

## Phase 8: User Story 6 - Admin 대시보드 (통계 요약) (Priority: P3)

**목표**: SUPER_ADMIN이 로그인 후 대시보드에서 주요 통계 확인

**독립 테스트**: Admin Portal 로그인 → 대시보드 카드 숫자 확인 → DB 데이터와 일치 확인

### Backend Tests (US6)

- [ ] T130 [US6] Dashboard 통계 API 통합 테스트 (`backend/tests/integration/admin-api.spec.ts`)

### Backend Implementation (US6)

- [ ] T131 [US6] DashboardService 생성: getStatistics() 메서드 (`backend/src/institution/application/services/dashboard.service.ts`)
- [ ] T132 [US6] DashboardController 생성: 통계 엔드포인트 (`backend/src/institution/interface/controllers/dashboard.controller.ts`)
- [ ] T133 [US6] InstitutionModule 업데이트: DashboardController 등록 (`backend/src/institution/institution.module.ts`)

### Frontend Tests (US6)

- [ ] T134 [P] [US6] StatisticsCard 컴포넌트 테스트 (`frontend/tests/components/StatisticsCard.test.tsx`)
- [ ] T135 [US6] 대시보드 E2E 테스트 (`frontend/tests/e2e/admin-portal.spec.ts`)

### Frontend Implementation (US6)

- [ ] T136 [P] [US6] Dashboard API 클라이언트: getStatistics() (`frontend/src/lib/api/dashboard.ts`)
- [ ] T137 [P] [US6] useDashboard 훅: useQuery for statistics (`frontend/src/lib/hooks/useDashboard.ts`)
- [ ] T138 [P] [US6] StatisticsCard 컴포넌트: 통계 카드 UI (`frontend/src/components/dashboard/StatisticsCard.tsx`)
- [ ] T139 [US6] 대시보드 페이지: `/dashboard` 라우트 (`frontend/src/routes/dashboard.tsx`)
- [ ] T140 [US6] 통계 카드 4개: 전체 회원사, PENDING, ACTIVE, SUSPENDED (`frontend/src/routes/dashboard.tsx`)
- [ ] T141 [US6] 카드 클릭 시 네비게이션: 해당 상태 회원사 목록으로 이동 (`frontend/src/routes/dashboard.tsx`)
- [ ] T142 [US6] 이번 달 신규 가입 그래프 (Optional): Chart.js 또는 Recharts (`frontend/src/routes/dashboard.tsx`)

**체크포인트**: User Story 6 완료 - Admin 대시보드 독립 테스트 가능

---

## Phase 9: 통합 및 품질 관리

**목적**: 모든 사용자 스토리를 통합하고 교차 검증, 성능 최적화, 문서화

### E2E 통합 테스트

- [ ] T143 [P] Admin Portal 전체 워크플로우 E2E 테스트: 로그인 → 대시보드 → 회원사 관리 → 요금제 관리 (`frontend/tests/e2e/admin-portal.spec.ts`)
- [ ] T144 [P] 권한 검증 E2E 테스트: SUPER_ADMIN만 접근 가능 확인 (`frontend/tests/e2e/admin-portal.spec.ts`)
- [ ] T145 [P] 모바일 반응형 E2E 테스트: Chrome Mobile Emulation (`frontend/tests/e2e/admin-portal.spec.ts`)

### 성능 최적화

- [ ] T146 [P] React 컴포넌트 메모이제이션: useMemo, useCallback 적용 (`frontend/src/`)
- [ ] T147 [P] TanStack Query 캐시 전략 최적화: staleTime, cacheTime 설정 (`frontend/src/lib/query-client.ts`)
- [ ] T148 [P] 이미지 및 아이콘 최적화: Lucide React 트리 쉐이킹 (`frontend/vite.config.ts`)
- [ ] T149 [P] API 응답 시간 측정: NestJS Interceptor로 로그 기록 (`backend/src/`)

### 보안 강화

- [ ] T150 [P] XSS 방지: React의 기본 이스케이프 확인, dangerouslySetInnerHTML 제거
- [ ] T151 [P] CSRF 토큰 검증: NestJS CSRF Guard 추가 (Optional)
- [ ] T152 [P] Rate Limiting: @nestjs/throttler 적용 (`backend/src/main.ts`)

### 문서화

- [ ] T153 [P] API 문서 생성: Swagger UI 활성화 (`backend/src/main.ts`)
- [ ] T154 [P] Frontend 컴포넌트 Storybook 생성 (Optional)
- [ ] T155 [P] README 업데이트: Phase 12 개발 환경 설정, 실행 방법 (`README.md`)

### 코드 품질

- [ ] T156 [P] ESLint 검사 통과: `npm run lint` (Backend, Frontend)
- [ ] T157 [P] TypeScript 타입 에러 제거: `npx tsc --noEmit` (Backend, Frontend)
- [ ] T158 [P] 테스트 커버리지 확인: Jest/Vitest coverage report 생성
- [ ] T159 [P] 코드 리뷰 체크리스트: 헌장 준수 확인 (DDD, TDD, 로깅)

### 배포 준비

- [ ] T160 [P] Frontend 빌드 최적화: `npm run build`, 번들 크기 확인 (`frontend/`)
- [ ] T161 [P] Backend 프로덕션 빌드: `npm run build` (`backend/`)
- [ ] T162 [P] Docker 이미지 생성: Dockerfile 작성 (Backend, Frontend)
- [ ] T163 [P] 환경변수 문서화: `.env.example` 파일 업데이트

**체크포인트**: Phase 12 전체 완료 - 프로덕션 배포 준비 완료

---

## 의존성 및 실행 순서

### Phase 간 의존성

- **Setup (Phase 1)**: 의존성 없음 - 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 - **모든 사용자 스토리를 차단**
- **User Stories (Phase 3-8)**: Foundational 완료 후 시작
  - 사용자 스토리는 병렬 진행 가능 (팀 리소스가 충분하다면)
  - 또는 우선순위 순서대로 순차 진행 (P1 → P1 → P2 → P2 → P3 → P3)
- **통합 및 품질 관리 (Phase 9)**: 원하는 사용자 스토리 모두 완료 후 시작

### 사용자 스토리 간 의존성

- **User Story 1 (P1)**: Foundational 이후 시작 가능 - 다른 스토리 의존성 없음
- **User Story 2 (P1)**: Foundational 이후 시작 가능 - US1과 병렬 가능
- **User Story 3 (P2)**: Foundational 이후 시작 가능 - US1, US2와 병렬 가능
- **User Story 4 (P2)**: Foundational 이후 시작 가능 - US1-3과 병렬 가능
- **User Story 5 (P3)**: Foundational 이후 시작 가능 - US1-4와 병렬 가능
- **User Story 6 (P3)**: Foundational 이후 시작 가능 - US1-5와 병렬 가능

### 각 사용자 스토리 내부 순서

- 테스트 작성 → 테스트 실패 확인 → 구현
- Backend 모델 → Backend 서비스 → Backend 컨트롤러
- Frontend 타입 → Frontend API 클라이언트 → Frontend 훅 → Frontend 컴포넌트
- 핵심 구현 → 통합 → 에러 핸들링 → 로깅
- 스토리 완료 후 다음 우선순위 스토리로 이동

### 병렬 실행 기회

- Setup Phase의 모든 [P] 태스크 (T003-T007, T009)
- Foundational Phase의 모든 [P] 태스크 (T016-T024)
- Foundational 완료 후 모든 사용자 스토리 병렬 시작 (팀 리소스 충분 시)
- 각 스토리 내 테스트 태스크 [P] 병렬 실행
- 각 스토리 내 Backend 모델/Frontend 컴포넌트 [P] 병렬 실행

---

## 병렬 실행 예시: User Story 1

```bash
# US1 Backend 테스트 병렬 실행:
T025: AdminController 승인 엔드포인트 통합 테스트
T026: AdminController 거부 엔드포인트 통합 테스트
T027: Institution.approve() 단위 테스트
T028: Institution.reject() 단위 테스트

# US1 Frontend 테스트 병렬 실행:
T033: ApproveRejectDialog 컴포넌트 테스트
T034: InstitutionDetailCard 컴포넌트 테스트

# US1 Frontend 구현 병렬 실행:
T036: Institution API 클라이언트 (approveInstitution, rejectInstitution)
T037: useInstitutions 훅 (useMutation)
T038: InstitutionStatusBadge 컴포넌트
```

---

## 구현 전략

### MVP 우선 (User Story 1-2만 구현)

1. Phase 1 완료: Setup
2. Phase 2 완료: Foundational (중요 - 모든 스토리를 차단)
3. Phase 3 완료: User Story 1 (회원사 승인/거부)
4. Phase 4 완료: User Story 2 (회원사 정지/재활성화)
5. **중단 후 검증**: US1-2 독립 테스트
6. 배포/데모 준비

### 점진적 배포

1. Setup + Foundational 완료 → 기반 준비 완료
2. US1 추가 → 독립 테스트 → 배포/데모 (MVP!)
3. US2 추가 → 독립 테스트 → 배포/데모
4. US3 추가 → 독립 테스트 → 배포/데모
5. US4 추가 → 독립 테스트 → 배포/데모
6. US5 추가 → 독립 테스트 → 배포/데모
7. US6 추가 → 독립 테스트 → 배포/데모
8. 각 스토리가 이전 스토리를 깨뜨리지 않고 가치를 추가

### 병렬 팀 전략

여러 개발자가 있을 경우:

1. 팀이 Setup + Foundational을 함께 완료
2. Foundational 완료 후:
   - 개발자 A: User Story 1 (회원사 승인/거부)
   - 개발자 B: User Story 2 (회원사 정지/재활성화)
   - 개발자 C: User Story 3 (회원사 목록)
   - 개발자 D: User Story 4 (요금제 CRUD)
3. 스토리 완료 후 독립적으로 통합 및 검증

---

## 참고사항

- **[P] 태스크**: 다른 파일, 의존성 없음 - 병렬 실행 가능
- **[Story] 레이블**: 사용자 스토리별 추적 가능성 확보
- 각 사용자 스토리는 독립적으로 완료 및 테스트 가능해야 함
- 테스트 실패 확인 후 구현 (TDD)
- 각 태스크 또는 논리적 그룹 완료 후 커밋
- 체크포인트에서 스토리 독립 검증
- 피해야 할 것: 모호한 태스크, 같은 파일 충돌, 스토리 독립성을 깨는 의존성

---

## 총 태스크 수: 163개

### 사용자 스토리별 태스크 수

- **Setup (Phase 1)**: 9개
- **Foundational (Phase 2)**: 15개
- **User Story 1 (P1)**: 21개 (테스트 4개, Backend 구현 4개, Frontend 테스트 3개, Frontend 구현 10개)
- **User Story 2 (P1)**: 18개 (테스트 4개, Backend 구현 5개, Frontend 테스트 2개, Frontend 구현 7개)
- **User Story 3 (P2)**: 16개 (테스트 2개, Backend 구현 2개, Frontend 테스트 2개, Frontend 구현 10개)
- **User Story 4 (P2)**: 34개 (테스트 6개, Backend 구현 13개, Frontend 테스트 3개, Frontend 구현 12개)
- **User Story 5 (P3)**: 16개 (테스트 2개, Backend 구현 7개, Frontend 테스트 1개, Frontend 구현 6개)
- **User Story 6 (P3)**: 13개 (테스트 2개, Backend 구현 3개, Frontend 테스트 2개, Frontend 구현 6개)
- **통합 및 품질 관리 (Phase 9)**: 21개

### 병렬 실행 기회

- Setup Phase: 7개 병렬 태스크
- Foundational Phase: 15개 병렬 태스크
- User Story 1-6: Foundational 완료 후 전체 병렬 가능 (6개 스토리 동시 진행)
- 각 스토리 내부: 테스트 태스크, 모델 태스크 등 병렬 실행

### MVP 범위 (권장)

**User Story 1 + User Story 2 (P1 우선순위)**
- 총 태스크: Setup (9) + Foundational (15) + US1 (21) + US2 (18) = **63개 태스크**
- 예상 기간: 2-3주 (1명 개발자 기준)
- 배포 가능한 최소 기능: 회원사 승인/거부, 정지/재활성화 워크플로우

### 독립 테스트 기준

- **US1**: PENDING 회원사 승인/거부 → 상태 변경 확인
- **US2**: ACTIVE 회원사 정지 → SUSPENDED 탭 확인 → 재활성화 확인
- **US3**: 회원사 목록 필터링, 검색, 페이지네이션 동작 확인
- **US4**: 요금제 생성 → 회원사에 할당 → 목록에서 확인
- **US5**: SUPER_ADMIN 생성 → 새 계정 로그인 확인
- **US6**: 대시보드 통계 숫자가 DB 데이터와 일치

### 포맷 검증

✅ 모든 163개 태스크가 체크리스트 포맷 준수:
- `- [ ] [TaskID] [P?] [Story?] 설명 with 파일 경로`
- TaskID: T001 ~ T163 (순차 번호)
- [P] 마커: 병렬 가능한 태스크에만 표시
- [Story] 레이블: US1 ~ US6 (사용자 스토리 Phase에만 표시)
- 파일 경로: 모든 구현 태스크에 정확한 경로 포함
