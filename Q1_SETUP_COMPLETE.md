# Q1 초기 설정 완료

> **완료 일시**: 2025-01-15
> **다음 단계**: 카카오맵 API 키 발급 + PostgreSQL 실행 + 마이그레이션

---

## ✅ 완료된 작업

### 1. 의존성 설치 완료

#### Backend (17개 패키지)
```bash
✅ @google-cloud/optimization  # VRP 솔버
✅ @turf/turf, geolib          # 지리 계산
✅ firebase-admin              # FCM Push 알림
✅ @nestjs/bull, bull, ioredis # Queue & Redis
✅ @nestjs/websockets          # WebSocket
✅ @googlemaps/google-maps-services-js # Maps API
✅ @nestjs/schedule            # Cron 작업
✅ sharp                        # 이미지 처리
```

#### Frontend (2개 패키지)
```bash
✅ recharts   # BI 차트
✅ firebase   # 웹 푸시 알림
```

### 2. Prisma Schema 업데이트 완료

#### 추가된 모델 (Q1: Route Optimization + Notifications)

**Passenger 모델 확장**:
```prisma
model Passenger {
  // ... existing fields

  // ✅ NEW: 경로 최적화용 위도/경도
  pickupLat  Float?
  pickupLng  Float?
  dropoffLat Float?
  dropoffLng Float?
}
```

**Route 모델** (경로 최적화):
```prisma
model Route {
  id                String      @id @default(uuid())
  institutionId     String
  vehicleId         String
  routeDate         DateTime    @db.Date
  shuttleType       ShuttleType
  optimizedSequence Json        // OR-Tools 결과
  totalDistance     Float       // km
  estimatedDuration Int         // minutes
  status            RouteStatus @default(DRAFT)
  optimizationTime  Int?
  solverVersion     String?
}

enum RouteStatus {
  DRAFT
  OPTIMIZED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

**Notification 모델** (알림 시스템):
```prisma
model DeviceToken {
  id       String   @id @default(uuid())
  userId   String?
  token    String   @unique
  platform Platform
  isActive Boolean  @default(true)
}

model Notification {
  id          String             @id @default(uuid())
  recipientId String
  title       String
  body        String
  type        NotificationType
  data        Json?
  status      NotificationStatus @default(PENDING)
  sentAt      DateTime?
  readAt      DateTime?
}

enum NotificationType {
  TRIP_STARTED
  APPROACHING
  ARRIVED
  BOARDING_CONFIRMED
  ALIGHTING_CONFIRMED
  SCHEDULE_CHANGED
  ROUTE_OPTIMIZED
  TRIP_CANCELLED
}
```

### 3. 모듈 폴더 구조 생성 완료

```
backend/src/
├── route/                        ✅ 생성 완료
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   └── services/
│   ├── application/
│   │   ├── use-cases/
│   │   └── dto/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   ├── external/
│   │   └── config/
│   ├── interface/
│   │   └── controllers/
│   └── route.module.ts           ✅ 생성 완료
│
├── notification/                 ✅ 생성 완료
│   ├── domain/
│   │   ├── entities/
│   │   └── services/
│   ├── application/
│   │   ├── use-cases/
│   │   └── dto/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   ├── external/
│   │   └── jobs/
│   ├── interface/
│   │   ├── controllers/
│   │   └── gateways/
│   └── notification.module.ts    ✅ 생성 완료
│
└── common/
    └── geocoding/                ✅ 생성 완료
        └── geocoding.module.ts   ✅ 생성 완료
```

### 4. 환경 변수 템플릿 업데이트 완료

**Backend** (`.env.example`):
```bash
# ✅ 카카오맵 (메인)
KAKAO_REST_API_KEY="your-key"

# ✅ Firebase (알림)
FIREBASE_PROJECT_ID="your-project"
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="..."

# ✅ Redis (Queue)
REDIS_URL="redis://localhost:6379"

# Optional: Google Maps (더 정확한 거리 계산)
GOOGLE_MAPS_API_KEY=""
```

**Frontend** (`.env.local.example`):
```bash
# ✅ 카카오맵 (지도 UI)
NEXT_PUBLIC_KAKAO_MAP_API_KEY="your-key"

# ✅ Firebase (웹 푸시)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
```

---

## 🚧 다음 단계 (내일)

### 1. 카카오 개발자 등록 (5분)

```bash
1. https://developers.kakao.com/ 접속
2. 애플리케이션 추가: "Pickup MaaS"
3. 앱 키 복사:
   - REST API 키 → backend/.env
   - JavaScript 키 → frontend/.env.local
4. 플랫폼 설정:
   - Web 도메인: http://localhost:3012
```

### 2. Firebase 프로젝트 생성 (10분)

```bash
1. https://console.firebase.google.com/ 접속
2. 프로젝트 생성: "Pickup MaaS"
3. Cloud Messaging 활성화
4. 서비스 계정:
   - Settings > Service accounts > Generate new private key
   - JSON 다운로드 → backend/firebase-service-account.json
5. Web 앱:
   - Settings > General > Add app > Web
   - Config 복사 → frontend/.env.local
6. VAPID Key:
   - Cloud Messaging > Web Push certificates > Generate
   - Key 복사 → frontend/.env.local
```

### 3. Redis 실행 (1분)

#### Docker 사용 (권장):
```bash
docker run -d \
  --name pickup-redis \
  -p 6379:6379 \
  redis:7-alpine

# 확인
docker ps | grep redis
```

#### Homebrew 사용 (macOS):
```bash
brew install redis
brew services start redis
redis-cli ping  # PONG 응답 확인
```

### 4. PostgreSQL 실행 + 마이그레이션 (2분)

#### PostgreSQL 시작:
```bash
# Docker
docker run -d \
  --name pickup-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pickup_dev \
  -p 5432:5432 \
  postgres:15-alpine

# 또는 Homebrew
brew services start postgresql@15
```

#### 마이그레이션 실행:
```bash
cd backend

# ✅ Q1 모델 적용
npx prisma migrate dev --name add-q1-route-notification

# Prisma Client 재생성
npx prisma generate

# 확인
npx prisma studio  # http://localhost:5555 에서 확인
```

### 5. 개발 서버 실행 (1분)

```bash
# Terminal 1: Backend
cd backend
npm run start:dev
# → http://localhost:3000

# Terminal 2: Frontend
cd frontend
npm run dev
# → http://localhost:3012

# Terminal 3: Redis (Docker 미사용 시)
redis-server
```

---

## 📋 구현 체크리스트 (Q1)

### Week 1-2: 환경 설정 ✅ 완료
- [x] 의존성 설치 (Backend 17개, Frontend 2개)
- [x] Prisma Schema 업데이트 (Route, Notification)
- [x] 모듈 폴더 구조 생성
- [x] 환경 변수 템플릿 작성
- [ ] **API 키 발급 (내일)**
- [ ] **Redis 실행 (내일)**
- [ ] **PostgreSQL + 마이그레이션 (내일)**

### Week 3-6: 경로 최적화 엔진 (다음 단계)
- [ ] 카카오맵 Geocoding Service 구현
- [ ] 카카오 Mobility API (거리 계산) 구현
- [ ] OR-Tools VRP Solver Service 구현
- [ ] Route Repository 구현
- [ ] Optimize Route Use Case 구현
- [ ] Route Controller 구현
- [ ] 단위 테스트 작성

### Week 7-9: 알림 시스템 (다음 단계)
- [ ] FCM Service 구현
- [ ] Notification Repository 구현
- [ ] Bull Queue Processor 구현
- [ ] Send Push Notification Use Case 구현
- [ ] Notification Controller 구현
- [ ] WebSocket Gateway 구현

### Week 10-11: Frontend 통합
- [ ] 경로 최적화 UI 구현
- [ ] 카카오맵 컴포넌트 구현
- [ ] Firebase 웹 SDK 설정
- [ ] 알림 UI 구현

### Week 12: 테스트 & 버그 수정
- [ ] E2E 테스트
- [ ] 성능 테스트
- [ ] 문서 업데이트

---

## 📚 참고 문서

- **ROADMAP_2025_Q1_Q4.md**: 전체 로드맵
- **ARCHITECTURE.md**: 시스템 아키텍처
- **IMPLEMENTATION_CHECKLIST.md**: 상세 체크리스트
- **DEPENDENCIES_INSTALLED.md**: 설치된 패키지 목록
- **KAKAO_MAPS_GUIDE.md**: 카카오맵 통합 가이드

---

## 💡 핵심 포인트

1. **카카오맵 메인 사용** → 비용 $450/월 절감
2. **모든 의존성 설치 완료** → 추가 설치 불필요
3. **Prisma Schema 준비 완료** → 마이그레이션만 실행하면 됨
4. **모듈 구조 생성 완료** → 바로 코드 작성 가능

## ⚠️ 중요 알림

**PostgreSQL이 실행되지 않아 마이그레이션은 보류**:
```bash
Error: Can't reach database server at `localhost:5432`
```

**해결 방법**:
1. PostgreSQL Docker 실행 (위 "다음 단계 4" 참조)
2. 마이그레이션 실행
3. 개발 시작

---

**작성일**: 2025-01-15
**작성자**: Development Team
**상태**: ✅ 초기 설정 완료, 🚧 API 키 발급 대기
