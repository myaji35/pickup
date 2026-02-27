# Driver Mobile App (Phase 12.4) ✅ 완성

기사용 모바일 앱 - React Native (Expo)

## 기능

### ✅ 완료된 기능
- ✅ 로그인/로그아웃
- ✅ 오늘의 운행 목록 조회
- ✅ 진행 중인 운행 표시
- ✅ **운행 상세 화면 (TripDetailScreen)**
  - 운행 정보 표시
  - 체크인 목록 및 통계
  - Pull-to-refresh
- ✅ **운행 시작/종료**
  - GPS 위치 자동 수집
  - 실시간 상태 업데이트
- ✅ **승객 체크인/하차 화면 (CheckInScreen)**
  - 탑승/하차 선택
  - 승객 ID 입력
  - GPS 위치 자동 기록
- ✅ **GPS 위치 수집 (expo-location)**
  - 위치 권한 요청
  - 현재 위치 가져오기
- ✅ 인증 토큰 보안 저장 (expo-secure-store)
- ✅ API 클라이언트 (Axios)

### TODO (추가 개선)
- ⏸️ QR 코드 스캔 (expo-barcode-scanner)
- ⏸️ 승객 목록 API 연동
- ⏸️ 실시간 위치 추적 (Background Location)
- ⏸️ 푸시 알림 (expo-notifications)

## 기술 스택

- **React Native**: 0.81.5
- **Expo**: ~54.0
- **TypeScript**: 5.9.2
- **React Navigation**: Native Stack
- **Axios**: HTTP 클라이언트
- **expo-secure-store**: 토큰 보안 저장
- **expo-location**: GPS 위치 수집

## 프로젝트 구조

```
driver-app/
├── src/
│   ├── api/              # API 클라이언트
│   │   ├── client.ts     # Axios 인스턴스
│   │   ├── authApi.ts    # 인증 API
│   │   ├── tripApi.ts    # 운행 API
│   │   └── checkinApi.ts # 체크인 API
│   ├── contexts/         # React Context
│   │   └── AuthContext.tsx
│   ├── screens/          # 화면 컴포넌트
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── TripDetailScreen.tsx  # 운행 상세
│   │   └── CheckInScreen.tsx     # 승객 체크인
│   ├── navigation/       # React Navigation
│   │   └── AppNavigator.tsx
│   ├── utils/            # 유틸리티
│   │   └── location.ts   # GPS 위치 수집
│   └── types/            # TypeScript 타입
│       └── index.ts
├── App.tsx               # 메인 앱 컴포넌트
└── package.json
```

## 설치 및 실행

### 1. 의존성 설치

```bash
cd driver-app
npm install
```

### 2. 백엔드 서버 실행

먼저 백엔드 서버가 실행 중이어야 합니다:

```bash
cd ../backend
npm run start:dev
```

### 3. Expo 앱 실행

```bash
# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android

# Expo Go 앱으로 실행
npm start
```

## API 설정

### 개발 환경

- **로컬 테스트**: `http://localhost:3000`
- **실제 디바이스**: `http://<컴퓨터IP>:3000`

API Base URL은 `src/api/client.ts`에서 설정:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000'  // iOS 시뮬레이터 / 에뮬레이터
  : 'https://api.production.com';
```

**실제 디바이스에서 테스트할 경우:**
1. 컴퓨터와 디바이스가 같은 Wi-Fi에 연결되어 있어야 함
2. API_BASE_URL을 컴퓨터의 로컬 IP로 변경 (예: `http://192.168.0.10:3000`)

## 테스트 계정

개발 모드에서 로그인 화면에 테스트 계정 정보가 표시됩니다:

```
이메일: driver@example.com
비밀번호: password123
```

## 주요 화면

### 1. 로그인 화면 (LoginScreen)
- 이메일/비밀번호 입력
- 로그인 버튼
- 개발 모드에서 테스트 계정 안내 표시

### 2. 홈 화면 (HomeScreen)
- 사용자 이름 표시
- 진행 중인 운행 카드 (있는 경우)
- 오늘의 운행 목록
- Pull-to-refresh
- 로그아웃 버튼

### 3. 운행 상세 화면 (TripDetailScreen) ✨ NEW
- 운행 정보 (타입, 상태, 출발/도착 시간)
- 체크인 통계 (전체/탑승/하차)
- 체크인 목록 (시간순 정렬)
- **운행 시작 버튼** (SCHEDULED 상태)
- **승객 체크인 버튼** (IN_PROGRESS 상태)
- **운행 종료 버튼** (IN_PROGRESS 상태)
- Pull-to-refresh

### 4. 승객 체크인 화면 (CheckInScreen) ✨ NEW
- 체크인 유형 선택 (탑승/하차)
- 승객 ID 입력
- QR 코드 스캔 버튼 (준비됨)
- 체크인 안내 메시지
- GPS 위치 자동 기록

## 인증 관리

### AuthContext

전역 인증 상태 관리:

```typescript
const { user, loading, isAuthenticated, login, logout } = useAuth();
```

- `user`: 현재 로그인한 사용자 정보
- `loading`: 초기 로딩 상태
- `isAuthenticated`: 로그인 여부
- `login(email, password)`: 로그인 함수
- `logout()`: 로그아웃 함수

### 토큰 저장

- `expo-secure-store` 사용
- 키 이름: `auth_token`
- 자동으로 모든 API 요청에 포함 (Authorization: Bearer)

## API 클라이언트

### 인터셉터

**Request Interceptor:**
- 자동으로 인증 토큰 첨부

**Response Interceptor:**
- 401 Unauthorized 시 자동 로그아웃
- 에러 로깅

## 개발 가이드

### 새 화면 추가

1. `src/screens/NewScreen.tsx` 생성
2. `src/navigation/AppNavigator.tsx`에 스크린 등록
3. 필요한 경우 새 API 함수 추가 (`src/api/`)

### 새 API 추가

1. `src/types/index.ts`에 타입 정의
2. `src/api/` 폴더에 API 함수 추가
3. 화면 컴포넌트에서 사용

## 트러블슈팅

### 문제: "Network Error" 발생

**해결:**
- 백엔드 서버가 실행 중인지 확인
- API_BASE_URL이 올바른지 확인
- 실제 디바이스에서 테스트 시 컴퓨터 IP 사용

### 문제: "401 Unauthorized"

**해결:**
- 토큰이 만료되었을 수 있음 → 로그아웃 후 재로그인
- 백엔드 JWT 시크릿 키 확인

### 문제: Expo Go에서 실행 안됨

**해결:**
- Expo Go는 일부 네이티브 모듈 제한이 있음
- 개발 빌드 사용 권장: `npx expo run:ios` 또는 `npx expo run:android`

## 다음 단계

1. **운행 상세 화면**: 운행 정보 + 체크인 목록
2. **운행 시작/종료**: GPS 위치 수집
3. **승객 체크인**: 수동 체크인 또는 QR 스캔
4. **실시간 위치 추적**: 승객 앱과 연동
5. **푸시 알림**: 운행 시작 알림

## 관련 문서

- [Backend API 문서](../API.md)
- [Phase 12 로드맵](../PHASE_12_ROADMAP.md)
- [프로젝트 README](../README.md)
