# Feature Specification: SaaS Admin Portal (Phase 12)

**Feature Branch**: `003-admin-portal`
**Created**: 2025-11-19
**Status**: Draft
**Input**: User description: "SaaS Admin Portal - Phase 12: 회원사 승인/관리 대시보드 UI, 요금제/구독 관리, 시스템 사용자 관리"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 회원사 신청 승인/거부 워크플로우 (Priority: P1)

SUPER_ADMIN은 PENDING 상태의 회원사 가입 신청을 검토하고 승인 또는 거부할 수 있어야 한다.

**Why this priority**: 이는 SaaS 플랫폼의 핵심 비즈니스 워크플로우이며, Phase 11에서 구현된 Backend Admin API의 첫 번째 UI 사용자 여정이다. 승인 없이는 회원사가 서비스를 시작할 수 없으므로 최우선 순위다.

**Independent Test**: SUPER_ADMIN 계정으로 로그인 후 "승인 대기 회원사" 페이지에서 PENDING 회원사를 클릭하여 승인/거부 버튼을 눌러 즉시 상태가 변경되는지 확인할 수 있다.

**Acceptance Scenarios**:

1. **Given** SUPER_ADMIN으로 로그인되어 있고, PENDING 상태의 회원사가 1개 이상 존재할 때, **When** "승인 대기" 탭을 클릭하면, **Then** PENDING 회원사 목록이 표시되어야 함 (사업자등록번호, 회원사명, 기관 유형, 신청일시 포함)
2. **Given** PENDING 회원사 상세 화면에서, **When** "승인" 버튼을 클릭하면, **Then** 회원사 상태가 ACTIVE로 변경되고, approvedBy가 현재 사용자로 기록되어야 함
3. **Given** PENDING 회원사 상세 화면에서, **When** "거부" 버튼을 클릭하고 거부 사유를 입력하면, **Then** 회원사 상태가 INACTIVE로 변경되고, rejectionReason이 저장되어야 함
4. **Given** ACTIVE 회원사 상세 화면에서, **When** 승인/거부 버튼을 표시하면, **Then** 버튼이 비활성화되거나 숨겨져야 함 (이미 처리된 회원사는 재처리 불가)

---

### User Story 2 - 회원사 상태 관리 (정지/재활성화) (Priority: P1)

SUPER_ADMIN은 ACTIVE 회원사를 정지(SUSPENDED)하거나, 정지된 회원사를 재활성화할 수 있어야 한다.

**Why this priority**: 계약 위반, 결제 미납, 서비스 남용 등의 이유로 회원사를 즉시 정지해야 하는 상황은 B2B SaaS에서 필수 기능이며, P1과 함께 회원사 라이프사이클 관리의 핵심이다.

**Independent Test**: ACTIVE 회원사를 정지 후 SUSPENDED 탭에서 확인하고, 재활성화 후 ACTIVE 탭에서 다시 확인할 수 있다.

**Acceptance Scenarios**:

1. **Given** ACTIVE 회원사 상세 화면에서, **When** "정지" 버튼을 클릭하고 정지 사유를 입력하면, **Then** 회원사 상태가 SUSPENDED로 변경되고, suspensionReason과 suspendedAt이 저장되어야 함
2. **Given** SUSPENDED 회원사 목록에서, **When** 특정 회원사를 클릭하면, **Then** 정지 사유와 정지 일시가 표시되어야 함
3. **Given** SUSPENDED 회원사 상세 화면에서, **When** "재활성화" 버튼을 클릭하면, **Then** 회원사 상태가 ACTIVE로 복원되고, suspensionReason과 suspendedAt이 null로 초기화되어야 함
4. **Given** 정지된 회원사의 사용자가, **When** 로그인을 시도하면, **Then** "회원사가 정지 상태입니다. 관리자에게 문의하세요." 메시지와 함께 로그인 거부되어야 함

---

### User Story 3 - 회원사 목록 조회 및 필터링 (Priority: P2)

SUPER_ADMIN은 모든 회원사를 한눈에 조회하고, 상태별(PENDING/ACTIVE/SUSPENDED/INACTIVE) 필터링할 수 있어야 한다.

**Why this priority**: 회원사 현황 파악과 효율적인 관리를 위해 필요하지만, P1의 승인/정지 워크플로우가 먼저 구현되어야 의미가 있다.

**Independent Test**: "전체 회원사" 탭에서 상태 필터 드롭다운을 변경하여 각 상태별 회원사 목록이 정확히 표시되는지 확인할 수 있다.

**Acceptance Scenarios**:

1. **Given** Admin Portal 메인 화면에서, **When** "회원사 관리" 메뉴를 클릭하면, **Then** 전체 회원사 목록이 상태별 탭(전체/PENDING/ACTIVE/SUSPENDED/INACTIVE)으로 표시되어야 함
2. **Given** 회원사 목록 화면에서, **When** 상태 필터를 "ACTIVE"로 선택하면, **Then** ACTIVE 상태의 회원사만 표시되어야 함
3. **Given** 회원사 목록에서, **When** 검색창에 회원사명 또는 사업자등록번호를 입력하면, **Then** 실시간 검색 결과가 표시되어야 함
4. **Given** 회원사 목록에서, **When** 특정 회원사를 클릭하면, **Then** 회원사 상세 화면으로 이동하여 모든 정보(상태, 승인자, 승인일시, 거부사유, 정지사유 등)가 표시되어야 함

---

### User Story 4 - 요금제 CRUD 및 회원사 구독 연결 (Priority: P2)

SUPER_ADMIN은 요금제(Subscription Plan)를 생성/수정/삭제하고, 회원사에 요금제를 할당할 수 있어야 한다.

**Why this priority**: 비즈니스 모델의 핵심 기능이지만, 초기에는 단일 요금제로 시작 가능하므로 P1보다 우선순위가 낮다. 하지만 확장을 위해 Phase 12에서 구현되어야 한다.

**Independent Test**: 새 요금제를 생성한 후, 회원사 상세 화면에서 해당 요금제를 선택하여 저장하고, 회원사 목록에서 요금제 정보가 표시되는지 확인할 수 있다.

**Acceptance Scenarios**:

1. **Given** Admin Portal에서, **When** "요금제 관리" 메뉴를 클릭하면, **Then** 기존 요금제 목록(요금제명, 월 비용, 차량 수 제한, 활성 상태)이 표시되어야 함
2. **Given** 요금제 목록 화면에서, **When** "새 요금제 생성" 버튼을 클릭하고 정보를 입력하면, **Then** 새 요금제가 생성되어야 함 (필수: 요금제명, 월 비용, 차량 수 제한; 선택: 설명, 추가 기능 플래그)
3. **Given** 회원사 상세 화면에서, **When** "요금제 변경" 버튼을 클릭하고 새 요금제를 선택하면, **Then** 회원사의 구독 요금제가 변경되고, 변경 이력이 기록되어야 함
4. **Given** 요금제 상세 화면에서, **When** 해당 요금제를 사용 중인 회원사가 있을 때 삭제를 시도하면, **Then** "이 요금제를 사용 중인 회원사가 있습니다. 먼저 요금제를 변경하세요." 경고 메시지가 표시되어야 함

---

### User Story 5 - 시스템 사용자 관리 (SUPER_ADMIN 전용) (Priority: P3)

SUPER_ADMIN은 다른 SUPER_ADMIN 계정을 생성하거나 비활성화할 수 있어야 한다.

**Why this priority**: 운영 확장 시 필요하지만, 초기에는 1명의 SUPER_ADMIN으로 충분하므로 우선순위가 낮다. 보안상 중요하므로 Phase 12에 포함.

**Independent Test**: 새 SUPER_ADMIN 계정을 생성한 후, 로그아웃하고 해당 계정으로 로그인하여 Admin Portal 접근이 가능한지 확인할 수 있다.

**Acceptance Scenarios**:

1. **Given** Admin Portal에서, **When** "시스템 사용자" 메뉴를 클릭하면, **Then** 현재 SUPER_ADMIN 계정 목록(이메일, 생성일, 활성 상태)이 표시되어야 함
2. **Given** 시스템 사용자 목록에서, **When** "새 SUPER_ADMIN 추가" 버튼을 클릭하고 이메일/비밀번호를 입력하면, **Then** 새 SUPER_ADMIN 계정이 생성되어야 함
3. **Given** 시스템 사용자 상세 화면에서, **When** "비활성화" 버튼을 클릭하면, **Then** 해당 계정이 비활성화되고, 이후 로그인이 차단되어야 함
4. **Given** 본인 계정을 비활성화하려 할 때, **When** "비활성화" 버튼을 클릭하면, **Then** "본인 계정은 비활성화할 수 없습니다." 경고 메시지가 표시되어야 함

---

### User Story 6 - Admin 대시보드 (통계 요약) (Priority: P3)

SUPER_ADMIN은 로그인 후 대시보드에서 주요 통계(전체 회원사 수, PENDING/ACTIVE/SUSPENDED 회원사 수, 이번 달 신규 가입)를 한눈에 확인할 수 있어야 한다.

**Why this priority**: UX 향상을 위한 기능이지만, 핵심 워크플로우(승인/정지)가 먼저 구현되어야 하므로 P3이다.

**Independent Test**: Admin Portal 로그인 후 대시보드 카드에 표시된 숫자가 실제 DB 데이터와 일치하는지 확인할 수 있다.

**Acceptance Scenarios**:

1. **Given** SUPER_ADMIN으로 로그인하면, **When** 메인 대시보드가 로드되면, **Then** 4개의 카드(전체 회원사, PENDING, ACTIVE, SUSPENDED)에 각 숫자가 표시되어야 함
2. **Given** 대시보드에서, **When** "PENDING" 카드를 클릭하면, **Then** 승인 대기 회원사 목록 화면으로 이동해야 함
3. **Given** 대시보드에서, **When** "이번 달 신규 가입" 그래프를 표시하면, **Then** 최근 30일간 일별 신규 가입 추이가 표시되어야 함

---

### Edge Cases

- **회원사 승인 중 동시성 문제**: 두 명의 SUPER_ADMIN이 동시에 같은 PENDING 회원사를 승인하려 할 때, 첫 번째 요청만 성공하고 두 번째 요청은 "이미 처리된 회원사입니다" 에러를 반환해야 함
- **요금제 삭제 시 참조 무결성**: 회원사가 사용 중인 요금제를 삭제하려 할 때, DB 외래 키 제약으로 인해 삭제가 차단되어야 함 (Soft Delete 고려)
- **로그인 실패 시 UX**: 정지된 회원사의 사용자가 로그인 시도 시, 명확한 메시지("회원사가 정지되었습니다. 관리자에게 문의하세요.")와 함께 로그인 차단
- **빈 목록 UX**: PENDING 회원사가 없을 때, "현재 승인 대기 중인 회원사가 없습니다" 빈 상태 화면 표시
- **페이지네이션**: 회원사 수가 100개 이상일 때, 목록을 페이지로 나누어 표시 (기본 20개/페이지)
- **검색어 없음**: 검색 결과가 0건일 때, "검색 결과가 없습니다" 메시지 표시

## Requirements *(mandatory)*

### Functional Requirements

#### 회원사 상태 관리 (P1)

- **FR-001**: 시스템은 PENDING 상태의 회원사 목록을 생성일시 역순으로 조회할 수 있어야 함
- **FR-002**: SUPER_ADMIN은 PENDING 회원사를 ACTIVE로 승인할 수 있어야 하며, 승인자(approvedBy)와 승인일시(approvedAt)를 자동 기록해야 함
- **FR-003**: SUPER_ADMIN은 PENDING 회원사를 INACTIVE로 거부할 수 있어야 하며, 거부 사유(rejectionReason)는 필수 입력이어야 함
- **FR-004**: SUPER_ADMIN은 ACTIVE 회원사를 SUSPENDED로 정지할 수 있어야 하며, 정지 사유(suspensionReason)와 정지일시(suspendedAt)를 기록해야 함
- **FR-005**: SUPER_ADMIN은 SUSPENDED 회원사를 ACTIVE로 재활성화할 수 있어야 하며, suspensionReason과 suspendedAt은 null로 초기화되어야 함
- **FR-006**: 시스템은 상태 전환 규칙을 검증해야 함 (PENDING→ACTIVE/INACTIVE, ACTIVE→SUSPENDED, SUSPENDED→ACTIVE만 허용)
- **FR-007**: 정지된 회원사(SUSPENDED)의 모든 사용자는 로그인 시도 시 차단되어야 하며, 정지 사유를 포함한 명확한 메시지가 표시되어야 함

#### 회원사 조회 및 필터링 (P2)

- **FR-008**: 시스템은 전체 회원사 목록을 조회할 수 있어야 하며, 상태별 필터링(PENDING/ACTIVE/SUSPENDED/INACTIVE)을 지원해야 함
- **FR-009**: 시스템은 회원사명 또는 사업자등록번호로 검색 기능을 제공해야 함 (부분 일치 지원)
- **FR-010**: 회원사 목록은 생성일시 역순으로 정렬되어야 하며, 페이지네이션을 지원해야 함 (기본 20개/페이지)
- **FR-011**: 회원사 상세 화면에서 모든 메타데이터를 표시해야 함 (상태, 승인자, 승인일시, 거부사유, 정지사유, 정지일시, 요금제, 생성일시, 수정일시)

#### 요금제 관리 (P2)

- **FR-012**: 시스템은 요금제(Subscription Plan) 엔티티를 지원해야 함 (필수: id, name, monthlyFee, vehicleLimit, isActive; 선택: description, features JSON)
- **FR-013**: SUPER_ADMIN은 요금제를 생성/수정/비활성화할 수 있어야 함 (Soft Delete 방식)
- **FR-014**: 회원사는 정확히 1개의 요금제를 할당받아야 하며, 요금제 변경 시 이력이 기록되어야 함
- **FR-015**: 활성 회원사가 사용 중인 요금제는 삭제할 수 없어야 하며, 비활성화만 가능해야 함
- **FR-016**: 요금제 상세 화면에서 해당 요금제를 사용 중인 회원사 목록을 표시해야 함

#### 시스템 사용자 관리 (P3)

- **FR-017**: SUPER_ADMIN은 새로운 SUPER_ADMIN 계정을 생성할 수 있어야 함 (이메일, 비밀번호, role=SUPER_ADMIN)
- **FR-018**: SUPER_ADMIN은 다른 SUPER_ADMIN 계정을 비활성화할 수 있어야 하지만, 본인 계정은 비활성화할 수 없어야 함
- **FR-019**: 비활성화된 SUPER_ADMIN 계정은 로그인이 차단되어야 함
- **FR-020**: 시스템 사용자 목록에서 각 계정의 최근 로그인 일시를 표시해야 함 (Optional: 감사 로그 테이블 필요)

#### Admin 대시보드 (P3)

- **FR-021**: 대시보드는 실시간 통계를 표시해야 함 (전체 회원사 수, PENDING/ACTIVE/SUSPENDED/INACTIVE 각 상태별 수)
- **FR-022**: 대시보드는 이번 달 신규 가입 회원사 수를 표시해야 함 (최근 30일 기준)
- **FR-023**: 대시보드 카드 클릭 시 해당 상태의 회원사 목록 화면으로 이동해야 함

### Key Entities

#### SubscriptionPlan (신규 엔티티)
- **목적**: B2B 요금제 정보를 저장
- **주요 속성**:
  - id (UUID, PK)
  - name (요금제명, e.g., "Basic", "Premium", "Enterprise")
  - monthlyFee (월 비용, Decimal)
  - vehicleLimit (차량 수 제한, Integer)
  - isActive (활성 상태, Boolean, 기본값 true)
  - description (요금제 설명, Optional)
  - features (추가 기능 플래그, JSON, Optional, e.g., {"ai_optimization": true, "bi_dashboard": false})
  - createdAt, updatedAt
- **관계**: Institution (1:N)

#### Subscription (신규 엔티티)
- **목적**: 회원사별 구독 정보 및 이력 관리
- **주요 속성**:
  - id (UUID, PK)
  - institutionId (FK to Institution)
  - subscriptionPlanId (FK to SubscriptionPlan)
  - startedAt (구독 시작일)
  - endedAt (구독 종료일, Nullable)
  - status (SubscriptionStatus: ACTIVE, CANCELLED, EXPIRED)
  - createdAt, updatedAt
- **관계**: Institution (N:1), SubscriptionPlan (N:1)
- **비즈니스 규칙**: 회원사당 동시에 1개의 ACTIVE Subscription만 존재해야 함

#### Institution (기존 엔티티 확장)
- **Phase 11에서 이미 구현된 필드**: status, approvedBy, approvedAt, rejectionReason, suspendedAt, suspensionReason
- **Phase 12 추가 필드**:
  - currentSubscriptionId (FK to Subscription, Nullable) - 현재 활성 구독
- **관계**: Subscription (1:N), SubscriptionPlan (N:1 via Subscription)

#### User (기존 엔티티 확장)
- **Phase 11에서 이미 구현된 필드**: role (SUPER_ADMIN, INSTITUTION_ADMIN, DRIVER)
- **Phase 12 추가 필드**:
  - isActive (Boolean, 기본값 true) - 계정 활성화 상태
  - lastLoginAt (Timestamp, Nullable) - 최근 로그인 일시 (Optional: Phase 12에서 구현하지 않을 수도 있음)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: SUPER_ADMIN은 PENDING 회원사를 클릭 후 3초 이내에 승인/거부 작업을 완료할 수 있어야 함
- **SC-002**: 회원사 상태 변경(승인/거부/정지/재활성화) 시, 1초 이내에 UI가 업데이트되고 목록이 새로고침되어야 함
- **SC-003**: 요금제 CRUD 작업은 각 5초 이내에 완료되어야 하며, 입력 유효성 검사 에러는 즉시 표시되어야 함
- **SC-004**: Admin Portal은 100개 이상의 회원사 목록을 2초 이내에 로드하고 렌더링해야 함 (페이지네이션 적용)
- **SC-005**: 회원사 검색 기능은 입력 후 500ms 이내에 결과를 표시해야 함 (Debounce 적용)
- **SC-006**: 정지된 회원사의 사용자가 로그인 시도 시, 명확한 정지 사유와 함께 차단 메시지가 표시되어야 함 (사용자 혼란 최소화)
- **SC-007**: Admin Portal은 모바일 브라우저에서도 기본 기능(목록 조회, 승인/거부)이 정상 작동해야 함 (Responsive Design)
