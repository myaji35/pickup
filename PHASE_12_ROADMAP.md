# Phase 12: Driver Mobile App 로드맵

**목표:** 기사용 모바일 앱 개발 (운행 관리, 승객 체크인, 경로 안내)

**예상 기간:** 4-6주

**우선순위:** High

---

## 📋 개요

Phase 12에서는 기사(Driver)가 사용할 모바일 앱을 개발합니다. 이 앱은 일일 운행 관리, 승객 탑승/하차 체크인, 실시간 경로 안내 기능을 제공합니다.

### 핵심 목표

1. **운행 시작/종료:** 기사가 출퇴근 시 운행을 시작하고 종료
2. **승객 명단 확인:** 당일 태워야 할 승객 리스트 및 순서 표시
3. **체크인 시스템:** 승객 탑승/하차 시 수동 체크인
4. **경로 안내:** 외부 지도 앱(카카오내비, 티맵) 연동
5. **실시간 상태 동기화:** 백엔드와 실시간으로 운행 상태 업데이트

---

## 🏗️ 기술 스택

### Frontend (Mobile App)

**추천: React Native**
- **장점:**
  - TypeScript 지원 (기존 백엔드와 언어 통일)
  - Cross-platform (iOS + Android 동시 개발)
  - 빠른 개발 속도
  - 풍부한 라이브러리 생태계

**대안: Flutter**
- Dart 언어 (새로운 학습 필요)
- 성능 우수
- Google 지원

**선택 이유:** React Native 추천 (TypeScript 기반 프로젝트와 일관성)

### 주요 라이브러리

```json
{
  "dependencies": {
    "react-native": "0.73.x",
    "expo": "~50.x", // 빠른 프로토타입을 위해 Expo 사용 고려
    "@react-navigation/native": "^6.x", // 화면 네비게이션
    "@react-navigation/stack": "^6.x",
    "react-native-maps": "^1.x", // 지도 표시
    "react-native-geolocation-service": "^5.x", // GPS 위치 추적
    "axios": "^1.x", // API 호출
    "@react-native-async-storage/async-storage": "^1.x", // 로컬 저장소
    "react-native-qrcode-scanner": "^1.x", // QR 체크인 (향후)
    "react-native-permissions": "^4.x" // 위치, 카메라 권한
  }
}
```

### 백엔드 API 추가 필요

Phase 12에 필요한 새로운 API 엔드포인트:

```
POST   /driver/trips/start          # 운행 시작
POST   /driver/trips/end            # 운행 종료
GET    /driver/trips/today          # 오늘의 운행 목록
GET    /driver/trips/:id/passengers # 운행의 승객 명단
POST   /driver/checkin              # 승객 체크인 (탑승)
POST   /driver/checkout             # 승객 체크아웃 (하차)
GET    /driver/routes/:id           # 경로 정보 (좌표 목록)
```

---

## 🎯 주요 기능

### 1. 인증 (Authentication)

**화면:** 로그인

**기능:**
- 이메일/비밀번호 로그인
- JWT 토큰 저장 (AsyncStorage)
- 자동 로그인 (토큰 유효 시)
- 로그아웃

**Role 제한:**
- `DRIVER` 역할만 로그인 허용
- `INSTITUTION_ADMIN`이나 `SUPER_ADMIN`은 차단

**API:**
```typescript
POST /auth/login
{
  "email": "driver1@seoul.com",
  "password": "password123"
}

Response:
{
  "access_token": "...",
  "user": {
    "id": "...",
    "role": "DRIVER",
    "institutionId": "..."
  }
}
```

---

### 2. 홈 화면 (Home Screen)

**표시 정보:**
- 환영 메시지: "안녕하세요, 박기사님"
- 오늘의 운행 요약:
  - 오전 운행: 3건
  - 오후 운행: 3건
  - 총 승객: 12명
- 다음 운행 시간: "오전 7:00 출발"
- 현재 차량: "1234" (차량번호 뒤 4자리)

**빠른 작업 버튼:**
- "운행 시작" (큰 버튼, 주황색)
- "오늘의 운행 목록 보기"
- "내 정보"

---

### 3. 운행 시작 (Trip Start)

**시나리오:**
1. 기사가 "운행 시작" 버튼 클릭
2. GPS 위치 권한 요청 (최초 1회)
3. 현재 위치 확인
4. 운행 목록에서 선택:
   - "오전 운행 - 서울 주간보호센터"
   - "오후 운행 - 서울 주간보호센터"
5. 운행 시작 확인 다이얼로그
6. API 호출: `POST /driver/trips/start`

**상태 변화:**
- Trip 상태: `SCHEDULED` → `IN_PROGRESS`
- GPS 추적 시작 (10초마다 위치 전송)
- 승객 명단 화면으로 이동

---

### 4. 승객 명단 (Passenger List)

**표시 정보:**

```
┌─────────────────────────────────────────┐
│  오전 운행 - 서울 주간보호센터         │
│  7:00 출발 | 승객 4명                   │
├─────────────────────────────────────────┤
│                                         │
│  1️⃣  김영희 (70세, 여)                 │
│      📍 서울시 강남구 논현동 123       │
│      🕐 7:10 예상 도착                 │
│      [체크인]    [🗺️ 길찾기]           │
│                                         │
│  2️⃣  이철수 (75세, 남)                 │
│      📍 서울시 강남구 역삼동 456       │
│      🕐 7:20 예상 도착                 │
│      [체크인]    [🗺️ 길찾기]           │
│                                         │
│  3️⃣  박순자 (68세, 여)                 │
│      📍 서울시 강남구 삼성동 789       │
│      🕐 7:30 예상 도착                 │
│      [체크인]    [🗺️ 길찾기]           │
│                                         │
│  4️⃣  최민수 (72세, 남)                 │
│      📍 서울시 강남구 대치동 101       │
│      🕐 7:40 예상 도착                 │
│      [체크인]    [🗺️ 길찾기]           │
│                                         │
└─────────────────────────────────────────┘
     [운행 종료]
```

**탑승 순서:**
- AI 최적화된 순서 (Phase 11에서는 수동 입력, Q1 2025에 VRP 적용)
- 번호로 표시 (1, 2, 3, 4...)

**승객 정보:**
- 이름, 나이, 성별
- 픽업 주소
- 예상 도착 시간 (ETA)

**액션 버튼:**
- **체크인:** 승객 탑승 시 클릭
- **길찾기:** 외부 지도 앱 실행 (카카오내비, 티맵)

---

### 5. 승객 체크인 (Passenger Check-In)

**시나리오:**
1. 승객 탑승 시 "체크인" 버튼 클릭
2. 확인 다이얼로그:
   ```
   김영희 승객을 탑승 처리하시겠습니까?
   [취소]  [확인]
   ```
3. API 호출: `POST /driver/checkin`
4. 버튼 변경: "체크인" → "✅ 탑승 완료" (녹색)
5. 다음 승객으로 자동 스크롤

**체크인 정보:**
- 체크인 시각
- GPS 위치 (실제 픽업 위치 기록)
- 기사 ID

**API:**
```typescript
POST /driver/checkin
{
  "passengerId": "passenger-uuid",
  "tripId": "trip-uuid",
  "timestamp": "2025-11-25T07:10:00Z",
  "location": {
    "latitude": 37.123456,
    "longitude": 127.123456
  }
}
```

---

### 6. 경로 안내 (Navigation)

**"길찾기" 버튼 클릭 시:**

1. 외부 지도 앱 선택 다이얼로그 표시:
   ```
   ┌─────────────────────────────────┐
   │  지도 앱 선택                  │
   ├─────────────────────────────────┤
   │  🗺️  카카오내비               │
   │  🗺️  티맵 (T map)             │
   │  🗺️  네이버 지도              │
   └─────────────────────────────────┘
   ```

2. 선택한 앱으로 목적지 전송:
   ```typescript
   // 카카오내비 Deep Link
   const url = `kakaonavi://route?ep=${latitude},${longitude}&by=CAR`;
   Linking.openURL(url);

   // 티맵 Deep Link
   const url = `tmap://route?goalx=${longitude}&goaly=${latitude}`;
   Linking.openURL(url);
   ```

3. 지도 앱에서 경로 안내 시작

**Fallback:**
- 앱이 설치되지 않은 경우 앱 스토어로 이동
- 또는 웹 버전 지도 열기

---

### 7. 운행 종료 (Trip End)

**시나리오:**
1. 모든 승객 체크인 완료 후 "운행 종료" 버튼 활성화
2. "운행 종료" 버튼 클릭
3. 확인 다이얼로그:
   ```
   운행을 종료하시겠습니까?

   총 승객: 4명
   체크인 완료: 4명
   미체크인: 0명

   [취소]  [종료]
   ```
4. API 호출: `POST /driver/trips/end`
5. GPS 추적 중지
6. 홈 화면으로 이동

**운행 종료 조건:**
- ✅ 모든 승객 체크인 완료
- ⚠️ 미체크인 승객이 있으면 경고 표시

**API:**
```typescript
POST /driver/trips/end
{
  "tripId": "trip-uuid",
  "endTime": "2025-11-25T08:30:00Z",
  "endLocation": {
    "latitude": 37.123456,
    "longitude": 127.123456
  }
}
```

---

### 8. 내 정보 (Profile)

**표시 정보:**
- 이름
- 이메일
- 소속 회원사
- 배정된 차량 (차량번호 뒤 4자리)

**액션:**
- 로그아웃

---

## 📱 화면 구조

```
App
├── Auth Stack (인증되지 않은 경우)
│   └── LoginScreen
│
└── Main Stack (인증된 경우)
    ├── HomeScreen (탭 1)
    │   ├── TripListScreen (오늘의 운행 목록)
    │   └── TripDetailScreen (운행 상세)
    │       └── PassengerListScreen (승객 명단)
    │
    ├── HistoryScreen (탭 2) - 향후 추가
    │   └── TripHistoryDetailScreen
    │
    └── ProfileScreen (탭 3)
        └── SettingsScreen
```

**Bottom Tab Navigation:**
```
┌─────────┬─────────┬─────────┐
│  🏠 홈  │ 📜 기록 │ 👤 내정보 │
└─────────┴─────────┴─────────┘
```

---

## 🗄️ 백엔드 확장 (Phase 12)

### 새로운 엔티티

#### Trip (운행)
```prisma
model Trip {
  id              String   @id @default(uuid())
  institutionId   String
  vehicleId       String
  driverId        String
  routeId         String?

  type            TripType // MORNING, EVENING, TEMPORARY
  status          TripStatus // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

  scheduledStart  DateTime
  actualStart     DateTime?
  actualEnd       DateTime?

  startLocation   Json? // { lat, lng }
  endLocation     Json?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  institution     Institution @relation(fields: [institutionId], references: [id])
  vehicle         Vehicle @relation(fields: [vehicleId], references: [id])
  driver          User @relation(fields: [driverId], references: [id])
  route           Route? @relation(fields: [routeId], references: [id])

  checkIns        CheckIn[]
}

enum TripType {
  MORNING
  EVENING
  TEMPORARY
}

enum TripStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

#### CheckIn (승객 체크인)
```prisma
model CheckIn {
  id              String   @id @default(uuid())
  tripId          String
  passengerId     String

  type            CheckInType // BOARDING, ALIGHTING
  timestamp       DateTime
  location        Json // { lat, lng }

  createdAt       DateTime @default(now())

  trip            Trip @relation(fields: [tripId], references: [id])
  passenger       Passenger @relation(fields: [passengerId], references: [id])
}

enum CheckInType {
  BOARDING   // 탑승
  ALIGHTING  // 하차
}
```

### 새로운 API 엔드포인트

#### 운행 관리
```typescript
// 운행 시작
POST /driver/trips/:id/start
Body: { startLocation: { lat, lng } }
Response: { trip: Trip }

// 운행 종료
POST /driver/trips/:id/end
Body: { endLocation: { lat, lng } }
Response: { trip: Trip }

// 오늘의 운행 목록
GET /driver/trips/today
Response: { trips: Trip[] }

// 운행 상세 (승객 명단 포함)
GET /driver/trips/:id
Response: {
  trip: Trip,
  passengers: Passenger[],
  checkIns: CheckIn[]
}
```

#### 체크인 관리
```typescript
// 승객 체크인 (탑승)
POST /driver/checkin
Body: {
  tripId: string,
  passengerId: string,
  timestamp: string,
  location: { lat, lng }
}
Response: { checkIn: CheckIn }

// 승객 체크아웃 (하차)
POST /driver/checkout
Body: {
  tripId: string,
  passengerId: string,
  timestamp: string,
  location: { lat, lng }
}
Response: { checkIn: CheckIn }
```

---

## 🚀 개발 단계

### Phase 12.1: 기본 인증 및 홈 화면 (1주)

**태스크:**
- [ ] React Native 프로젝트 생성 (Expo 또는 bare workflow)
- [ ] 로그인 화면 UI
- [ ] JWT 인증 구현 (AsyncStorage)
- [ ] 홈 화면 기본 레이아웃
- [ ] Bottom Tab Navigation 설정

**Backend:**
- [ ] Driver용 인증 검증 (role: DRIVER만 허용)

---

### Phase 12.2: 운행 시작/종료 (1주)

**태스크:**
- [ ] 운행 시작 화면
- [ ] GPS 위치 권한 요청
- [ ] 운행 목록 조회 API 연동
- [ ] 운행 시작 API 호출
- [ ] 운행 종료 화면
- [ ] 운행 종료 API 호출

**Backend:**
- [ ] Trip 엔티티 생성
- [ ] `POST /driver/trips/:id/start` API
- [ ] `POST /driver/trips/:id/end` API
- [ ] `GET /driver/trips/today` API

---

### Phase 12.3: 승객 명단 및 체크인 (1.5주)

**태스크:**
- [ ] 승객 명단 화면 UI
- [ ] 승객 리스트 컴포넌트
- [ ] 체크인 버튼 및 다이얼로그
- [ ] 체크인 API 호출
- [ ] 체크인 상태 실시간 업데이트
- [ ] 체크인 완료 시 시각적 피드백

**Backend:**
- [ ] CheckIn 엔티티 생성
- [ ] `POST /driver/checkin` API
- [ ] `POST /driver/checkout` API
- [ ] 승객 명단 조회 API (`GET /driver/trips/:id`)

---

### Phase 12.4: 경로 안내 연동 (0.5주)

**태스크:**
- [ ] 카카오내비 Deep Link 구현
- [ ] 티맵 Deep Link 구현
- [ ] 지도 앱 선택 다이얼로그
- [ ] 앱 미설치 시 Fallback 처리

---

### Phase 12.5: 테스팅 및 배포 (1주)

**태스크:**
- [ ] 단위 테스트 (Jest)
- [ ] E2E 테스트 (Detox)
- [ ] 실제 기기 테스트
- [ ] iOS 빌드 (TestFlight)
- [ ] Android 빌드 (Google Play Internal Testing)
- [ ] 사용자 피드백 수집

**Backend:**
- [ ] API 통합 테스트
- [ ] 성능 테스트 (GPS 추적 부하 테스트)

---

## 📊 성공 지표 (KPI)

### 기술적 지표
- [ ] 로그인 성공률 > 99%
- [ ] API 응답 시간 < 500ms
- [ ] GPS 위치 업데이트 주기: 10초
- [ ] 앱 크래시율 < 1%

### 사용자 경험 지표
- [ ] 운행 시작 소요 시간 < 30초
- [ ] 승객 체크인 소요 시간 < 10초
- [ ] 기사 만족도 > 4.0/5.0

---

## 🔐 보안 고려사항

### 인증
- JWT 토큰 만료 시간: 15분
- Refresh 토큰으로 자동 갱신
- 로그아웃 시 토큰 삭제

### GPS 위치
- 위치 데이터는 암호화하여 전송 (HTTPS)
- 운행 중에만 위치 추적
- 운행 종료 시 GPS 중지

### 승객 개인정보
- 승객 전화번호, 주소 등은 최소한만 표시
- 로컬 저장소에 민감 정보 저장 금지

---

## 🎨 UI/UX 가이드라인

### 색상 테마
- Primary: `#FF6B35` (주황색) - 운행 시작 버튼
- Success: `#4CAF50` (녹색) - 체크인 완료
- Warning: `#FFC107` (노란색) - 경고 메시지
- Error: `#F44336` (빨간색) - 오류 메시지

### 폰트
- 헤더: 18-24px, Bold
- 본문: 14-16px, Regular
- 작은 텍스트: 12px, Light

### 아이콘
- [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons) 사용
- Ionicons 세트 추천

---

## 📦 배포 전략

### iOS
1. Apple Developer 계정 필요 ($99/year)
2. Xcode에서 빌드
3. TestFlight로 베타 테스트
4. App Store 배포

### Android
1. Google Play Console 계정 필요 ($25 일회성)
2. Android Studio에서 빌드
3. Internal Testing으로 베타 테스트
4. Google Play 배포

### Over-the-Air (OTA) 업데이트
- Expo Updates 또는 CodePush 사용
- 앱 스토어 재배포 없이 버그 수정 가능

---

## 🚧 알려진 제약사항

### Phase 12에서 미포함 기능
- ❌ QR 코드 체크인 (Phase 13으로 연기)
- ❌ NFC 체크인 (Phase 13으로 연기)
- ❌ BLE 비콘 자동 체크인 (Q1 2025)
- ❌ AI 경로 최적화 (Q1 2025 - OR-Tools VRP)
- ❌ 실시간 지도 표시 (Phase 13)
- ❌ 채팅 기능 (향후 검토)

### 기술적 제약
- iOS 백그라운드 GPS 추적: 배터리 소모 이슈
- Android 위치 권한: "항상 허용" 필요
- Deep Link: 지도 앱이 설치되어 있어야 함

---

## 📚 참고 자료

### React Native 공식 문서
- https://reactnative.dev/
- https://reactnavigation.org/

### 지도 및 위치 서비스
- React Native Maps: https://github.com/react-native-maps/react-native-maps
- Geolocation API: https://github.com/michalchudziak/react-native-geolocation

### Deep Linking
- 카카오내비 API: https://developers.kakao.com/
- 티맵 API: https://tmapapi.sktelecom.com/

### 백엔드 참고
- Prisma: https://www.prisma.io/docs
- NestJS: https://docs.nestjs.com/

---

## 🤝 협업 가이드

### Frontend 개발자
- React Native 경험 필요
- TypeScript 숙지
- 모바일 UI/UX 이해

### Backend 개발자
- NestJS 및 Prisma 경험
- GPS 데이터 처리 이해
- RESTful API 설계

### QA 엔지니어
- 실제 차량에서 현장 테스트 필요
- iOS/Android 양쪽 테스트
- GPS 정확도 검증

---

**작성일:** 2025-11-25
**Phase:** 12 준비 단계
**다음 단계:** Phase 12.1 착수 (백엔드 Trip 엔티티 생성부터)
