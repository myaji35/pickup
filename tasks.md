# Pickup MVP Tasks

## Phase 11: SaaS Admin & 회원사 관리 시스템

### Backend Tasks

#### T413-T430: User Context & Authentication

**T413-T415: User Domain Layer**
- [ ] T413: User Entity 생성
  - id, email, password, role, institutionId, name, isActive
  - validateEmail(), validatePassword() 메서드
- [ ] T414: UserRole enum 정의 (SUPER_ADMIN, INSTITUTION_ADMIN, DRIVER)
- [ ] T415: IUserRepository interface 정의

**T416-T420: Authentication Service**
- [ ] T416: AuthService 생성 (login, register, refresh)
- [ ] T417: Password hashing (bcrypt) 유틸리티
- [ ] T418: JWT 토큰 생성/검증 유틸리티
- [ ] T419: JwtStrategy (Passport.js)
- [ ] T420: JwtAuthGuard 생성

**T421-T425: Authorization**
- [ ] T421: RolesGuard 생성 (Role 기반 접근 제어)
- [ ] T422: @Roles() 데코레이터
- [ ] T423: @CurrentUser() 데코레이터
- [ ] T424: Public 엔드포인트 데코레이터
- [ ] T425: UserRepository 구현 (Prisma)

**T426-T430: Auth API**
- [ ] T426: POST /auth/login - 로그인
- [ ] T427: POST /auth/register - 회원가입 (Institution 동시 생성)
- [ ] T428: POST /auth/refresh - 토큰 갱신
- [ ] T429: POST /auth/logout - 로그아웃
- [ ] T430: GET /auth/me - 현재 사용자 정보

#### T431-T445: Institution Status Management

**T431-T435: Institution Domain 확장**
- [ ] T431: InstitutionStatus enum 추가 (PENDING, ACTIVE, SUSPENDED, INACTIVE)
- [ ] T432: Institution Entity 확장
  - status, rejectionReason, approvedAt, approvedBy, suspendedAt, suspensionReason
- [ ] T433: Institution.approve() 메서드
- [ ] T434: Institution.reject() 메서드
- [ ] T435: Institution.suspend() 메서드

**T436-T440: Institution Service 확장**
- [ ] T436: ApproveInstitutionCommand 생성
- [ ] T437: RejectInstitutionCommand 생성
- [ ] T438: SuspendInstitutionCommand 생성
- [ ] T439: InstitutionService.approve() 구현
- [ ] T440: InstitutionService.reject/suspend() 구현

**T441-T445: Institution Repository 확장**
- [ ] T441: findByStatus() 메서드 추가
- [ ] T442: findPendingInstitutions() 메서드
- [ ] T443: updateStatus() 메서드
- [ ] T444: Prisma Schema 업데이트 (status 필드 추가)
- [ ] T445: Migration 생성 및 실행

#### T446-T465: Subscription & Plan

**T446-T450: Plan Domain Layer**
- [ ] T446: Plan Entity 생성
  - id, name, code, maxVehicles, maxPassengers, monthlyPrice, features, isActive
- [ ] T447: IPlanRepository interface
- [ ] T448: PlanRepository 구현
- [ ] T449: Prisma Schema에 Plan 모델 추가
- [ ] T450: Plan seed data 생성 (스타터, 프로, 엔터프라이즈)

**T451-T455: Subscription Domain Layer**
- [ ] T451: Subscription Entity 생성
  - id, institutionId, planId, status, startDate, endDate, trialEndsAt, autoRenew
- [ ] T452: SubscriptionStatus enum (TRIAL, ACTIVE, EXPIRED, CANCELLED)
- [ ] T453: Subscription.isActive() 메서드
- [ ] T454: ISubscriptionRepository interface
- [ ] T455: SubscriptionRepository 구현

**T456-T460: Subscription Service**
- [ ] T456: SubscriptionService 생성
- [ ] T457: createSubscription() - 회원사 승인 시 자동 생성
- [ ] T458: upgradeSubscription() - 요금제 업그레이드
- [ ] T459: cancelSubscription() - 구독 취소
- [ ] T460: checkSubscriptionLimits() - 사용 한도 체크

**T461-T465: Plan & Subscription API**
- [ ] T461: GET /plans - 요금제 목록 (Public)
- [ ] T462: GET /institutions/me/subscription - 내 구독 정보
- [ ] T463: POST /institutions/me/subscription/upgrade - 요금제 업그레이드
- [ ] T464: Prisma Schema에 Subscription 모델 추가
- [ ] T465: Migration 생성 및 실행

#### T466-T490: Admin API

**T466-T475: Admin Institution Management**
- [ ] T466: GET /admin/institutions - 전체 회원사 목록
- [ ] T467: GET /admin/institutions/pending - 승인 대기 목록
- [ ] T468: GET /admin/institutions/:id - 회원사 상세
- [ ] T469: POST /admin/institutions/:id/approve - 회원사 승인
- [ ] T470: POST /admin/institutions/:id/reject - 회원사 거부
- [ ] T471: POST /admin/institutions/:id/suspend - 회원사 정지
- [ ] T472: POST /admin/institutions/:id/reactivate - 회원사 재활성화
- [ ] T473: PATCH /admin/institutions/:id - 회원사 정보 수정
- [ ] T474: AdminInstitutionController 생성
- [ ] T475: @Roles(SUPER_ADMIN) Guard 적용

**T476-T480: Admin User Management**
- [ ] T476: GET /admin/users - 전체 사용자 목록
- [ ] T477: POST /admin/users - 사용자 생성 (SUPER_ADMIN만)
- [ ] T478: PATCH /admin/users/:id - 사용자 정보 수정
- [ ] T479: DELETE /admin/users/:id - 사용자 삭제
- [ ] T480: AdminUserController 생성

**T481-T485: Admin Plan Management**
- [ ] T481: GET /admin/plans - 요금제 목록
- [ ] T482: POST /admin/plans - 요금제 생성
- [ ] T483: PATCH /admin/plans/:id - 요금제 수정
- [ ] T484: DELETE /admin/plans/:id - 요금제 삭제
- [ ] T485: AdminPlanController 생성

**T486-T490: Admin Statistics API**
- [ ] T486: GET /admin/stats/overview - 전체 통계
  - 회원사 수 (ACTIVE, PENDING, SUSPENDED)
  - 총 차량 수, 총 승객 수
  - 이번 달 신규 가입
- [ ] T487: GET /admin/stats/institutions - 회원사별 사용 현황
- [ ] T488: GET /admin/stats/revenue - 매출 통계 (구독 기반)
- [ ] T489: GET /admin/institutions/:id/stats - 특정 회원사 통계
- [ ] T490: AdminStatsController 생성

#### T491-T495: Institution Self-Service API

- [ ] T491: GET /institutions/me - 내 회원사 정보
- [ ] T492: PATCH /institutions/me - 내 회원사 정보 수정
- [ ] T493: GET /institutions/me/users - 내 회원사 사용자 목록
- [ ] T494: POST /institutions/me/users - 사용자 초대 (INSTITUTION_ADMIN만)
- [ ] T495: GET /institutions/me/stats - 내 회원사 통계

#### T496-T500: Database & Testing

- [ ] T496: 전체 Prisma Schema 최종 검토
- [ ] T497: Seed 스크립트 작성
  - SUPER_ADMIN 계정 (admin@pickup.com / password)
  - 기본 요금제 3개
  - 테스트 회원사 2개 (ACTIVE, PENDING)
- [ ] T498: Unit Tests 작성 (Auth, Institution, Subscription)
- [ ] T499: Integration Tests 작성 (Admin API)
- [ ] T500: E2E Tests 작성 (승인 플로우)

---

### Frontend Tasks

#### T501-T515: 메인 랜딩 페이지

**T501-T505: Layout & Navigation**
- [ ] T501: 랜딩 페이지 레이아웃 생성 (`app/(marketing)/page.tsx`)
- [ ] T502: Navbar 컴포넌트 (로고, 메뉴, 로그인/회원가입 버튼)
- [ ] T503: Footer 컴포넌트 (회사 정보, 링크)
- [ ] T504: Marketing 레이아웃 적용
- [ ] T505: 반응형 디자인 (모바일/태블릿/데스크톱)

**T506-T510: Content Sections**
- [ ] T506: Hero Section
  - 메인 헤드라인: "Pickup - 스마트 송영 관리 플랫폼"
  - 서브 헤드라인
  - CTA 버튼 (무료 체험 시작)
  - Hero 이미지/일러스트
- [ ] T507: Features Section
  - 차량 관리 카드
  - 승객 관리 카드
  - 실시간 추적 카드
  - 케어 시간 검증 카드
- [ ] T508: Pricing Section
  - 요금제 카드 (스타터, 프로, 엔터프라이즈)
  - 기능 비교표
  - 가격 표시
- [ ] T509: Testimonials Section (추후 구현)
- [ ] T510: CTA Section (하단 회원가입 유도)

**T511-T515: Animations & Polish**
- [ ] T511: Framer Motion 애니메이션 추가
- [ ] T512: Scroll 애니메이션
- [ ] T513: SEO 메타데이터 설정
- [ ] T514: OG 이미지 생성
- [ ] T515: 다크 모드 지원 (선택)

#### T516-T535: Authentication UI

**T516-T520: Auth Pages**
- [ ] T516: 로그인 페이지 (`app/(auth)/login/page.tsx`)
- [ ] T517: 회원가입 페이지 (`app/(auth)/register/page.tsx`)
  - 개인 정보 (이름, 이메일, 비밀번호)
  - 회원사 정보 (회원사명, 사업자등록번호)
- [ ] T518: 비밀번호 재설정 페이지 (추후 구현)
- [ ] T519: Auth 레이아웃 (중앙 정렬, 로고)
- [ ] T520: Form Validation (Zod schemas)

**T521-T525: Auth Hooks & API**
- [ ] T521: useAuth Hook (login, register, logout, refresh)
- [ ] T522: Auth Context Provider
- [ ] T523: useCurrentUser Hook
- [ ] T524: Protected Route 컴포넌트
- [ ] T525: Role-based Route Guard

**T526-T530: Auth State Management**
- [ ] T526: Auth store (Zustand or Context)
- [ ] T527: Token 저장/관리 (localStorage + httpOnly cookie)
- [ ] T528: Automatic token refresh
- [ ] T529: Login redirect logic
- [ ] T530: Logout and cleanup

**T531-T535: Auth UI Components**
- [ ] T531: LoginForm 컴포넌트
- [ ] T532: RegisterForm 컴포넌트
- [ ] T533: PasswordInput 컴포넌트 (show/hide)
- [ ] T534: Auth 에러 처리 및 토스트
- [ ] T535: 로그인 상태 Navbar 업데이트

#### T536-T565: Admin 대시보드

**T536-T545: Admin Layout**
- [ ] T536: Admin 레이아웃 생성 (`app/(admin)/layout.tsx`)
- [ ] T537: Sidebar Navigation
  - 대시보드 홈
  - 회원사 관리
  - 승인 대기 (Badge)
  - 사용자 관리
  - 요금제 관리
  - 통계
- [ ] T538: Topbar (사용자 정보, 로그아웃)
- [ ] T539: Breadcrumb 컴포넌트
- [ ] T540: Admin Guard (SUPER_ADMIN만 접근)
- [ ] T541: Admin 레이아웃 반응형
- [ ] T542: Sidebar 접기/펼치기
- [ ] T543: Admin 테마 설정
- [ ] T544: Quick Actions 버튼
- [ ] T545: Notification Center (추후 구현)

**T546-T555: Dashboard Home**
- [ ] T546: Admin 대시보드 홈 페이지 (`app/(admin)/admin/page.tsx`)
- [ ] T547: KPI 카드 그리드
  - 전체 회원사 수
  - 승인 대기 건수
  - 이번 달 신규 가입
  - 총 차량 수
  - 총 승객 수
  - 이번 달 매출 (구독 기반)
- [ ] T548: 최근 가입 회원사 목록
- [ ] T549: 승인 대기 Quick Actions
- [ ] T550: 통계 차트 (Chart.js or Recharts)
  - 월별 신규 가입 추이
  - 회원사 상태 분포
- [ ] T551: 활동 로그 목록
- [ ] T552: useAdminStats Hook
- [ ] T553: StatCard 컴포넌트
- [ ] T554: RecentInstitutions 컴포넌트
- [ ] T555: ActivityLog 컴포넌트

**T556-T565: 회원사 승인 관리**
- [ ] T556: 승인 대기 페이지 (`app/(admin)/admin/institutions/pending/page.tsx`)
- [ ] T557: 승인 대기 테이블
  - 회원사명
  - 사업자등록번호
  - 신청일
  - 상태
  - 액션 버튼
- [ ] T558: 회원사 상세 모달
  - 기본 정보 표시
  - 승인/거부 버튼
- [ ] T559: 승인 확인 다이얼로그
  - 초기 요금제 선택
  - 승인 확인 버튼
- [ ] T560: 거부 확인 다이얼로그
  - 거부 사유 입력
  - 거부 확인 버튼
- [ ] T561: useApproveInstitution Hook
- [ ] T562: useRejectInstitution Hook
- [ ] T563: PendingInstitutionsTable 컴포넌트
- [ ] T564: InstitutionDetailModal 컴포넌트
- [ ] T565: ApprovalDialog 컴포넌트

#### T566-T585: 회원사 목록 관리

**T566-T575: Institution List**
- [ ] T566: 회원사 목록 페이지 (`app/(admin)/admin/institutions/page.tsx`)
- [ ] T567: 필터링 UI
  - 상태 필터 (전체, PENDING, ACTIVE, SUSPENDED)
  - 요금제 필터
  - 가입일 범위
- [ ] T568: 검색 UI (회원사명, 사업자등록번호)
- [ ] T569: 회원사 테이블
  - 회원사명
  - 상태 Badge
  - 요금제
  - 차량 수 / 승객 수
  - 가입일
  - 구독 만료일
  - 액션 (상세, 정지, 수정)
- [ ] T570: 정렬 기능 (가입일, 회원사명)
- [ ] T571: 페이지네이션
- [ ] T572: useInstitutions Hook (필터, 검색, 정렬)
- [ ] T573: InstitutionFilters 컴포넌트
- [ ] T574: InstitutionsTable 컴포넌트
- [ ] T575: InstitutionStatusBadge 컴포넌트

**T576-T585: Institution Detail**
- [ ] T576: 회원사 상세 페이지 (`app/(admin)/admin/institutions/[id]/page.tsx`)
- [ ] T577: 기본 정보 섹션
  - 회원사명
  - 사업자등록번호
  - 상태
  - 승인일/승인자
  - 생성일
- [ ] T578: 구독 정보 섹션
  - 현재 요금제
  - 구독 상태
  - 시작일/종료일
  - 자동 갱신 여부
- [ ] T579: 사용 현황 섹션
  - 차량 수 / 승객 수
  - 사용률 그래프
- [ ] T580: 사용자 목록 섹션
  - 이름, 이메일, 역할, 마지막 로그인
- [ ] T581: 액션 버튼
  - 정지/재활성화
  - 정보 수정
  - 요금제 변경
- [ ] T582: 정지 확인 다이얼로그 (정지 사유 입력)
- [ ] T583: useSuspendInstitution Hook
- [ ] T584: useReactivateInstitution Hook
- [ ] T585: InstitutionDetailLayout 컴포넌트

#### T586-T600: 시스템 사용자 관리

**T586-T595: User Management**
- [ ] T586: 사용자 목록 페이지 (`app/(admin)/admin/users/page.tsx`)
- [ ] T587: 사용자 테이블
  - 이름
  - 이메일
  - 역할 (Badge)
  - 소속 회원사
  - 마지막 로그인
  - 상태 (활성/비활성)
  - 액션 (수정, 삭제)
- [ ] T588: 사용자 필터링 (역할, 소속 회원사, 상태)
- [ ] T589: 사용자 검색 (이름, 이메일)
- [ ] T590: 사용자 추가 버튼
- [ ] T591: 사용자 추가 다이얼로그
  - 이름, 이메일, 비밀번호
  - 역할 선택
  - 소속 회원사 선택 (INSTITUTION_ADMIN/DRIVER만)
- [ ] T592: 사용자 수정 다이얼로그
- [ ] T593: 사용자 삭제 확인 다이얼로그
- [ ] T594: useUsers Hook
- [ ] T595: useCreateUser, useUpdateUser, useDeleteUser Hooks

**T596-T600: User Management Components**
- [ ] T596: UsersTable 컴포넌트
- [ ] T597: UserRoleBadge 컴포넌트
- [ ] T598: UserFormDialog 컴포넌트 (추가/수정 공용)
- [ ] T599: UserFilters 컴포넌트
- [ ] T600: DeleteUserDialog 컴포넌트

#### T601-T615: 요금제 관리

**T601-T610: Plan Management**
- [ ] T601: 요금제 목록 페이지 (`app/(admin)/admin/plans/page.tsx`)
- [ ] T602: 요금제 카드 그리드
  - 요금제명
  - 가격
  - 기능 목록
  - 활성 상태
  - 액션 (수정, 삭제)
- [ ] T603: 요금제 추가 버튼
- [ ] T604: 요금제 추가 다이얼로그
  - 요금제명, 코드
  - 월 요금
  - 최대 차량 수, 최대 승객 수
  - 기능 토글 (csvUpload, analytics, etc.)
- [ ] T605: 요금제 수정 다이얼로그
- [ ] T606: 요금제 삭제 확인 다이얼로그
- [ ] T607: usePlans Hook
- [ ] T608: useCreatePlan, useUpdatePlan, useDeletePlan Hooks
- [ ] T609: PlanCard 컴포넌트
- [ ] T610: PlanFormDialog 컴포넌트

**T611-T615: Plan Components**
- [ ] T611: PlanFeaturesList 컴포넌트
- [ ] T612: PlanPriceInput 컴포넌트
- [ ] T613: PlanFeaturesToggle 컴포넌트
- [ ] T614: DeletePlanDialog 컴포넌트
- [ ] T615: PlanComparisonTable 컴포넌트 (랜딩 페이지 재사용)

#### T616-T625: 통계 대시보드

**T616-T625: Statistics Pages**
- [ ] T616: 통계 페이지 (`app/(admin)/admin/stats/page.tsx`)
- [ ] T617: 전체 통계 섹션
  - 회원사 수 추이 차트
  - 차량/승객 수 추이 차트
  - 매출 추이 차트
- [ ] T618: 회원사별 사용 현황 테이블
- [ ] T619: 기간 선택 필터 (이번 주, 이번 달, 이번 년도, 커스텀)
- [ ] T620: 통계 Export 기능 (CSV, PDF)
- [ ] T621: useAdminStats Hook (기간별)
- [ ] T622: StatsChart 컴포넌트 (Recharts)
- [ ] T623: InstitutionUsageTable 컴포넌트
- [ ] T624: DateRangeFilter 컴포넌트
- [ ] T625: ExportButton 컴포넌트

---

### Testing & Deployment

#### T626-T635: Testing

**T626-T630: Backend Tests**
- [ ] T626: Auth Service Unit Tests
- [ ] T627: Institution Status Management Tests
- [ ] T628: Subscription Service Tests
- [ ] T629: Admin API Integration Tests
- [ ] T630: E2E Tests (Institution Approval Flow)

**T631-T635: Frontend Tests**
- [ ] T631: Landing Page Component Tests
- [ ] T632: Auth Flow E2E Tests (Playwright)
- [ ] T633: Admin Dashboard Component Tests
- [ ] T634: Institution Approval E2E Tests
- [ ] T635: User Management E2E Tests

#### T636-T640: Documentation & Deployment

- [ ] T636: API 문서 업데이트 (Swagger)
- [ ] T637: README 업데이트 (설치, 실행, 환경 변수)
- [ ] T638: 환경 변수 문서화 (.env.example 업데이트)
- [ ] T639: Admin 사용자 가이드 작성
- [ ] T640: Phase 11 완료 커밋 및 태깅

---

## Phase 12: Driver Mobile App (미래 계획)
## Phase 13: Passenger/Guardian App (미래 계획)
