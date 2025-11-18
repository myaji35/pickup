# Epic 6: 승객/보호자 모바일 앱

**Epic ID**: EPIC-006
**우선순위**: P0 (Critical)
**Stage**: MVP (Month 3)
**플랫폼**: React Native (Expo)

---

## 📋 Epic 개요

### 목표
승객(학생, 어르신) 또는 보호자(학부모, 가족)가 셔틀의 실시간 위치를 확인하고, 운행 일정을 조회하며, 푸시 알림을 받을 수 있는 앱 개발

### 비즈니스 가치
- 보호자 안심 서비스 제공 (B2B 차별화 포인트)
- 셔틀 도착 시간 예측으로 대기 시간 최소화
- 승하차 확인 알림으로 안전 확인
- 기관 고객 만족도 향상

### 성공 지표
- 앱 다운로드 및 활성화율 > 80% (등록 승객 기준)
- 실시간 위치 조회 성공률 > 95%
- 푸시 알림 수신률 > 90%
- NPS (Net Promoter Score) > 70

---

## 👥 사용자 페르소나

### 1차 페르소나: 학부모 (30-50대)
- **자녀**: 초등학생 학원생
- **니즈**:
  - 셔틀이 언제 도착하는지 알고 싶음
  - 자녀가 안전하게 탑승/하차했는지 확인
  - 갑작스러운 결석 시 셔틀 취소 요청
- **페인 포인트**:
  - 셔틀 지연 시 불안감
  - 자녀 탑승 여부 확인 위해 학원에 전화해야 함

### 2차 페르소나: 요양원 보호자 (40-60대)
- **대상**: 부모님 (70-80대 어르신)
- **니즈**:
  - 부모님이 통원 차량을 잘 타셨는지 확인
  - 귀가 시간 예상하여 집에서 준비
  - 긴급 상황 시 연락 가능 여부
- **페인 포인트**:
  - 부모님이 직접 연락하기 어려움
  - 요양원과 소통 채널 부족

### 3차 페르소나: 성인 승객 (데이케어 이용자)
- **나이**: 20-40대
- **니즈**:
  - 내가 타야 할 셔틀 시간 확인
  - 실시간 위치로 놓치지 않도록
- **페인 포인트**:
  - 정확한 도착 시간 모름

---

## 🎯 범위 (Scope)

### In Scope (MVP 포함)
✅ 승객/보호자 계정 생성 (Clerk Phone Auth)
✅ 내 운행 일정 조회 (이번 주 스케줄)
✅ 실시간 셔틀 위치 지도 표시
✅ 간단한 ETA 표시 (직선거리 기반)
✅ 푸시 알림
  - 운행 시작 알림
  - 승하차 확인 알림
✅ 당일 운행 취소 요청 (승객 부재 알림)

### Out of Scope (Stage 2 이후)
❌ 임시 셔틀 예약
❌ 정확한 AI 기반 ETA
❌ Geofence 도착 임박 알림
❌ 인앱 채팅 (기사와 소통)
❌ 운행 이력 조회

---

## 📖 사용자 스토리

### Story 6.1: 보호자 계정 생성 및 승객 연결
**As a** 보호자
**I want to** 앱에서 계정을 생성하고 내 자녀/부모님을 등록
**So that** 해당 승객의 셔틀 정보를 받을 수 있다

**인수 조건**:
- Clerk Phone Number Authentication
- 회원가입 시 "초대 코드" 입력 (기관 관리자가 발급)
- 초대 코드로 승객 ID 매칭
- 1명의 승객에 여러 보호자 계정 연결 가능 (형제 자매)

**기술 힌트**:
- 초대 코드는 Passenger 테이블에 `inviteCode` 컬럼 추가
- API: `POST /api/passengers/link` (초대 코드 검증)

---

### Story 6.2: 이번 주 운행 일정 조회
**As a** 보호자
**I want to** 이번 주 셔틀 운행 일정을 확인
**So that** 언제 셔틀이 운행되는지 미리 알 수 있다

**인수 조건**:
- 홈 화면에 주간 캘린더 표시
- 오전/저녁 셔틀 구분 (아이콘)
- 운행 없는 날은 회색 표시
- 오늘 운행이 있으면 하이라이트

**기술 힌트**:
- API: `GET /api/passengers/[id]/schedule?week=2025-W10`
- `react-native-calendars` 사용

---

### Story 6.3: 실시간 셔틀 위치 확인
**As a** 보호자
**I want to** 지금 셔틀이 어디에 있는지 지도에서 확인
**So that** 언제 도착할지 예상할 수 있다

**인수 조건**:
- 홈 화면에 지도 표시 (React Native Maps)
- 셔틀 마커 + 내 자녀 픽업 위치 마커
- 운행 중일 때만 지도 활성화
- 대기 중이면 "아직 출발 전입니다" 표시

**기술 힌트**:
- API: `GET /api/trips/[tripId]/location` (3초마다 polling)
- React Native Maps

---

### Story 6.4: 간단한 ETA 표시
**As a** 보호자
**I want to** 셔틀이 대략 몇 분 후 도착하는지 확인
**So that** 준비할 수 있다

**인수 조건**:
- 지도 하단에 "약 X분 후 도착" 표시
- 직선거리 기반 간단한 계산 (평균 30km/h)
- 운행 전이면 "곧 출발합니다" 표시
- (Stage 2에서 AI 기반 정확한 ETA로 대체)

---

### Story 6.5: 운행 시작 푸시 알림
**As a** 보호자
**I want to** 셔틀이 출발하면 푸시 알림을 받음
**So that** 자녀가 준비할 수 있도록 알려줄 수 있다

**인수 조건**:
- 기사가 "운행 시작" 버튼 클릭 시 자동 발송
- 알림 내용: "셔틀이 출발했습니다. 실시간 위치를 확인하세요."
- 알림 클릭 시 앱의 지도 화면으로 이동
- FCM (Firebase Cloud Messaging) 사용

**기술 힌트**:
- API: `POST /api/notifications/send` (운행 시작 이벤트 트리거)
- Expo Notifications

---

### Story 6.6: 승하차 확인 푸시 알림
**As a** 보호자
**I want to** 자녀가 탑승/하차했을 때 푸시 알림을 받음
**So that** 안전하게 이동했는지 확인할 수 있다

**인수 조건**:
- 기사가 승객 체크인/체크아웃 시 자동 발송
- 탑승 알림: "김민수 학생이 셔틀에 탑승했습니다."
- 하차 알림: "김민수 학생이 학원에 도착했습니다."
- 알림 기록은 앱 내 "알림 센터"에서 확인 가능

---

### Story 6.7: 당일 운행 취소 요청
**As a** 보호자
**I want to** 자녀가 갑자기 결석하면 당일 셔틀을 취소
**So that** 기사가 불필요하게 방문하지 않도록 할 수 있다

**인수 조건**:
- 일정 화면에서 "오늘 결석" 버튼
- 확인 다이얼로그 ("오늘 셔틀을 취소하시겠습니까?")
- 확인 시 기사 앱에 알림 전송
- 기관 관리자에게도 알림 전송
- 취소는 운행 시작 1시간 전까지만 가능

**기술 힌트**:
- RosterEntry에 `status` 필드 추가 (active, cancelled)
- API: `POST /api/roster-entries/[id]/cancel`

---

### Story 6.8: 프로필 및 설정
**As a** 보호자
**I want to** 내 정보와 알림 설정을 관리
**So that** 필요에 맞게 앱을 사용할 수 있다

**인수 조건**:
- 프로필: 보호자 이름, 연락처, 연결된 승객 정보
- 알림 설정: 운행 시작, 승하차 알림 on/off
- 로그아웃 버튼
- 앱 버전 및 고객센터 연락처 표시

---

## 🔧 기술 고려사항

### 데이터 모델 확장 (Prisma Schema)
```prisma
model Passenger {
  id            String   @id @default(uuid())
  institutionId String
  name          String
  phone         String
  pickupAddress String
  dropoffAddress String
  inviteCode    String   @unique  // 보호자 초대 코드

  institution   Institution @relation(fields: [institutionId], references: [id])
  guardians     Guardian[]
  rosterEntries RosterEntry[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Guardian {
  id            String   @id @default(uuid())
  clerkUserId   String   @unique
  name          String
  phone         String
  passengerId   String

  passenger     Passenger @relation(fields: [passengerId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model RosterEntry {
  id            String   @id @default(uuid())
  rosterId      String
  passengerId   String
  boardingOrder Int?
  boardedAt     DateTime?
  alightedAt    DateTime?
  status        RosterEntryStatus @default(ACTIVE)  // 신규

  roster        Roster    @relation(fields: [rosterId], references: [id], onDelete: Cascade)
  passenger     Passenger @relation(fields: [passengerId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([rosterId, passengerId])
}

enum RosterEntryStatus {
  ACTIVE     // 정상
  CANCELLED  // 당일 취소
}
```

### API 엔드포인트
```typescript
// app/api/passengers/link/route.ts
export async function POST(req: Request) {
  // 초대 코드로 승객-보호자 연결
}

// app/api/passengers/[id]/schedule/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // 주간 운행 일정 조회
}

// app/api/roster-entries/[id]/cancel/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  // 당일 운행 취소
}

// app/api/notifications/send/route.ts
export async function POST(req: Request) {
  // FCM 푸시 알림 발송
}
```

### 앱 구조 (React Native Expo)
```
apps/passenger-app/
├── app/
│   ├── (auth)/
│   │   ├── sign-in.tsx           // 로그인
│   │   └── link-passenger.tsx    // 초대 코드 입력
│   ├── (tabs)/
│   │   ├── index.tsx             // 홈 (지도 + ETA)
│   │   ├── schedule.tsx          // 주간 일정
│   │   ├── notifications.tsx     // 알림 센터
│   │   └── profile.tsx           // 프로필 및 설정
├── components/
│   ├── shuttle-map.tsx           // 실시간 지도
│   ├── eta-card.tsx              // ETA 카드
│   └── schedule-calendar.tsx     // 주간 캘린더
└── services/
    ├── trip-poller.ts            // 3초마다 위치 polling
    └── notifications.ts          // FCM 핸들러
```

### 의존성
- **Expo**: `expo`, `expo-router`
- **@clerk/clerk-expo**: 인증
- **react-native-maps**: 지도
- **expo-notifications**: 푸시 알림 (FCM)
- **react-native-calendars**: 주간 캘린더
- **@react-native-async-storage/async-storage**: 로컬 저장소

---

## 🎨 UI/UX 가이드라인

### 디자인 원칙
1. **보호자 친화적**: 직관적이고 간결한 UI (30-60대 사용자)
2. **안심감 전달**: 큰 지도, 명확한 상태 표시
3. **알림 중심**: 푸시 알림으로 능동적 정보 제공
4. **빠른 로딩**: 지도 로딩 3초 이내

### 주요 화면 플로우
```
로그인 → 초대 코드 입력 (승객 연결) → 홈 (지도 + ETA) →
주간 일정 확인 → 알림 센터 → 프로필 설정
```

### 색상 및 아이콘
- **Primary**: 파란색 (신뢰감)
- **Success**: 초록색 (탑승 완료)
- **Warning**: 주황색 (운행 중)
- **Danger**: 빨간색 (취소)

---

## ✅ 완료 조건 (Definition of Done)

- [ ] 모든 사용자 스토리 개발 완료
- [ ] Prisma 마이그레이션 (Guardian, RosterEntry.status 추가)
- [ ] Clerk 인증 및 초대 코드 연결 테스트
- [ ] 실시간 지도 표시 및 polling 동작 검증
- [ ] FCM 푸시 알림 발송/수신 테스트 (iOS/Android)
- [ ] 당일 취소 기능 검증
- [ ] 앱 빌드 및 TestFlight/Google Play Internal Testing 배포

---

## 📅 일정
- **시작일**: Month 2, Week 4
- **완료일**: Month 3, Week 2
- **예상 공수**: 2주 (소규모 팀 기준)

---

## 🔗 관련 문서
- `docs/epics/epic-04-realtime-tracking.md` - 실시간 추적 (위치 조회)
- `docs/epics/epic-05-driver-mobile-app.md` - 기사 앱 (승하차 체크인)
- `docs/api/fcm.md` - FCM 푸시 알림 가이드 (작성 예정)
- `CLAUDE.md` - 전체 프로젝트 개요
