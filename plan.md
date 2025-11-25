# Pickup MVP Development Plan

## Completed Phases

### Phase 1-3: Fleet Management (차량 관리) ✅
- Vehicle CRUD 완료
- PassengerGroup CRUD 완료
- Vehicle-Group 연결 완료

### Phase 4-8: Roster Management (승객 관리) ✅
- Passenger CRUD 완료
- CSV 대량 업로드 완료
- 템플릿 다운로드 완료

### Phase 9: 8시간 케어 시간 검증 ✅
- PassengerSchedule 엔티티 완료
- CareTimeCalculator 도메인 서비스 완료
- 스케줄 편집 UI 완료
- 실시간 케어 시간 계산 완료

### Phase 10: 기관 유형 관리 ✅
- InstitutionType 구현 (DAYCARE: 8시간, GENERAL: 검증 없음)
- Institution-InstitutionType 연결
- 기관 설정 페이지 완료
- 유형 변경 확인 다이얼로그 완료

---

## Phase 11: SaaS Admin & 회원사 관리 시스템 (진행중)

### 개요
Pickup을 멀티테넌시 SaaS 플랫폼으로 확장
- 시스템 관리자(SUPER_ADMIN)가 회원사를 승인/관리
- 회원사별 상태 관리 (PENDING → ACTIVE → SUSPENDED)
- 요금제/구독 관리
- 회원사별 통계 및 모니터링

### Architecture Changes

**Role-Based Access Control (RBAC)**
```
SUPER_ADMIN (시스템 관리자)
  ├─ 회원사 승인/거부
  ├─ 회원사 목록 조회/관리
  ├─ 시스템 사용자 관리
  ├─ 요금제 관리
  └─ 전체 통계 대시보드

INSTITUTION_ADMIN (회원사 관리자)
  ├─ 자사 차량/승객 관리
  ├─ 자사 통계 조회
  └─ 자사 사용자 관리

DRIVER (운전기사)
  ├─ 운행 정보 조회
  └─ 승객 체크인/체크아웃
```

**Institution Lifecycle**
```
PENDING (가입 신청)
  → SUPER_ADMIN 승인
  → ACTIVE (활성)
  → [정지 사유 발생]
  → SUSPENDED (정지)
  → [재활성화]
  → ACTIVE
```

### Backend Implementation

#### 1. User Context (새 모듈)
**Models:**
```prisma
model User {
  id                String      @id @default(uuid())
  email             String      @unique
  password          String      // bcrypt hashed
  role              UserRole    // SUPER_ADMIN, INSTITUTION_ADMIN, DRIVER
  institutionId     String?     // null for SUPER_ADMIN
  institution       Institution?
  name              String
  isActive          Boolean     @default(true)
  lastLoginAt       DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

enum UserRole {
  SUPER_ADMIN
  INSTITUTION_ADMIN
  DRIVER
}
```

**Features:**
- JWT 인증 (access token + refresh token)
- Passport.js 전략
- Auth Guards (RoleGuard, JwtAuthGuard)
- Password hashing (bcrypt)
- Login/Logout/Refresh 엔드포인트

#### 2. Institution Status Management
**확장된 Institution Model:**
```prisma
model Institution {
  // 기존 필드...
  status            InstitutionStatus @default(PENDING)
  rejectionReason   String?
  approvedAt        DateTime?
  approvedBy        String?           // SUPER_ADMIN User ID
  suspendedAt       DateTime?
  suspensionReason  String?

  // Relations
  users             User[]
  subscriptions     Subscription[]
}

enum InstitutionStatus {
  PENDING      // 승인 대기
  ACTIVE       // 활성
  SUSPENDED    // 정지
  INACTIVE     // 비활성 (해지)
}
```

#### 3. Subscription & Plan Models
```prisma
model Plan {
  id                String      @id @default(uuid())
  name              String      // "스타터", "프로", "엔터프라이즈"
  code              String      @unique
  maxVehicles       Int?        // null = unlimited
  maxPassengers     Int?
  monthlyPrice      Int         // 월 요금 (원)
  features          Json        // { "csvUpload": true, "analytics": true }
  isActive          Boolean     @default(true)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  subscriptions     Subscription[]
}

model Subscription {
  id                String      @id @default(uuid())
  institutionId     String
  institution       Institution @relation(fields: [institutionId])
  planId            String
  plan              Plan        @relation(fields: [planId])
  status            SubscriptionStatus @default(TRIAL)
  startDate         DateTime    @default(now())
  endDate           DateTime?
  trialEndsAt       DateTime?
  autoRenew         Boolean     @default(true)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  EXPIRED
  CANCELLED
}
```

#### 4. Admin API Endpoints

**회원사 승인 관리:**
- `GET /admin/institutions/pending` - 승인 대기 회원사 목록
- `POST /admin/institutions/:id/approve` - 회원사 승인
- `POST /admin/institutions/:id/reject` - 회원사 거부
- `POST /admin/institutions/:id/suspend` - 회원사 정지
- `POST /admin/institutions/:id/reactivate` - 회원사 재활성화

**회원사 관리:**
- `GET /admin/institutions` - 전체 회원사 목록 (필터: status, plan)
- `GET /admin/institutions/:id` - 회원사 상세 (통계 포함)
- `PATCH /admin/institutions/:id` - 회원사 정보 수정
- `GET /admin/institutions/:id/stats` - 회원사 통계

**사용자 관리:**
- `GET /admin/users` - 전체 사용자 목록
- `POST /admin/users` - 사용자 생성 (SUPER_ADMIN만)
- `PATCH /admin/users/:id` - 사용자 정보 수정
- `DELETE /admin/users/:id` - 사용자 삭제

**요금제 관리:**
- `GET /admin/plans` - 요금제 목록
- `POST /admin/plans` - 요금제 생성
- `PATCH /admin/plans/:id` - 요금제 수정
- `DELETE /admin/plans/:id` - 요금제 삭제

**통계 API:**
- `GET /admin/stats/overview` - 전체 통계 (회원사 수, 차량 수, 승객 수)
- `GET /admin/stats/institutions` - 회원사별 사용 현황
- `GET /admin/stats/revenue` - 매출 통계

#### 5. Institution Self-Service API
- `GET /institutions/me` - 내 회원사 정보
- `GET /institutions/me/subscription` - 내 구독 정보
- `GET /institutions/me/users` - 내 회원사 사용자 목록
- `POST /institutions/me/users` - 사용자 초대
- `GET /institutions/me/stats` - 내 회원사 통계

### Frontend Implementation

#### 1. 메인 랜딩 페이지 (`/`)
**브랜드 소개:**
- Hero 섹션: "Pickup - 스마트 송영 관리 플랫폼"
- 주요 기능 소개
- 요금제 비교표
- 회원가입 CTA

**페이지 구성:**
- Navbar (로그인/회원가입)
- Hero Section
- Features Section (차량 관리, 승객 관리, 실시간 추적)
- Pricing Section
- Testimonials
- Footer

**기술:**
- Next.js App Router
- Tailwind CSS
- Framer Motion (애니메이션)
- shadcn/ui 컴포넌트

#### 2. Admin 대시보드 (`/admin`)
**레이아웃:**
- Sidebar Navigation
  - 대시보드 홈
  - 회원사 관리
  - 승인 대기 (Badge: 대기 수)
  - 사용자 관리
  - 요금제 관리
  - 통계

**대시보드 홈:**
- KPI 카드
  - 전체 회원사 수 (ACTIVE)
  - 승인 대기 건수
  - 이번 달 신규 가입
  - 총 차량 수
  - 총 승객 수
- 최근 가입 회원사 목록
- 활동 로그

#### 3. 회원사 승인 관리 (`/admin/institutions/pending`)
**기능:**
- 승인 대기 목록 테이블
  - 회원사명
  - 사업자등록번호
  - 신청일
  - 상태
  - 액션 (승인/거부)
- 상세 모달
  - 회원사 정보 확인
  - 승인/거부 사유 입력
  - 초기 요금제 선택

#### 4. 회원사 목록 관리 (`/admin/institutions`)
**기능:**
- 필터링 (상태, 요금제, 가입일)
- 검색 (회원사명, 사업자등록번호)
- 테이블
  - 회원사명
  - 상태 (Badge)
  - 요금제
  - 차량 수 / 승객 수
  - 가입일
  - 구독 만료일
  - 액션 (상세, 정지, 수정)
- 상세 페이지 (`/admin/institutions/:id`)
  - 기본 정보
  - 구독 정보
  - 사용 현황 그래프
  - 사용자 목록
  - 액션 버튼 (정지, 재활성화, 수정)

#### 5. 시스템 사용자 관리 (`/admin/users`)
**기능:**
- 사용자 목록 테이블
  - 이름
  - 이메일
  - 역할 (SUPER_ADMIN, INSTITUTION_ADMIN, DRIVER)
  - 소속 회원사
  - 마지막 로그인
  - 상태 (활성/비활성)
- 사용자 추가 다이얼로그
- 사용자 수정/삭제

#### 6. 요금제 관리 (`/admin/plans`)
**기능:**
- 요금제 카드 목록
- 요금제 생성/수정 폼
- 기능 토글 (csvUpload, analytics, etc.)
- 가격 설정

### Database Migration Strategy

**단계적 마이그레이션:**
1. User 모델 추가
2. Institution에 status 필드 추가
3. Plan & Subscription 모델 추가
4. 기존 데이터 마이그레이션
   - 기존 Institution → ACTIVE 상태로 설정
   - 기본 SUPER_ADMIN 계정 생성
   - 기본 요금제 생성

### Security & Authentication

**JWT Strategy:**
- Access Token: 15분 유효
- Refresh Token: 7일 유효
- HttpOnly Cookie로 저장

**Role Guards:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Get('admin/institutions')
```

**Password Policy:**
- 최소 8자
- 대소문자, 숫자, 특수문자 포함
- bcrypt 해싱 (salt rounds: 10)

### Testing Strategy

**Backend:**
- Unit Tests: Service, Domain Logic
- Integration Tests: API Endpoints
- E2E Tests: Admin 승인 플로우

**Frontend:**
- Component Tests: React Testing Library
- E2E Tests: Playwright (Admin 대시보드)

---

## Phase 12: Driver Mobile App (미래 계획)
- React Native
- 일일 승객 명단
- GPS 추적
- 승객 체크인/체크아웃

## Phase 13: Passenger/Guardian App (미래 계획)
- React Native
- 실시간 차량 위치
- 일정 조회
- 푸시 알림
