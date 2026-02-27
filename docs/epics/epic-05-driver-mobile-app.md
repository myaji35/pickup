# Epic 5: 기사 모바일 앱

**Epic ID**: EPIC-005
**우선순위**: P0 (Critical)
**Stage**: MVP (Month 2-3)
**플랫폼**: React Native (Expo)

---

## 📋 Epic 개요

### 목표
기사가 모바일 앱에서 당일 승객 명단을 확인하고, 운행을 시작/종료하며, 승객 체크인을 수동으로 처리할 수 있는 앱 개발

### 비즈니스 가치
- 기사의 업무 효율성 향상 (종이 명단 대체)
- 운행 데이터 자동 수집
- 승객 탑승 이력 디지털화
- 향후 내비게이션 연동 기반 마련

### 성공 지표
- 앱 로그인 성공률 > 95%
- 운행 시작 소요 시간 < 30초
- 승객 체크인 완료 시간 < 5초/명

---

## 👥 사용자 페르소나

### 1차 사용자: 셔틀 기사
- **역할**: 학원/요양원 셔틀 운행 기사
- **연령대**: 40-60대
- **디지털 리터러시**: 중하 (간단한 모바일 앱 사용 가능)
- **니즈**:
  - 오늘 태워야 할 승객 리스트 확인
  - 간단한 버튼 클릭으로 운행 시작/종료
  - 승객 탑승 확인 (수동 체크)
- **페인 포인트**:
  - 종이 명단 분실, 비/바람에 찢어짐
  - 변경사항 미전달 (전화 연락 누락)
  - 복잡한 앱 UI는 사용 어려움

---

## 🎯 범위 (Scope)

### In Scope (MVP 포함)
✅ Clerk 기사 계정 로그인
✅ 당일 운행 명단 조회 (오전/저녁 구분)
✅ 운행 시작/종료 버튼
✅ 승객 수동 체크인 (탑승/하차)
✅ 내비게이션 앱 연동 (Tmap, 카카오내비 외부 앱 실행)
✅ 간단한 대시보드 (오늘 운행 현황)

### Out of Scope (Stage 2 이후)
❌ QR/NFC 승객 체크인
❌ 영수증 업로드 + OCR
❌ 임시 셔틀 요청 수락
❌ 인앱 내비게이션

---

## 📖 사용자 스토리

### Story 5.1: 기사 로그인
**As a** 기사
**I want to** 휴대폰 번호와 비밀번호로 로그인
**So that** 내 운행 정보에 접근할 수 있다

**인수 조건**:
- Clerk Phone Number Authentication
- 로그인 성공 시 홈 화면으로 이동
- 로그인 실패 시 명확한 에러 메시지 표시
- 자동 로그인 유지 (Biometric 선택 사항)

**기술 힌트**:
- `@clerk/clerk-expo` 사용
- Clerk Metadata에서 기사 ID 조회

---

### Story 5.2: 당일 운행 명단 조회
**As a** 기사
**I want to** 오늘 태워야 할 승객 리스트를 확인
**So that** 누구를 어디서 태우는지 알 수 있다

**인수 조건**:
- 홈 화면에 오전/저녁 탭 구분
- 각 탭에 해당 명단의 승객 리스트 표시
  - 승객 이름, 픽업 주소, 하차 주소
- MVP에서는 순서 없음 (Stage 2에서 AI 최적화 순서 표시)
- 당일 운행이 없으면 "오늘은 운행이 없습니다" 표시

**기술 힌트**:
- API: `GET /api/drivers/[driverId]/rosters/today`
- shadcn-like native components (NativeWind)

---

### Story 5.3: 운행 시작
**As a** 기사
**I want to** "운행 시작" 버튼을 누름
**So that** GPS 추적이 시작되고 승객에게 알림이 전송된다

**인수 조건**:
- 명단 화면 상단에 큰 "운행 시작" 버튼
- 클릭 시 확인 다이얼로그 ("운행을 시작하시겠습니까?")
- 확인 시 Trip 생성, GPS 추적 시작
- 버튼 → "운행 종료" 버튼으로 변경
- 승객 앱으로 푸시 알림 자동 발송

**기술 힌트**:
- API: `POST /api/trips/start`
- Expo Location Background Task

---

### Story 5.4: 승객 수동 체크인 (탑승)
**As a** 기사
**I want to** 승객이 탑승하면 체크박스를 클릭
**So that** 탑승 기록이 남는다

**인수 조건**:
- 명단의 각 승객 옆에 "탑승" 체크박스
- 클릭 시 즉시 DB 업데이트
- 시각적 피드백 (회색 → 초록색)
- 탑승 시각 자동 기록

**기술 힌트**:
- API: `POST /api/roster-entries/[id]/board`
- Optimistic UI 업데이트

---

### Story 5.5: 승객 수동 체크인 (하차)
**As a** 기사
**I want to** 승객이 하차하면 체크박스를 클릭
**So that** 하차 기록이 남는다

**인수 조건**:
- 각 승객 옆에 "하차" 체크박스
- 탑승하지 않은 승객은 하차 불가 (비활성화)
- 클릭 시 즉시 DB 업데이트
- 하차 시각 자동 기록

---

### Story 5.6: 운행 종료
**As a** 기사
**I want to** "운행 종료" 버튼을 누름
**So that** GPS 추적이 중단되고 운행이 완료된다

**인수 조건**:
- 확인 다이얼로그 ("운행을 종료하시겠습니까?")
- 미탑승/미하차 승객 있으면 경고 표시
- 확인 시 Trip 완료, GPS 중단
- 완료 화면으로 이동 (운행 요약: 탑승 X명, 총 시간 등)

**기술 힌트**:
- API: `POST /api/trips/[tripId]/end`

---

### Story 5.7: 내비게이션 연동
**As a** 기사
**I want to** 승객 주소를 클릭하면 내비게이션 앱이 열림
**So that** 길을 찾을 수 있다

**인수 조건**:
- 픽업/하차 주소 클릭 시 선택 다이얼로그
  - Tmap
  - 카카오내비
  - Google Maps
- 선택한 앱으로 목적지 전달하여 외부 앱 실행
- 앱 미설치 시 안내 메시지

**기술 힌트**:
- `expo-linking` 사용
- Tmap URL Scheme: `tmap://route?goalname=목적지&goalx=경도&goaly=위도`
- Kakao Navi: `kakaonavi://navigate?destname=목적지&destx=경도&desty=위도`

---

### Story 5.8: 홈 대시보드
**As a** 기사
**I want to** 앱 첫 화면에서 오늘 운행 현황을 확인
**So that** 빠르게 상황을 파악할 수 있다

**인수 조건**:
- 오늘 운행 횟수 (오전/저녁)
- 현재 상태 (대기/운행 중/완료)
- 총 승객 수
- 간단한 캘린더 (당월 운행 일정)

---

## 🔧 기술 고려사항

### 데이터 모델 확장 (Prisma Schema)
```prisma
model RosterEntry {
  id            String   @id @default(uuid())
  rosterId      String
  passengerId   String
  boardingOrder Int?     // MVP: null, Stage 2: AI 최적화

  // MVP 추가 필드
  boardedAt     DateTime?  // 탑승 시각
  alightedAt    DateTime?  // 하차 시각

  roster        Roster    @relation(fields: [rosterId], references: [id], onDelete: Cascade)
  passenger     Passenger @relation(fields: [passengerId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([rosterId, passengerId])
}
```

### API 엔드포인트
```typescript
// app/api/drivers/[driverId]/rosters/today/route.ts
export async function GET(req: Request, { params }: { params: { driverId: string } }) {
  // 오늘 운행할 명단 조회
}

// app/api/roster-entries/[id]/board/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  // 탑승 체크인
}

// app/api/roster-entries/[id]/alight/route.ts
export async function POST(req: Request, { params }: { params: { id: string } }) {
  // 하차 체크인
}
```

### 앱 구조 (React Native Expo)
```
apps/driver-app/
├── app/
│   ├── (auth)/
│   │   └── sign-in.tsx           // 로그인 화면
│   ├── (tabs)/
│   │   ├── index.tsx             // 홈 대시보드
│   │   ├── morning.tsx           // 오전 명단
│   │   ├── evening.tsx           // 저녁 명단
│   │   └── profile.tsx           // 내 정보
│   └── trip-active.tsx           // 운행 중 화면
├── components/
│   ├── passenger-list-item.tsx   // 승객 리스트 아이템
│   ├── trip-start-button.tsx     // 운행 시작 버튼
│   └── trip-summary-card.tsx     // 운행 요약 카드
└── services/
    ├── location-tracker.ts       // Background GPS
    └── api.ts                    // API 호출
```

### 의존성
- **Expo**: `expo`, `expo-router`
- **@clerk/clerk-expo**: 인증
- **expo-location**: GPS 추적
- **expo-linking**: 내비게이션 앱 연동
- **NativeWind**: Tailwind CSS for React Native
- **react-native-async-storage**: 로컬 저장소

---

## 🎨 UI/UX 가이드라인

### 디자인 원칙
1. **큰 버튼**: 운전 중 터치하기 쉽도록 최소 60px 높이
2. **명확한 색상**:
   - 운행 시작: 초록색
   - 운행 종료: 빨간색
   - 탑승 완료: 파란색
3. **간결한 텍스트**: 고령 기사도 읽기 쉬운 큰 폰트 (16px 이상)
4. **오프라인 대응**: 네트워크 끊김 시 로컬 저장 후 재연결 시 동기화

### 주요 화면 플로우
```
로그인 → 홈 대시보드 → 오전/저녁 명단 선택 → 운행 시작 →
승객 체크인 (탑승/하차) → 운행 종료 → 운행 요약
```

---

## ✅ 완료 조건 (Definition of Done)

- [ ] 모든 사용자 스토리 개발 완료
- [ ] Clerk 인증 연동 및 기사 계정 로그인 테스트
- [ ] 당일 명단 조회 API 통합
- [ ] 운행 시작/종료 기능 검증
- [ ] GPS Background Tracking 동작 확인
- [ ] 승객 체크인/체크아웃 UI/UX 검증
- [ ] Tmap/카카오내비 연동 테스트
- [ ] 앱 빌드 및 TestFlight/Google Play Internal Testing 배포

---

## 📅 일정
- **시작일**: Month 2, Week 2
- **완료일**: Month 3, Week 1
- **예상 공수**: 2주 (소규모 팀 기준)

---

## 🔗 관련 문서
- `docs/epics/epic-04-realtime-tracking.md` - 실시간 추적 (GPS 수집)
- `docs/api/tmap-kakaonavi.md` - 내비게이션 연동 가이드 (작성 예정)
- `CLAUDE.md` - 전체 프로젝트 개요
