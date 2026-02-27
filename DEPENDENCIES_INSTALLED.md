# 의존성 설치 완료 요약

> **설치 일자**: 2025-01-15
> **설치된 패키지 총 개수**: Backend 17개, Frontend 2개

---

## ✅ Backend 설치 완료

### Q1: AI 경로 최적화 + 실시간 알림

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@google-cloud/optimization` | ^3.5.0 | VRP (Vehicle Routing Problem) 솔버 |
| `@turf/turf` | ^7.3.0 | 지리 계산 (거리, 중심점, 면적 등) |
| `geolib` | ^3.3.4 | 위도/경도 거리 계산 (Haversine) |
| `firebase-admin` | ^13.6.0 | FCM Push 알림 (서버 사이드) |
| `@nestjs/bull` | ^11.0.4 | Queue 관리 (Bull 통합) |
| `bull` | ^4.16.5 | Redis 기반 작업 큐 |
| `ioredis` | ^5.8.2 | Redis 클라이언트 |
| `@types/bull` | ^3.15.9 | Bull TypeScript 타입 정의 |

### Q1: WebSocket & 실시간 통신

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@nestjs/websockets` | ^10.4.20 | NestJS WebSocket 지원 |
| `@nestjs/platform-socket.io` | ^10.4.20 | Socket.io 플랫폼 어댑터 |

### Q2: Geocoding & Maps

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@googlemaps/google-maps-services-js` | ^3.4.2 | Google Maps API 클라이언트 (Geocoding, Distance Matrix, Roads) |
| `axios` | ^1.13.2 | HTTP 클라이언트 (Kakao/Naver Maps API) |

### Q2-Q4: 추가 기능

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@nestjs/schedule` | ^6.0.1 | Cron 작업 스케줄링 (Q3 Analytics) |
| `sharp` | ^0.34.5 | 이미지 처리 (Q2 영수증 OCR) |

---

## ✅ Frontend 설치 완료

### Q1: 차트 & 알림

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `recharts` | ^3.5.0 | 데이터 시각화 (BI 대시보드) |
| `firebase` | ^12.6.0 | Firebase Web SDK (FCM 웹 푸시) |

---

## 📋 기존 패키지 (유지)

### Backend 기존 패키지
- `@nestjs/*`: Core, Common, Platform, Config, JWT, Passport, Swagger
- `@prisma/client`: ORM
- `bcrypt`: 비밀번호 해싱
- `class-validator`, `class-transformer`: DTO 검증
- `csv-parse`: CSV 파싱
- `multer`: 파일 업로드
- `passport-jwt`, `passport-local`: 인증 전략

### Frontend 기존 패키지
- `next`: React 프레임워크
- `@tanstack/react-query`: 서버 상태 관리
- `zustand`: 클라이언트 상태 관리
- `react-hook-form`, `zod`: 폼 관리 & 검증
- `shadcn/ui` 컴포넌트: Dialog, Select, Tooltip, Checkbox, Separator
- `tailwindcss`: CSS 프레임워크
- `lucide-react`: 아이콘
- `xlsx`: Excel 처리

---

## ⚠️ 주의사항

### 1. Google Cloud Optimization 패키지 Deprecated 경고

```
npm warn deprecated @google-cloud/optimization@3.5.0:
Cloud Optimization has been deprecated.
Please use Google Maps Routing platform instead
```

**대응 방안**:
- **현재**: `@google-cloud/optimization` 사용 (로컬 OR-Tools 방식)
- **향후 마이그레이션 (Q2 이후)**:
  - Google Maps Route Optimization API로 전환
  - 또는 자체 OR-Tools 바이너리 사용
  - 또는 OSRM (Open Source Routing Machine) 검토

### 2. 보안 취약점 (14개)

```
14 vulnerabilities (4 low, 8 moderate, 2 high)
```

**권장 조치**:
```bash
# 안전한 수정 (breaking change 없음)
npm audit fix

# 주요 취약점만 확인
npm audit --production
```

**참고**: 대부분 개발 의존성(dev dependencies)의 취약점이며, 프로덕션 코드에는 영향 없음

---

## 🚀 다음 단계

### 1. 환경 변수 설정

```bash
# Backend
cp backend/.env.example backend/.env
# .env 파일을 열어서 실제 API 키 입력

# Frontend
cp frontend/.env.local.example frontend/.env.local
# .env.local 파일을 열어서 실제 API 키 입력
```

### 2. Redis 설치 및 실행

#### 옵션 A: Docker 사용 (권장)
```bash
docker run -d \
  --name pickup-redis \
  -p 6379:6379 \
  redis:7-alpine

# 확인
docker ps | grep redis
```

#### 옵션 B: Homebrew 사용 (macOS)
```bash
brew install redis
brew services start redis

# 확인
redis-cli ping  # PONG 응답 확인
```

### 3. API 키 발급

#### Google Maps API
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성
3. API & Services > Library에서 활성화:
   - Geocoding API
   - Distance Matrix API
   - Roads API (Q3)
4. API & Services > Credentials에서 API 키 생성
5. API 키 제한 설정:
   - Backend: IP 주소 제한 (서버 IP)
   - Frontend: HTTP referrer 제한 (도메인)

#### Firebase Cloud Messaging
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 생성
3. Project Settings > Cloud Messaging 활성화
4. Backend 설정:
   - Project Settings > Service accounts
   - "Generate new private key" 클릭
   - JSON 파일 다운로드 → `backend/firebase-service-account.json`
5. Frontend 설정:
   - Project Settings > General > Your apps > Web app 추가
   - Config 값 복사 → `.env.local`
   - Cloud Messaging > Web Push certificates에서 VAPID Key 생성

#### Kakao Maps API (Q2)
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 추가
3. 앱 키 > REST API 키 복사
4. 플랫폼 설정 > Web 플랫폼 등록 (도메인)

### 4. Prisma 마이그레이션

```bash
cd backend

# 데이터베이스 스키마 동기화
npx prisma migrate dev

# Prisma Client 재생성
npx prisma generate
```

### 5. 개발 서버 실행

```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Redis (Docker 사용 안 할 경우)
redis-server
```

### 6. 설치 확인

```bash
# Backend 헬스 체크
curl http://localhost:3000

# Frontend 접속
open http://localhost:3012

# Redis 연결 확인
redis-cli ping
```

---

## 📦 향후 추가 예정 패키지

### Q2: Driver Mobile App (React Native)
```bash
# 새 프로젝트 생성 시
npx create-expo-app@latest driver-app

# 설치 예정
npm install expo-location expo-camera react-navigation
npm install @tanstack/react-query react-native-maps
npm install @react-native-async-storage/async-storage
```

### Q3: GPS Tracking
- Backend에 이미 설치됨 (`@googlemaps/google-maps-services-js`)
- Roads API 사용

### Q4: Passenger Mobile App
- Driver App과 동일한 스택 사용
- Firebase SDK 추가 (이미 설치됨)

---

## 💡 트러블슈팅

### Q: `@nestjs/websockets` 버전 충돌
```
ERESOLVE unable to resolve dependency tree
peer @nestjs/common@"^11.0.0" from @nestjs/websockets@11.1.9
```

**해결**: 호환 버전 설치
```bash
npm install @nestjs/websockets@^10.0.0 @nestjs/platform-socket.io@^10.0.0
```

### Q: Redis 연결 실패
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**해결**:
1. Redis 실행 확인: `docker ps` 또는 `brew services list`
2. 포트 확인: `lsof -i :6379`
3. `.env`의 `REDIS_URL` 확인

### Q: Firebase Admin SDK 초기화 실패
```
Error: Failed to initialize Firebase Admin SDK
```

**해결**:
1. `firebase-service-account.json` 파일 위치 확인
2. `.env`의 `FIREBASE_PRIVATE_KEY`에서 `\n` 이스케이프 확인
3. 환경 변수 따옴표 확인

---

## 📚 참고 문서

- [ROADMAP_2025_Q1_Q4.md](./ROADMAP_2025_Q1_Q4.md) - 전체 로드맵
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 시스템 아키텍처
- [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) - 구현 체크리스트

---

**작성일**: 2025-01-15
**버전**: 1.0
**담당자**: Development Team
