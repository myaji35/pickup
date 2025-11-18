# Epic 4: 실시간 차량 추적

**Epic ID**: EPIC-004
**우선순위**: P0 (Critical)
**Stage**: MVP (Month 2)
**담당 Context**: Fleet Context + Route Context (일부)

---

## 📋 Epic 개요

### 목표
운행 중인 셔틀의 GPS 위치를 실시간으로 수집하고, 관리자와 승객/보호자가 지도에서 확인할 수 있도록 함

### 비즈니스 가치
- 기관 관리자: 전체 차량 실시간 모니터링
- 승객/보호자: 셔틀 도착 예상 시간 확인, 안심
- 운영팀: 운행 이력 데이터 수집 (향후 BI 활용)

### 성공 지표
- GPS 위치 업데이트 주기 < 10초
- 지도 로딩 시간 < 3초
- 위치 데이터 정확도 < 50m

---

## 👥 사용자 페르소나

### 1차 사용자: 기관 관리자
- **역할**: 학원 원장, 요양원 관리자
- **니즈**: 현재 운행 중인 모든 차량을 지도에서 한눈에 확인
- **페인 포인트**: 기사에게 전화해서 위치 물어봐야 함

### 2차 사용자: 승객/보호자
- **역할**: 학원생 학부모, 요양원 보호자
- **니즈**: 내가 탈 셔틀이 언제 도착하는지 확인
- **페인 포인트**: 도착 시간 불확실성, 불안감

### 3차 사용자: 기사
- **역할**: 셔틀 운행 기사
- **니즈**: 운행 시작 버튼 클릭 시 자동으로 GPS 추적 시작
- **페인 포인트**: 복잡한 조작

---

## 🎯 범위 (Scope)

### In Scope (MVP 포함)
✅ 기사 앱에서 운행 시작/종료 (Trip Start/End)
✅ 운행 중 GPS 좌표 주기적 수집 (10초 간격)
✅ 실시간 위치 데이터 저장 (Redis + PostgreSQL)
✅ 관리자 포털 지도에서 전체 차량 위치 표시
✅ 승객 앱 지도에서 내 셔틀 위치 표시
✅ 기본 ETA 계산 (직선거리 기반)

### Out of Scope (Stage 2 이후)
❌ AI 경로 최적화 기반 정확한 ETA
❌ Geofence 기반 도착 알림
❌ GPS Snap-to-Roads API (도로 보정)
❌ 과거 운행 이력 재생 (Playback)

---

## 📖 사용자 스토리

### Story 4.1: 운행 시작 (Trip Start)
**As a** 기사
**I want to** 기사 앱에서 "운행 시작" 버튼을 누름
**So that** GPS 추적이 자동으로 시작되고 승객에게 알림이 전송된다

**인수 조건**:
- 기사 앱에서 당일 명단 조회 후 "운행 시작" 버튼 표시
- 버튼 클릭 시 Trip 레코드 생성 (상태: IN_PROGRESS)
- GPS 위치 수집 시작 (10초 간격)
- 해당 명단의 모든 승객/보호자에게 푸시 알림 발송
  - "셔틀이 출발했습니다. 실시간 위치를 확인하세요."

**기술 힌트**:
- React Native Expo Location API
- Background location tracking 활성화
- FCM 푸시 알림 (승객 앱으로)

---

### Story 4.2: GPS 위치 수집 및 저장
**As a** 시스템
**I want to** 운행 중 기사 앱에서 GPS 좌표를 주기적으로 수집
**So that** 실시간 위치를 지도에 표시할 수 있다

**인수 조건**:
- 10초마다 위도(lat), 경도(lng), 타임스탬프 수집
- Next.js API Route로 전송 (`POST /api/trips/[tripId]/location`)
- Redis에 최신 위치 저장 (TTL 1시간)
- PostgreSQL에 주기적으로 배치 삽입 (1분마다)

**기술 힌트**:
- Redis 키: `trip:{tripId}:location`
- PostgreSQL `LocationLog` 테이블에 이력 저장

---

### Story 4.3: 관리자 포털 - 전체 차량 지도 표시
**As a** 기관 관리자
**I want to** 관리자 포털에서 운행 중인 모든 차량을 지도에 표시
**So that** 전체 차량 현황을 한눈에 파악할 수 있다

**인수 조건**:
- Kakao Map 또는 Naver Map 사용
- 운행 중인 차량만 마커로 표시 (차량번호 뒤 4자리)
- 마커 클릭 시 차량 정보 + 현재 명단 표시
- 3초마다 위치 자동 갱신 (polling 또는 WebSocket)

**기술 힌트**:
- `react-kakao-maps-sdk` 또는 `react-naver-maps`
- Server-Sent Events (SSE) 또는 Polling
- Redis에서 최신 위치 조회

---

### Story 4.4: 승객 앱 - 내 셔틀 위치 표시
**As a** 승객/보호자
**I want to** 승객 앱에서 내가 탈 셔틀의 실시간 위치를 확인
**So that** 언제 도착하는지 예상할 수 있다

**인수 조건**:
- 홈 화면에 지도 표시
- 내 셔틀 마커 + 내 위치 마커 표시
- 직선거리 기반 간단한 ETA 표시 (예: "약 5분 후 도착")
- 3초마다 위치 자동 갱신

**기술 힌트**:
- React Native Maps
- Geolocation API로 내 위치 조회
- 거리 계산: Haversine 공식

---

### Story 4.5: 운행 종료 (Trip End)
**As a** 기사
**I want to** "운행 종료" 버튼을 누름
**So that** GPS 추적이 중단되고 운행 기록이 저장된다

**인수 조건**:
- 버튼 클릭 시 Trip 상태 → COMPLETED
- GPS 위치 수집 중단
- 총 운행 시간, 시작/종료 시각 기록
- Redis 최신 위치 삭제

---

### Story 4.6: 기본 ETA 계산
**As a** 승객/보호자
**I want to** 셔틀이 나에게 도착하는 예상 시간을 확인
**So that** 준비할 수 있다

**인수 조건**:
- 직선거리 기반 간단한 ETA 계산
- 평균 속도 30km/h 가정
- 승객 앱에 "약 X분 후 도착" 표시
- (Stage 2에서 AI 최적화 ETA로 대체 예정)

---

## 🔧 기술 고려사항

### 데이터 모델 (Prisma Schema)
```prisma
model Trip {
  id            String   @id @default(uuid())
  rosterId      String
  vehicleId     String
  driverId      String
  startedAt     DateTime
  endedAt       DateTime?
  status        TripStatus @default(IN_PROGRESS)

  roster        Roster  @relation(fields: [rosterId], references: [id])
  vehicle       Vehicle @relation(fields: [vehicleId], references: [id])
  driver        Driver  @relation(fields: [driverId], references: [id])
  locationLogs  LocationLog[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum TripStatus {
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model LocationLog {
  id        String   @id @default(uuid())
  tripId    String
  latitude  Float
  longitude Float
  timestamp DateTime @default(now())

  trip      Trip @relation(fields: [tripId], references: [id], onDelete: Cascade)

  @@index([tripId, timestamp])
}
```

### Redis 데이터 구조
```typescript
// 최신 위치 (TTL 1시간)
trip:{tripId}:location = {
  lat: 37.5665,
  lng: 126.9780,
  timestamp: "2025-11-09T10:30:00Z"
}
```

### API 엔드포인트
```typescript
// app/api/trips/[tripId]/location/route.ts
export async function POST(req: Request, { params }: { params: { tripId: string } }) {
  // GPS 위치 수신 및 Redis 저장
}

export async function GET(req: Request, { params }: { params: { tripId: string } }) {
  // Redis에서 최신 위치 조회
}

// app/api/trips/start/route.ts
export async function POST(req: Request) {
  // 운행 시작 (Trip 생성, 푸시 알림)
}

// app/api/trips/[tripId]/end/route.ts
export async function POST(req: Request, { params }: { params: { tripId: string } }) {
  // 운행 종료 (Trip 완료, GPS 중단)
}
```

### 프론트엔드 구조

**관리자 포털 (Next.js)**:
```
app/
└── (dashboard)/
    └── [institutionId]/
        └── fleet-monitoring/
            └── page.tsx  // 전체 차량 지도 (Kakao/Naver Map)
```

**기사 앱 (React Native)**:
```
app/
├── (driver)/
│   ├── trip-start.tsx    // 운행 시작 화면
│   └── trip-active.tsx   // 운행 중 화면 (종료 버튼)
└── services/
    └── location-tracker.ts  // Background GPS 수집
```

**승객 앱 (React Native)**:
```
app/
├── (passenger)/
│   └── home.tsx          // 내 셔틀 지도 화면
└── services/
    └── trip-poller.ts    // 3초마다 위치 polling
```

### 의존성
- **Redis**: 실시간 위치 캐싱 (`npm install ioredis`)
- **Expo Location**: GPS 수집 (React Native)
- **react-kakao-maps-sdk** 또는 **@react-google-maps/api**: 웹 지도
- **react-native-maps**: 모바일 지도
- **FCM (Firebase Cloud Messaging)**: 푸시 알림

---

## ✅ 완료 조건 (Definition of Done)

- [ ] 모든 사용자 스토리 개발 완료
- [ ] Prisma 마이그레이션 (Trip, LocationLog 모델)
- [ ] Redis 설정 및 연동 테스트
- [ ] 기사 앱 GPS 수집 동작 검증 (Expo Go 또는 실기기)
- [ ] 관리자 포털 지도 표시 확인 (Kakao/Naver Map)
- [ ] 승객 앱 지도 표시 확인 (React Native Maps)
- [ ] 푸시 알림 발송 성공 확인

---

## 📅 일정
- **시작일**: Month 2, Week 1
- **완료일**: Month 2, Week 2
- **예상 공수**: 1.5주 (소규모 팀 기준)

---

## 🔗 관련 문서
- `docs/epics/epic-03-roster-management.md` - 승객 명단 관리 (선행 Epic)
- `docs/api/kakao-map.md` - 카카오맵 연동 가이드 (작성 예정)
- `docs/api/fcm.md` - FCM 푸시 알림 가이드 (작성 예정)
- `CLAUDE.md` - 전체 프로젝트 개요
