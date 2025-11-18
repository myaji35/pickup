# Epic 2: 차량 및 기사 관리

**Epic ID**: EPIC-002
**우선순위**: P0 (Critical)
**Stage**: MVP (Month 1)
**담당 Context**: Fleet Context

---

## 📋 Epic 개요

### 목표
기관에 배정된 차량(5-15인승)과 기사 정보를 관리하고, 운행에 필요한 기본 데이터를 구축

### 비즈니스 가치
- 차량 자산 관리 (차량번호 뒤 4자리 식별)
- 기사-차량 매칭
- 운행 가능 차량 실시간 파악
- 차량별 운행 이력 추적 기반

### 성공 지표
- 차량 등록 완료 시간 < 3분
- 기사-차량 배정 정확도 100%
- 차량 상태 업데이트 실시간성 < 5초

---

## 👥 사용자 페르소나

### 1차 사용자: 기관 관리자
- **역할**: 차량과 기사를 관리하는 학원/요양원 관리자
- **니즈**: 보유 차량 정보 등록, 기사 배정, 운행 가능 상태 확인
- **페인 포인트**: 수기 차량 대장 관리, 기사 스케줄 혼선

### 2차 사용자: PickUp 운영팀
- **역할**: 전체 플랫폼 차량 현황 모니터링
- **니즈**: 기관별 차량 보유 현황, 가동률 확인
- **페인 포인트**: 산발적인 차량 정보

---

## 🎯 범위 (Scope)

### In Scope (MVP 포함)
✅ 차량 기본 정보 CRUD (차량번호, 차종, 정원, 차량번호 뒤 4자리)
✅ 기사 기본 정보 CRUD (이름, 면허번호, 연락처)
✅ 차량-기사 1:1 매칭
✅ 차량 상태 관리 (운행 가능/정비 중/폐차)
✅ 기관별 차량/기사 목록 조회

### Out of Scope (Stage 2 이후)
❌ OBD-II 텔레매틱스 연동
❌ 차량 정비 이력 관리
❌ 기사 운전 점수/평가
❌ 차량 보험/검사 만료일 알림

---

## 📖 사용자 스토리

### Story 2.1: 차량 등록
**As a** 기관 관리자
**I want to** 우리 기관의 셔틀 차량을 등록
**So that** 운행 스케줄에 차량을 배정할 수 있다

**인수 조건**:
- 차량번호(전체), 차종, 정원(5-15인) 입력
- 차량번호 뒤 4자리 자동 추출 및 표시
- 같은 기관 내 차량번호 중복 검증
- 등록 완료 시 고유 차량 ID 생성

**기술 힌트**:
- Next.js Server Actions로 차량 등록 처리
- Prisma ORM으로 PostgreSQL에 저장
- shadcn/ui Form + Zod 스키마 검증

---

### Story 2.2: 기사 등록
**As a** 기관 관리자
**I want to** 기사 정보를 등록
**So that** 차량에 기사를 배정하고 운행을 시작할 수 있다

**인수 조건**:
- 기사 이름, 운전면허번호, 휴대폰 번호 입력
- 면허번호 형식 검증 (12자리 또는 13자리)
- 같은 기관 내 휴대폰 번호 중복 검증
- 등록 완료 시 기사 앱 로그인 계정 자동 생성 (Clerk)

**기술 힌트**:
- Clerk Webhooks로 기사 계정 생성 트리거
- Metadata에 기관 ID, 기사 ID 저장

---

### Story 2.3: 차량-기사 배정
**As a** 기관 관리자
**I want to** 등록된 차량에 기사를 배정
**So that** 누가 어떤 차량을 운행하는지 명확히 관리할 수 있다

**인수 조건**:
- 차량 상세 페이지에서 기사 선택 드롭다운
- 1대의 차량에 1명의 기사만 배정 (1:1)
- 이미 다른 차량에 배정된 기사 선택 시 경고 표시
- 배정 해제 기능

**기술 힌트**:
- shadcn/ui Combobox 또는 Select 컴포넌트
- Optimistic UI 업데이트

---

### Story 2.4: 차량 목록 조회
**As a** 기관 관리자
**I want to** 우리 기관의 모든 차량을 한눈에 조회
**So that** 차량 현황을 빠르게 파악할 수 있다

**인수 조건**:
- 차량번호, 차종, 정원, 배정 기사, 상태 표시
- 상태별 필터링 (운행 가능/정비 중)
- 차량번호 뒤 4자리로 검색
- shadcn/ui Table 컴포넌트 사용

---

### Story 2.5: 차량 상태 변경
**As a** 기관 관리자
**I want to** 차량 상태를 변경
**So that** 정비 중이거나 사용 불가한 차량을 운행 스케줄에서 제외할 수 있다

**인수 조건**:
- 상태: 운행 가능(active), 정비 중(maintenance), 폐차(retired)
- 정비 중으로 변경 시 해당 차량의 운행 스케줄 확인 및 경고
- 상태 변경 이력 로그 기록

---

### Story 2.6: 기사 정보 수정
**As a** 기관 관리자
**I want to** 기사의 연락처 정보를 수정
**So that** 기사 휴대폰 변경 시 최신 정보를 유지할 수 있다

**인수 조건**:
- 이름, 휴대폰 번호 수정 가능
- 운전면허번호는 수정 불가 (재등록 안내)
- 수정 이력 로그 기록

---

## 🔧 기술 고려사항

### 데이터 모델 (Prisma Schema)
```prisma
model Vehicle {
  id                String   @id @default(uuid())
  institutionId     String
  licensePlate      String   // 전체 차량번호 (예: "12가3456")
  licensePlateLast4 String   // 뒤 4자리 (예: "3456")
  vehicleType       String   // 차종 (예: "그랜드스타렉스")
  capacity          Int      // 정원 (5-15)
  status            VehicleStatus @default(ACTIVE)
  driverId          String?  @unique // 1:1 관계

  institution       Institution @relation(fields: [institutionId], references: [id])
  driver            Driver?     @relation(fields: [driverId], references: [id])

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([institutionId, licensePlate])
}

enum VehicleStatus {
  ACTIVE       // 운행 가능
  MAINTENANCE  // 정비 중
  RETIRED      // 폐차
}

model Driver {
  id                String   @id @default(uuid())
  institutionId     String
  name              String
  licenseNumber     String   // 운전면허번호
  phone             String
  clerkUserId       String?  @unique // Clerk 계정 ID

  institution       Institution @relation(fields: [institutionId], references: [id])
  vehicle           Vehicle?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([institutionId, phone])
}
```

### API 엔드포인트 (Server Actions)
```typescript
// app/actions/vehicles.ts
'use server'

export async function createVehicle(data: VehicleCreateInput) { }
export async function updateVehicle(id: string, data: VehicleUpdateInput) { }
export async function assignDriver(vehicleId: string, driverId: string) { }
export async function unassignDriver(vehicleId: string) { }
export async function updateVehicleStatus(id: string, status: VehicleStatus) { }

// app/actions/drivers.ts
export async function createDriver(data: DriverCreateInput) { }
export async function updateDriver(id: string, data: DriverUpdateInput) { }
```

### 프론트엔드 구조
```
app/
├── (dashboard)/
│   └── [institutionId]/
│       ├── vehicles/
│       │   ├── page.tsx          // 차량 목록
│       │   ├── [id]/
│       │   │   └── page.tsx      // 차량 상세 + 기사 배정
│       │   └── new/
│       │       └── page.tsx      // 차량 등록 폼
│       └── drivers/
│           ├── page.tsx          // 기사 목록
│           └── new/
│               └── page.tsx      // 기사 등록 폼
└── components/
    ├── vehicle-form.tsx          // shadcn/ui Form
    ├── driver-form.tsx
    └── vehicle-table.tsx         // shadcn/ui Table
```

### 의존성
- **Prisma**: ORM (SQLite dev, PostgreSQL prod)
- **Clerk**: 기사 계정 자동 생성
- **Zod**: 폼 검증 (차량번호, 면허번호 형식)
- **shadcn/ui**: Form, Table, Select, Dialog 컴포넌트

---

## ✅ 완료 조건 (Definition of Done)

- [ ] 모든 사용자 스토리 개발 완료
- [ ] Prisma 마이그레이션 완료 (Vehicle, Driver 모델)
- [ ] 차량/기사 CRUD 페이지 UI 구현 (shadcn/ui)
- [ ] 차량-기사 1:1 매칭 로직 검증
- [ ] Clerk 기사 계정 자동 생성 테스트
- [ ] 차량번호/면허번호 형식 검증 테스트

---

## 📅 일정
- **시작일**: Month 1, Week 2
- **완료일**: Month 1, Week 3
- **예상 공수**: 1주 (소규모 팀 기준)

---

## 🔗 관련 문서
- `docs/epics/epic-01-institution-management.md` - 기관 관리 (선행 Epic)
- `CLAUDE.md` - 전체 프로젝트 개요
- `docs/tech-stack.md` - 기술 스택 상세 (작성 예정)
