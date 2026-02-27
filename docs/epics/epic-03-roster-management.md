# Epic 3: 승객 명단 관리

**Epic ID**: EPIC-003
**우선순위**: P0 (Critical)
**Stage**: MVP (Month 1-2)
**담당 Context**: Roster Context

---

## 📋 Epic 개요

### 목표
주간 승객 명단(roster)을 등록하고 관리하여, 기사가 누구를 태우고 내려야 하는지 명확히 파악할 수 있도록 함

### 비즈니스 가치
- 승객 정보 중앙화 (이름, 연락처, 픽업/하차 위치)
- 주간 단위 명단 관리 (매주 변동 가능)
- 오전/저녁 셔틀 타입 구분
- 엑셀 업로드로 대량 등록 시간 단축

### 성공 지표
- 엑셀 업로드 성공률 > 95%
- 명단 등록 완료 시간 < 10분 (50명 기준)
- 명단 수정 반영 실시간성 < 5초

---

## 👥 사용자 페르소나

### 1차 사용자: 기관 관리자
- **역할**: 학원 원장, 요양원 관리자
- **니즈**: 매주 변경되는 승객 명단을 빠르게 업데이트
- **페인 포인트**: 수기 입력 시간 소요, 엑셀 파일과 시스템 불일치

### 2차 사용자: 기사
- **역할**: 셔틀 운행 기사
- **니즈**: 당일 태워야 할 승객 리스트 확인
- **페인 포인트**: 종이 명단 분실, 변경사항 미전달

---

## 🎯 범위 (Scope)

### In Scope (MVP 포함)
✅ 승객 기본 정보 CRUD (이름, 연락처, 픽업/하차 주소)
✅ 주간 명단(Roster) 생성 (특정 주, 특정 차량)
✅ 셔틀 타입 구분 (오전/저녁/임시)
✅ 엑셀 업로드 기능 (템플릿 제공)
✅ 명단 복사 기능 (이전 주 → 다음 주)

### Out of Scope (Stage 2 이후)
❌ AI 기반 승차 순서 자동 최적화
❌ 승하차 상태 실시간 체크
❌ 보호자 연락처 별도 관리
❌ 승객 특이사항 메모 (예: 휠체어, 유아 카시트)

---

## 📖 사용자 스토리

### Story 3.1: 승객 등록 (수동)
**As a** 기관 관리자
**I want to** 승객 정보를 수동으로 등록
**So that** 소수 승객 추가 시 빠르게 처리할 수 있다

**인수 조건**:
- 승객 이름, 연락처(승객 본인 또는 보호자), 픽업 주소, 하차 주소 입력
- 같은 기관 내 연락처 중복 허용 (형제 자매 케이스)
- 주소는 카카오 주소 검색 API 활용
- 등록 완료 시 고유 승객 ID 생성

**기술 힌트**:
- shadcn/ui Form + react-hook-form
- Daum Postcode API 연동 (주소 검색)
- Zod 스키마로 휴대폰 번호 형식 검증

---

### Story 3.2: 엑셀 업로드 (대량 등록)
**As a** 기관 관리자
**I want to** 엑셀 파일로 승객 명단을 업로드
**So that** 50명 이상의 승객을 한 번에 등록할 수 있다

**인수 조건**:
- 표준 엑셀 템플릿 다운로드 기능 제공
- 필수 컬럼: 이름, 연락처, 픽업 주소, 하차 주소
- 업로드 시 행별 검증 (형식 오류 시 줄 번호 표시)
- 검증 성공 후 일괄 등록 (트랜잭션)

**기술 힌트**:
- `xlsx` 라이브러리로 엑셀 파싱
- Server Action에서 일괄 DB 삽입
- shadcn/ui Alert로 검증 오류 표시

---

### Story 3.3: 주간 명단(Roster) 생성
**As a** 기관 관리자
**I want to** 특정 주의 셔틀 명단을 생성
**So that** 해당 주에 누가 탑승하는지 관리할 수 있다

**인수 조건**:
- 명단 생성 시 주(week) 선택 (예: 2025-W10)
- 차량 선택 (드롭다운)
- 셔틀 타입 선택 (오전/저녁)
- 등록된 승객 중 선택하여 명단에 추가
- 1주 1차량 1타입 = 1개 Roster

**기술 힌트**:
- ISO Week 형식 (YYYY-Www)
- shadcn/ui Multi-Select 또는 Transfer List 컴포넌트
- Prisma `createMany`로 일괄 삽입

---

### Story 3.4: 명단 복사 (이전 주 → 다음 주)
**As a** 기관 관리자
**I want to** 지난 주 명단을 복사하여 다음 주 명단 생성
**So that** 매주 반복되는 승객 정보를 재입력하지 않을 수 있다

**인수 조건**:
- 이전 주 명단 선택
- "다음 주로 복사" 버튼 클릭
- 복사 완료 시 다음 주 명단 페이지로 이동
- 복사 후 개별 수정 가능

**기술 힌트**:
- Server Action에서 이전 주 Roster 조회 후 새 주로 복사
- Week +1 계산 (date-fns 라이브러리)

---

### Story 3.5: 명단 조회 및 수정
**As a** 기관 관리자
**I want to** 특정 주의 명단을 조회하고 수정
**So that** 임시 결석이나 승객 변경사항을 반영할 수 있다

**인수 조건**:
- 주별, 차량별, 타입별 필터링
- 승객 추가/제거
- 승객 정보 수정 (주소 변경 등)
- 수정 즉시 기사 앱에 반영

---

### Story 3.6: 명단 삭제
**As a** 기관 관리자
**I want to** 특정 주의 명단을 삭제
**So that** 운행하지 않는 주의 데이터를 정리할 수 있다

**인수 조건**:
- 삭제 전 확인 다이얼로그
- 삭제 시 해당 주의 모든 승객 항목 제거
- 삭제 이력 로그 기록

---

## 🔧 기술 고려사항

### 데이터 모델 (Prisma Schema)
```prisma
model Passenger {
  id            String   @id @default(uuid())
  institutionId String
  name          String
  phone         String
  pickupAddress String   // 픽업 주소 (전체 주소)
  dropoffAddress String  // 하차 주소

  institution   Institution @relation(fields: [institutionId], references: [id])
  rosterEntries RosterEntry[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Roster {
  id            String   @id @default(uuid())
  institutionId String
  vehicleId     String
  week          String   // ISO Week (예: "2025-W10")
  shuttleType   ShuttleType

  institution   Institution @relation(fields: [institutionId], references: [id])
  vehicle       Vehicle     @relation(fields: [vehicleId], references: [id])
  entries       RosterEntry[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([institutionId, vehicleId, week, shuttleType])
}

model RosterEntry {
  id          String   @id @default(uuid())
  rosterId    String
  passengerId String
  boardingOrder Int?   // MVP에서는 null, Stage 2에서 AI 최적화 후 채움

  roster      Roster    @relation(fields: [rosterId], references: [id], onDelete: Cascade)
  passenger   Passenger @relation(fields: [passengerId], references: [id])

  createdAt   DateTime @default(now())

  @@unique([rosterId, passengerId])
}

enum ShuttleType {
  MORNING     // 오전 셔틀
  EVENING     // 저녁 셔틀
  TEMPORARY   // 임시 셔틀 (Stage 2)
}
```

### API 엔드포인트 (Server Actions)
```typescript
// app/actions/passengers.ts
'use server'

export async function createPassenger(data: PassengerCreateInput) { }
export async function updatePassenger(id: string, data: PassengerUpdateInput) { }
export async function uploadPassengersExcel(file: File, institutionId: string) { }

// app/actions/rosters.ts
export async function createRoster(data: RosterCreateInput) { }
export async function copyRosterToNextWeek(rosterId: string) { }
export async function addPassengerToRoster(rosterId: string, passengerId: string) { }
export async function removePassengerFromRoster(rosterId: string, passengerId: string) { }
export async function deleteRoster(rosterId: string) { }
```

### 프론트엔드 구조
```
app/
├── (dashboard)/
│   └── [institutionId]/
│       ├── passengers/
│       │   ├── page.tsx          // 승객 목록
│       │   ├── new/
│       │   │   └── page.tsx      // 승객 수동 등록
│       │   └── upload/
│       │       └── page.tsx      // 엑셀 업로드
│       └── rosters/
│           ├── page.tsx          // 주별 명단 목록
│           ├── [rosterId]/
│           │   └── page.tsx      // 명단 상세 + 수정
│           └── new/
│               └── page.tsx      // 명단 생성
└── components/
    ├── passenger-form.tsx        // shadcn/ui Form
    ├── roster-form.tsx
    ├── excel-upload.tsx          // 드래그 앤 드롭
    └── passenger-multi-select.tsx
```

### 의존성
- **xlsx**: 엑셀 파일 파싱 (`npm install xlsx`)
- **date-fns**: ISO Week 계산 (`npm install date-fns`)
- **Daum Postcode API**: 주소 검색 (Kakao 개발자 등록 필요)
- **shadcn/ui**: Form, Table, Multi-Select, Dialog

---

## ✅ 완료 조건 (Definition of Done)

- [ ] 모든 사용자 스토리 개발 완료
- [ ] Prisma 마이그레이션 완료 (Passenger, Roster, RosterEntry 모델)
- [ ] 엑셀 업로드 성공/실패 케이스 테스트
- [ ] 명단 복사 기능 검증 (Week +1 계산 정확도)
- [ ] 주소 검색 API 통합 테스트
- [ ] 관리자 포털 UI 구현 (shadcn/ui)

---

## 📅 일정
- **시작일**: Month 1, Week 3
- **완료일**: Month 2, Week 1
- **예상 공수**: 1.5주 (소규모 팀 기준)

---

## 🔗 관련 문서
- `docs/epics/epic-02-fleet-management.md` - 차량 관리 (선행 Epic)
- `docs/api/daum-postcode.md` - 주소 검색 API 가이드 (작성 예정)
- `CLAUDE.md` - 전체 프로젝트 개요
