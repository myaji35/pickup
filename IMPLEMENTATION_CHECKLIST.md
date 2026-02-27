# Pickup MaaS - 구현 체크리스트 (2025 Q1-Q4)

> **사용법**: 각 작업 완료 시 `[ ]`를 `[x]`로 변경하여 진행 상황을 추적하세요.

---

## 🎯 Q1: AI 경로 최적화 + 실시간 알림 (Week 1-12)

### Week 1-2: 환경 설정 & 의존성 설치

#### Backend Setup
- [ ] Google OR-Tools 라이브러리 설치
  ```bash
  cd backend
  npm install @google-cloud/optimization
  npm install @turf/turf geolib
  ```
- [ ] Firebase Admin SDK 설치 & 설정
  ```bash
  npm install firebase-admin
  ```
- [ ] Bull Queue (Redis) 설치
  ```bash
  npm install @nestjs/bull bull ioredis
  npm install @types/bull -D
  ```
- [ ] Redis Docker 컨테이너 실행
  ```bash
  docker run -d -p 6379:6379 --name redis redis:7-alpine
  ```
- [ ] Firebase 프로젝트 생성 및 서비스 계정 키 다운로드
  - [ ] Firebase Console에서 프로젝트 생성
  - [ ] Cloud Messaging 활성화
  - [ ] 서비스 계정 키 JSON 다운로드 → `backend/firebase-service-account.json`
- [ ] 환경 변수 설정 (`.env`)
  ```env
  # Google Maps
  GOOGLE_MAPS_API_KEY=your_key

  # Firebase
  FIREBASE_PROJECT_ID=your_project
  FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

  # Redis
  REDIS_HOST=localhost
  REDIS_PORT=6379
  ```

#### Frontend Setup
- [ ] Chart.js 또는 Recharts 설치
  ```bash
  cd frontend
  npm install recharts
  ```
- [ ] Firebase SDK 설치 (웹 푸시 알림용)
  ```bash
  npm install firebase
  ```

---

### Week 3-6: 경로 최적화 엔진 구현

#### Prisma Schema 업데이트
- [ ] `backend/prisma/schema.prisma`에 Route 모델 추가
  ```prisma
  model Route {
    id                String      @id @default(uuid())
    institutionId     String
    vehicleId         String
    routeDate         DateTime
    shuttleType       ShuttleType
    optimizedSequence Json
    totalDistance     Float
    estimatedDuration Int
    status            RouteStatus @default(DRAFT)
    optimizationTime  Int?
    solverVersion     String?     @db.VarChar(20)

    institution Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)
    vehicle     Vehicle     @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
    trips       Trip[]

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([institutionId, routeDate, shuttleType])
    @@index([vehicleId, routeDate])
    @@map("routes")
  }

  enum RouteStatus {
    DRAFT
    OPTIMIZED
    IN_PROGRESS
    COMPLETED
    @@map("route_status")
  }
  ```
- [ ] Passenger 모델에 위도/경도 필드 추가
  ```prisma
  model Passenger {
    // ... existing fields
    pickupLat   Float?
    pickupLng   Float?
    dropoffLat  Float?
    dropoffLng  Float?
  }
  ```
- [ ] 마이그레이션 실행
  ```bash
  npx prisma migrate dev --name add-route-optimization
  npx prisma generate
  ```

#### Route 모듈 생성
- [ ] `backend/src/route/` 폴더 구조 생성
  ```bash
  mkdir -p src/route/{domain/{entities,value-objects,services},application/{use-cases,dto},infrastructure/{persistence,external,config},interface/controllers}
  touch src/route/route.module.ts
  ```
- [ ] `route.entity.ts` 작성
- [ ] `coordinates.vo.ts` 작성 (위도/경도 값 객체)
- [ ] `route.repository.interface.ts` 작성
- [ ] `route.repository.ts` 구현 (Prisma)

#### OR-Tools Solver 구현
- [ ] `or-tools-solver.service.ts` 작성
  - [ ] `solveVRP()` 메서드 구현
    - [ ] 거리 행렬 생성 (Haversine 또는 Google Maps Distance Matrix API)
    - [ ] OR-Tools 모델 설정 (RoutingIndexManager, RoutingModel)
    - [ ] 거리 콜백 등록
    - [ ] 차량 용량 제약 추가
    - [ ] 시간 제약 추가 (Optional)
    - [ ] 솔버 실행 (30초 타임아웃)
    - [ ] 결과 파싱
- [ ] 거리 계산 유틸리티 작성
  - [ ] Haversine 공식 구현
  - [ ] Google Maps Distance Matrix API 호출 (Fallback)

#### Use Cases 구현
- [ ] `optimize-route.use-case.ts` 작성
  - [ ] 입력: institutionId, vehicleId, routeDate, shuttleType, passengerIds
  - [ ] 1. 승객 목록 조회 (위도/경도 포함)
  - [ ] 2. 차량 정보 조회 (용량)
  - [ ] 3. 기관 위치 조회 (depot)
  - [ ] 4. OR-Tools Solver 호출
  - [ ] 5. 최적화 결과 DB 저장
  - [ ] 6. ETA 계산 (출발 시간 기준)
- [ ] `recalculate-eta.use-case.ts` 작성 (교통 상황 반영)
- [ ] `get-route-details.use-case.ts` 작성

#### Controllers
- [ ] `route.controller.ts` 작성
  - [ ] `POST /api/routes/optimize` 엔드포인트
  - [ ] `GET /api/routes/:routeId` 엔드포인트
  - [ ] `PATCH /api/routes/:routeId/recalculate` 엔드포인트
- [ ] Swagger 문서 추가 (`@ApiOperation`, `@ApiResponse`)

#### 테스트
- [ ] `route-optimizer.service.spec.ts` 작성
  - [ ] 10명 승객 최적화 (5초 이내)
  - [ ] 차량 용량 제약 검증
  - [ ] 시간 제약 검증
- [ ] `optimize-route.use-case.spec.ts` 작성
- [ ] E2E 테스트: 경로 최적화 전체 플로우

---

### Week 7-9: 알림 시스템 구현

#### Prisma Schema 업데이트
- [ ] `device_tokens` 테이블 추가
- [ ] `notifications` 테이블 추가
- [ ] 마이그레이션 실행
  ```bash
  npx prisma migrate dev --name add-notification-system
  ```

#### Notification 모듈 생성
- [ ] `backend/src/notification/` 폴더 구조 생성
- [ ] `notification.module.ts` 작성
  - [ ] BullModule 등록 (Queue)
  - [ ] FCMService 등록

#### FCM 서비스 구현
- [ ] `fcm.service.ts` 작성
  - [ ] Firebase Admin SDK 초기화
  - [ ] `sendToDevice(token, payload)` 메서드
  - [ ] `sendMulticast(tokens, payload)` 메서드
- [ ] 에러 핸들링 (만료된 토큰 처리)

#### Use Cases 구현
- [ ] `send-push-notification.use-case.ts` 작성
- [ ] `register-device-token.use-case.ts` 작성
- [ ] `get-notifications.use-case.ts` 작성
- [ ] `mark-as-read.use-case.ts` 작성

#### Bull Queue Processor 구현
- [ ] `approaching-alert.processor.ts` 작성
  - [ ] `@Process('check-eta')` 핸들러
  - [ ] 현재 경로의 다음 승객 조회
  - [ ] ETA 계산 (현재 차량 위치 기준)
  - [ ] 5분 이내 도착 시 알림 발송
- [ ] `geofence-checker.processor.ts` 작성 (Optional)
  - [ ] 차량이 승객 위치 100m 이내 진입 시 알림

#### Controllers
- [ ] `notification.controller.ts` 작성
  - [ ] `POST /api/notifications/register-token`
  - [ ] `GET /api/notifications` (내 알림 목록)
  - [ ] `PATCH /api/notifications/:id/read`

#### WebSocket Gateway (Optional - Q3에서 보강)
- [ ] `notification.gateway.ts` 작성
  - [ ] 실시간 알림 브로드캐스트

---

### Week 10-11: Frontend 통합

#### Admin Portal - 경로 최적화 UI
- [ ] `frontend/app/routes/optimize/page.tsx` 작성
  - [ ] 날짜 선택 (Calendar 컴포넌트)
  - [ ] 차량 선택 (Select)
  - [ ] 셔틀 타입 선택 (MORNING/EVENING)
  - [ ] "최적화 실행" 버튼
- [ ] 최적화 결과 표시
  - [ ] 승차 순서 목록 (순번, 승객명, 주소, ETA)
  - [ ] 총 거리, 예상 소요시간
  - [ ] 최적화 소요 시간
- [ ] 지도에 경로 시각화 (Optional - React Google Maps)

#### Frontend - 알림 설정
- [ ] Firebase 웹 SDK 설정 (`firebase-config.ts`)
- [ ] `frontend/app/notifications/page.tsx` 작성
  - [ ] 알림 목록 표시
  - [ ] 읽음/안읽음 상태
  - [ ] 클릭 시 읽음 처리
- [ ] FCM 토큰 등록 로직
  ```typescript
  useEffect(() => {
    const messaging = getMessaging();
    getToken(messaging, { vapidKey: '...' }).then(token => {
      // POST /api/notifications/register-token
    });
  }, []);
  ```
- [ ] Foreground 메시지 수신 처리
  ```typescript
  onMessage(messaging, (payload) => {
    // Toast 알림 표시
  });
  ```

---

### Week 12: 테스트 & 버그 수정

#### 통합 테스트
- [ ] E2E: 경로 최적화 → 알림 발송 전체 플로우
  - [ ] 관리자가 경로 최적화 실행
  - [ ] 최적화된 경로 저장 확인
  - [ ] 운행 시작 시 승객에게 알림 발송 확인
- [ ] 성능 테스트
  - [ ] 100명 승객 동시 최적화 (60초 이내)
  - [ ] 1,000개 알림 동시 발송 (30초 이내)

#### 버그 수정 & 리팩토링
- [ ] 코드 리뷰 및 개선
- [ ] 에러 핸들링 보강
- [ ] 로깅 추가

#### 문서 작성
- [ ] API 문서 (Swagger) 업데이트
- [ ] README 업데이트 (Q1 기능 설명)
- [ ] 배포 가이드 작성

---

## 🚗 Q2: Driver App + Excel 고도화 (Week 13-24)

### Week 13-14: React Native 프로젝트 설정

#### 프로젝트 생성
- [ ] Expo 프로젝트 초기화
  ```bash
  npx create-expo-app@latest driver-app
  cd driver-app
  ```
- [ ] 필수 의존성 설치
  ```bash
  npm install expo-location expo-camera react-navigation axios
  npm install @tanstack/react-query react-native-maps
  npm install @react-native-async-storage/async-storage
  npm install react-native-qrcode-scanner
  ```
- [ ] 폴더 구조 생성
  ```bash
  mkdir -p src/{screens,components,services,hooks,types}
  ```

#### 개발 환경 설정
- [ ] TypeScript 설정
- [ ] ESLint + Prettier 설정
- [ ] `.env` 파일 설정
  ```env
  API_URL=http://localhost:3000/api
  ```

---

### Week 15-17: Driver App 핵심 기능 구현

#### 인증
- [ ] `LoginScreen.tsx` 작성
  - [ ] 이메일/비밀번호 입력
  - [ ] JWT 토큰 저장 (AsyncStorage)
- [ ] `auth.service.ts` 작성
  - [ ] `login()`, `logout()`, `getToken()`

#### 운행 목록
- [ ] `TodayTripsScreen.tsx` 작성
  - [ ] `GET /api/driver/trips/today` 호출
  - [ ] 운행 목록 표시 (FlatList)
  - [ ] 운행 카드: 시간, 셔틀 타입, 승객 수, 상태
- [ ] 운행 상세로 이동 (onPress)

#### 운행 상세 & 승객 체크인
- [ ] `TripDetailsScreen.tsx` 작성
  - [ ] `GET /api/driver/trips/:tripId/passengers` 호출
  - [ ] 승객 목록 표시 (승차 순서대로)
  - [ ] 각 승객: 이름, 주소, ETA, 체크인 상태
- [ ] `PassengerCheckScreen.tsx` 작성
  - [ ] QR 코드 스캐너 (BarCodeScanner)
  - [ ] QR 스캔 성공 → `POST /api/driver/passengers/:id/check-in`
  - [ ] 수동 체크인 버튼
- [ ] 체크인 상태 실시간 업데이트

#### 내비게이션 연동
- [ ] `NavigationScreen.tsx` 작성
  - [ ] 최적화된 경로 정보 표시 (지도)
  - [ ] 각 정류장 마커 표시
  - [ ] "Tmap으로 시작" 버튼
    - [ ] Tmap Deep Link: `tmap://route?goalx=...&goaly=...`
    - [ ] Fallback: Kakao Navi
- [ ] Linking API 사용

#### 운행 시작/종료
- [ ] "운행 시작" 버튼
  - [ ] `POST /api/driver/trips/:tripId/start`
  - [ ] GPS 추적 시작
- [ ] "운행 종료" 버튼
  - [ ] `POST /api/driver/trips/:tripId/complete`
  - [ ] GPS 추적 중단

---

### Week 18-19: Backend - Driver API 구현

#### Driver 모듈 생성
- [ ] `backend/src/driver/` 폴더 구조 생성
- [ ] `driver.module.ts` 작성

#### Controllers
- [ ] `driver.controller.ts` 작성
  - [ ] `GET /api/driver/trips/today`
    - [ ] 현재 로그인한 드라이버의 오늘 운행 목록
  - [ ] `GET /api/driver/trips/:tripId/passengers`
    - [ ] 운행의 승객 목록 (승차 순서 포함)
  - [ ] `POST /api/driver/passengers/:passengerId/check-in`
    - [ ] 승객 체크인 기록 저장
    - [ ] 보호자에게 승차 알림 발송
  - [ ] `POST /api/driver/trips/:tripId/start`
    - [ ] Trip 상태 → IN_PROGRESS
    - [ ] 모든 승객에게 "차량 출발" 알림 발송
  - [ ] `POST /api/driver/trips/:tripId/complete`
    - [ ] Trip 상태 → COMPLETED
    - [ ] GPS 로그 기반 실제 주행 거리 계산

#### Use Cases
- [ ] `get-today-trips.use-case.ts` 작성
- [ ] `check-in-passenger.use-case.ts` 작성
- [ ] `start-trip.use-case.ts` 작성
- [ ] `complete-trip.use-case.ts` 작성

---

### Week 20-22: Excel 업로드 고도화

#### Geocoding 서비스 구현
- [ ] `common/geocoding/geocoding.service.ts` 작성
  - [ ] Kakao Maps API 연동
    - [ ] API 키 발급 (https://developers.kakao.com/)
    - [ ] `geocode(address)` 메서드: 주소 → 위도/경도
    - [ ] `reverseGeocode(lat, lng)` 메서드: 위도/경도 → 주소
  - [ ] 에러 핸들링 (잘못된 주소, API 한도 초과)

#### Excel 업로드 Use Case 개선
- [ ] `upload-passengers-excel.use-case.ts` 수정
  - [ ] Excel 파싱 (XLSX 라이브러리)
  - [ ] 각 행 검증
    - [ ] 필수 필드 체크 (이름, 전화번호, 주소)
    - [ ] 전화번호 중복 체크 (기관 내)
    - [ ] 주소 유효성 검증 (Geocoding API 호출)
  - [ ] 주소 → 위도/경도 자동 변환
  - [ ] 유효한 행만 일괄 저장
  - [ ] 에러 행 목록 반환 (행 번호 + 에러 메시지)

#### Excel 템플릿 다운로드
- [ ] `passenger.controller.ts`에 엔드포인트 추가
  - [ ] `GET /api/passengers/template`
  - [ ] XLSX 라이브러리로 샘플 Excel 생성
  - [ ] 헤더: 이름, 전화번호, 탑승지 주소, 하차지 주소, 셔틀 타입
  - [ ] 샘플 행 1-2개 포함

#### Frontend - Excel 업로드 UI 개선
- [ ] `frontend/app/passengers/upload/page.tsx` 수정
  - [ ] "템플릿 다운로드" 버튼 추가
  - [ ] 파일 선택 (input type="file")
  - [ ] 업로드 진행 상태 표시
  - [ ] 결과 표시
    - [ ] 성공: N명
    - [ ] 실패: M명
    - [ ] 에러 목록 테이블 (행 번호, 에러 메시지)

---

### Week 23-24: 테스트 & QA

#### Driver App 테스트
- [ ] iOS 시뮬레이터 테스트
- [ ] Android 에뮬레이터 테스트
- [ ] 실제 기기 테스트 (Expo Go 또는 Development Build)

#### E2E 테스트
- [ ] 경로 최적화 → Driver App에서 확인 → 운행 시작 → 체크인 → 운행 종료

#### 성능 테스트
- [ ] 100명 승객 Excel 업로드 (30초 이내)
- [ ] Geocoding API 호출 속도 (초당 10건 제한 확인)

#### App Store / Play Store 준비
- [ ] 앱 아이콘 & 스플래시 화면 디자인
- [ ] 앱 설명 작성
- [ ] 스크린샷 준비
- [ ] TestFlight 배포 (iOS)
- [ ] Google Play Console 설정 (Android)

---

## 📍 Q3: GPS 트래킹 + Basic BI (Week 25-36)

### Week 25-26: GPS 트래킹 데이터 모델

#### Prisma Schema 업데이트
- [ ] `trips` 테이블 추가
- [ ] `gps_logs` 테이블 추가
- [ ] `passenger_check_ins` 테이블 추가
- [ ] 마이그레이션 실행
  ```bash
  npx prisma migrate dev --name add-gps-tracking
  ```

#### Trip 모듈 생성
- [ ] `backend/src/trip/` 폴더 구조 생성
- [ ] `trip.module.ts` 작성

---

### Week 27-29: GPS 트래킹 구현

#### Backend - GPS Logging
- [ ] `trip.controller.ts` 작성
  - [ ] `POST /api/trips/:tripId/gps`
    - [ ] GPS 좌표 저장 (latitude, longitude, accuracy, speed, heading)
    - [ ] WebSocket으로 실시간 위치 브로드캐스트
  - [ ] `GET /api/trips/:tripId/location`
    - [ ] 최신 GPS 좌표 조회

#### WebSocket Gateway
- [ ] `trip-tracking.gateway.ts` 작성
  - [ ] `@WebSocketGateway()` 데코레이터
  - [ ] 클라이언트 연결 관리
  - [ ] 특정 Trip 구독 (`subscribe:trip:${tripId}`)
  - [ ] GPS 업데이트 브로드캐스트 (`trip:${tripId}:location`)

#### Driver App - GPS 추적
- [ ] `location.service.ts` 작성
  - [ ] `startGPSTracking(tripId)`
    - [ ] `expo-location`으로 5초마다 GPS 좌표 수집
    - [ ] `POST /api/trips/:tripId/gps`로 전송
  - [ ] `stopGPSTracking()`
    - [ ] 위치 구독 해제

#### 주행 거리 계산
- [ ] Google Maps Roads API 연동
  - [ ] `roads-api.service.ts` 작성
  - [ ] `snapToRoads(coordinates)` 메서드
  - [ ] GPS 좌표를 도로에 스냅
- [ ] `distance-calculator.service.ts` 작성
  - [ ] GPS 로그 → Roads API → 거리 합산
  - [ ] Haversine 거리 계산 (Fallback)
- [ ] `calculate-distance.use-case.ts` 작성
  - [ ] Trip 완료 시 자동 호출
  - [ ] 계산된 거리를 Trip에 저장

---

### Week 30-32: BI 대시보드 - 데이터 모델

#### Materialized View 생성
- [ ] PostgreSQL Materialized View SQL 작성
  ```sql
  CREATE MATERIALIZED VIEW analytics_daily_summary AS
  SELECT
    institution_id,
    DATE(start_time) AS date,
    COUNT(*) AS total_trips,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_trips,
    -- ... (기타 집계 필드)
  FROM trips
  GROUP BY institution_id, DATE(start_time);
  ```
- [ ] Index 추가
  ```sql
  CREATE INDEX ON analytics_daily_summary (institution_id, date);
  ```

#### Cron Job 설정
- [ ] Bull Queue Processor 작성
  - [ ] `daily-aggregation.processor.ts`
  - [ ] 매일 새벽 1시 실행 (`@Cron('0 1 * * *')`)
  - [ ] `REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_summary;`

#### Prisma Schema 업데이트
- [ ] `AnalyticsDailySummary` 모델 추가 (View 매핑)
- [ ] Prisma 재생성
  ```bash
  npx prisma generate
  ```

---

### Week 33-35: BI 대시보드 - Backend & Frontend

#### Analytics 모듈 생성
- [ ] `backend/src/analytics/` 폴더 구조 생성
- [ ] `analytics.module.ts` 작성

#### Controllers
- [ ] `analytics.controller.ts` 작성
  - [ ] `GET /api/analytics/dashboard`
    - [ ] 요약 데이터 (총 운행, 정시 도착률, 평균 탑승률, 총 거리)
    - [ ] 트렌드 데이터 (최근 30일 일별 데이터)
  - [ ] `GET /api/analytics/vehicle-occupancy`
    - [ ] 차량별 평균 탑승률
  - [ ] `GET /api/analytics/on-time-performance`
    - [ ] 정시 도착률 (월별)

#### Frontend - BI 대시보드 페이지
- [ ] `frontend/app/analytics/page.tsx` 작성
  - [ ] KPI 카드 (4개)
    - [ ] 총 운행 횟수
    - [ ] 정시 도착률 (%)
    - [ ] 평균 탑승률 (%)
    - [ ] 총 주행 거리 (km)
  - [ ] 트렌드 차트 (Line Chart)
    - [ ] X축: 날짜
    - [ ] Y축: 운행 횟수, 주행 거리
  - [ ] 차량별 탑승률 차트 (Bar Chart)
  - [ ] 날짜 필터 (지난 7일, 30일, 3개월)

#### Chart.js / Recharts 통합
- [ ] Line Chart 컴포넌트 작성
- [ ] Bar Chart 컴포넌트 작성
- [ ] 반응형 디자인 적용

---

### Week 36: 테스트 & 최적화

#### 성능 테스트
- [ ] GPS 로그 100만 건 삽입 테스트
- [ ] Materialized View 갱신 시간 측정 (5분 이내)
- [ ] 대시보드 로딩 시간 측정 (2초 이내)

#### Admin Portal - 실시간 차량 추적 지도
- [ ] `frontend/app/tracking/page.tsx` 작성
  - [ ] 지도 표시 (Google Maps 또는 Kakao Maps)
  - [ ] 모든 운행 중 차량 마커 표시
  - [ ] WebSocket 연결 → 실시간 위치 업데이트
  - [ ] 차량 클릭 → 상세 정보 (차량 번호, 승객 수, ETA)

---

## 📱 Q4: Passenger App + 임시 셔틀 (Week 37-48)

### Week 37-38: Passenger App 프로젝트 설정

#### 프로젝트 생성
- [ ] Expo 프로젝트 초기화
  ```bash
  npx create-expo-app@latest passenger-app
  cd passenger-app
  ```
- [ ] 의존성 설치 (Driver App과 유사)
  ```bash
  npm install expo-location react-navigation axios
  npm install @tanstack/react-query react-native-maps
  npm install @react-native-async-storage/async-storage
  npm install firebase
  ```
- [ ] 폴더 구조 생성

---

### Week 39-41: Passenger App 핵심 기능 구현

#### 인증
- [ ] `LoginScreen.tsx` 작성 (전화번호 인증)
  - [ ] 전화번호 입력 → SMS 인증 코드 전송
  - [ ] 인증 코드 확인 → JWT 토큰 발급

#### 홈 화면
- [ ] `HomeScreen.tsx` 작성
  - [ ] 다음 스케줄 표시 (오늘/내일)
  - [ ] "차량 위치 보기" 버튼 (운행 중일 때)
  - [ ] "임시 셔틀 신청" 버튼

#### 스케줄 조회
- [ ] `ScheduleScreen.tsx` 작성
  - [ ] `GET /api/passengers/me/schedules` 호출
  - [ ] 주간 스케줄 목록 (FlatList)
  - [ ] 각 스케줄: 날짜, 셔틀 타입, 시간

#### 실시간 차량 추적
- [ ] `TrackingScreen.tsx` 작성
  - [ ] React Native Maps 사용
  - [ ] WebSocket 연결 → 차량 위치 실시간 업데이트
  - [ ] 차량 마커 표시 (아이콘)
  - [ ] 내 탑승지 마커 표시 (파란색 핀)
  - [ ] ETA 표시

#### Push 알림 수신
- [ ] FCM 토큰 등록
- [ ] Background 알림 처리
- [ ] Foreground 알림 표시 (Toast)

---

### Week 42-44: 임시 셔틀 신청 시스템

#### Prisma Schema 업데이트
- [ ] `shuttle_requests` 테이블 추가
- [ ] 마이그레이션 실행
  ```bash
  npx prisma migrate dev --name add-shuttle-requests
  ```

#### Backend - Shuttle Request 모듈
- [ ] `backend/src/shuttle-request/` 폴더 구조 생성
- [ ] `shuttle-request.module.ts` 작성

#### Controllers
- [ ] `shuttle-request.controller.ts` 작성
  - [ ] `POST /api/shuttle-requests`
    - [ ] 임시 셔틀 요청 생성
    - [ ] 주소 → 위도/경도 변환 (Geocoding)
    - [ ] 관리자에게 알림 발송
  - [ ] `GET /api/shuttle-requests` (관리자용)
    - [ ] 모든 요청 목록 조회 (상태별 필터)
  - [ ] `PATCH /api/shuttle-requests/:id/approve` (관리자용)
    - [ ] 요청 승인 + 차량 배정
  - [ ] `PATCH /api/shuttle-requests/:id/reject` (관리자용)
    - [ ] 요청 거절 + 사유 입력
  - [ ] `DELETE /api/shuttle-requests/:id` (승객용)
    - [ ] 요청 취소

#### Use Cases
- [ ] `create-shuttle-request.use-case.ts` 작성
- [ ] `approve-request.use-case.ts` 작성
- [ ] `assign-vehicle.use-case.ts` 작성

---

### Week 45-46: Frontend 통합

#### Passenger App - 임시 셔틀 신청
- [ ] `RequestShuttleScreen.tsx` 작성
  - [ ] 요청 날짜 선택 (DatePicker)
  - [ ] 탑승지 입력 (TextInput 또는 지도 선택)
  - [ ] 하차지 입력
  - [ ] 희망 시간 선택 (TimePicker)
  - [ ] "신청하기" 버튼
- [ ] 신청 완료 → 알림 표시

#### Admin Portal - 임시 셔틀 관리
- [ ] `frontend/app/shuttle-requests/page.tsx` 작성
  - [ ] 요청 목록 표시 (Card)
  - [ ] 각 요청: 승객명, 날짜, 탑승지, 하차지, 희망 시간, 상태
  - [ ] "승인" 버튼 → 차량 선택 (Select) → 확인
  - [ ] "거절" 버튼 → 사유 입력 (TextArea) → 확인
  - [ ] 상태별 필터 (PENDING, APPROVED, REJECTED)

#### Driver App - 임시 셔틀 표시
- [ ] 일일 운행 목록에 임시 셔틀 포함
- [ ] 임시 셔틀 배지 표시 ("임시")

---

### Week 47-48: 최종 테스트 & 출시 준비

#### E2E 테스트
- [ ] 승객 → 임시 셔틀 신청 → 관리자 승인 → 기사 확인 → 운행 완료

#### 성능 테스트
- [ ] 동시 접속 1,000명 (Passenger App)
- [ ] 실시간 위치 업데이트 지연 시간 (1초 이내)

#### App Store / Play Store 출시
- [ ] Passenger App 배포
  - [ ] iOS: TestFlight → App Store 제출
  - [ ] Android: Internal Testing → Production
- [ ] Driver App 업데이트 배포
  - [ ] 임시 셔틀 기능 포함

#### 사용자 가이드 작성
- [ ] Driver App 사용 가이드 (PDF/동영상)
- [ ] Passenger App 사용 가이드
- [ ] Admin Portal 매뉴얼

---

## 📋 전체 완료 기준 (Definition of Done)

### Q1
- [x] Google OR-Tools VRP 알고리즘 통합 완료
- [ ] 10명 승객 기준 5초 이내 최적화 완료
- [ ] 최적화된 경로 Admin Portal에서 시각화
- [ ] FCM Push 알림 iOS/Android/Web 모두 작동
- [ ] 차량 출발, 도착 예정(5분 전), 승하차 확인 알림 자동 발송
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] E2E 테스트 통과
- [ ] 성능 테스트: 100명 승객 동시 최적화 가능

### Q2
- [ ] Driver App iOS/Android 출시 (App Store, Play Store)
- [ ] 운행 시작/종료, 승객 체크인 기능 작동
- [ ] QR 코드 스캔 기능 작동
- [ ] Tmap/Kakao Navi 연동 작동
- [ ] Excel 업로드 시 주소 → 위도/경도 자동 변환
- [ ] 중복 승객 자동 감지
- [ ] 템플릿 다운로드 기능
- [ ] 100명 승객 일괄 업로드 30초 이내 완료

### Q3
- [ ] Driver App에서 GPS 위치 5초마다 전송
- [ ] Admin Portal에서 실시간 차량 위치 지도 표시
- [ ] Snap-to-Roads API로 실제 주행 거리 계산
- [ ] BI 대시보드: 정시 도착률, 탑승률, 트렌드 차트 표시
- [ ] Materialized View 매일 자동 갱신
- [ ] 대시보드 로딩 시간 2초 이내

### Q4
- [ ] Passenger App iOS/Android 출시
- [ ] 실시간 차량 위치 추적 기능 작동
- [ ] 스케줄 조회 및 Push 알림 수신
- [ ] 임시 셔틀 신청/취소 기능 작동
- [ ] Admin Portal에서 임시 셔틀 승인/거절 가능
- [ ] 승인된 임시 셔틀 자동으로 Driver App에 표시
- [ ] 운행 히스토리 조회 가능

---

## 🚀 다음 단계

1. **팀 회의**: 로드맵 검토 및 우선순위 재조정
2. **리소스 할당**: 각 분기별 담당자 배정
3. **Sprint 시작**: Q1 Week 1-2부터 시작
4. **주간 체크인**: 매주 월요일 진행 상황 점검

---

**작성일**: 2025-01-15
**버전**: 1.0
**담당자**: Development Team
