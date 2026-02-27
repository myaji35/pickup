# Passenger App

승객 및 보호자를 위한 모바일 애플리케이션입니다.

## 기능

### ✅ 구현 완료
- **로그인** - 이메일/비밀번호 인증
- **스케줄 조회** - 내 운행 스케줄 확인 (오늘/이번 주)
- **차량 추적** - 실시간 차량 위치 추적 (진행 중인 운행)
- **히스토리** - 과거 운행 기록 조회 (완료/취소)
- **탭 네비게이션** - 3개 탭 (스케줄/차량추적/히스토리)

## 기술 스택

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: React Context API
- **API Client**: Axios
- **Storage**: Expo SecureStore (토큰 저장)
- **TypeScript**: 타입 안전성

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm start
```

### 3. 앱 실행
- iOS 시뮬레이터: `i` 키 입력
- Android 에뮬레이터: `a` 키 입력
- 실제 디바이스: Expo Go 앱에서 QR 코드 스캔

## 테스트 계정

```
이메일: passenger@example.com
비밀번호: password123
승객명: 갈채아
```

## 화면 구조

```
passenger-app/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx       # 로그인 화면
│   │   ├── ScheduleScreen.tsx    # 스케줄 조회 (홈)
│   │   ├── TrackingScreen.tsx    # 차량 실시간 추적
│   │   └── HistoryScreen.tsx     # 운행 히스토리
│   ├── navigation/
│   │   └── AppNavigator.tsx      # 네비게이션 설정 (탭)
│   ├── contexts/
│   │   └── AuthContext.tsx       # 인증 상태 관리
│   ├── api/
│   │   ├── client.ts             # Axios 인스턴스
│   │   ├── authApi.ts            # 로그인 API
│   │   └── tripApi.ts            # 운행 API
│   └── types/
│       └── index.ts              # TypeScript 타입 정의
```

## API 엔드포인트

### 인증
- `POST /auth/login` - 로그인

### 운행
- `GET /passenger/trips` - 내 운행 목록 조회
- `GET /passenger/trips/today` - 오늘의 운행 조회
- `GET /passenger/trips/:id` - 운행 상세 조회
- `GET /passenger/trips/in-progress/current` - 진행 중인 운행 조회

## 주요 기능 상세

### 1. 스케줄 화면 (ScheduleScreen)
- 내 운행 스케줄 목록 표시
- 운행 타입별 표시 (등원/하원/임시)
- 상태별 색상 코드 (예정/운행중/완료/취소)
- 아래로 드래그하여 새로고침
- 로그아웃 버튼

### 2. 차량 추적 화면 (TrackingScreen)
- 현재 진행 중인 운행 정보 표시
- 실시간 차량 위치 업데이트 (10초마다)
- 출발 시간, 차량 번호, 마지막 업데이트 시간
- 수동 새로고침 버튼
- 지도 기능 (추후 구현 예정)

### 3. 히스토리 화면 (HistoryScreen)
- 완료/취소된 운행 기록 조회
- 필터링 (전체/완료/취소)
- 실제 탑승/하차 시간 표시
- 아래로 드래그하여 새로고침

## 개발 노트

### API 응답 형식
Backend API는 배열을 직접 반환하므로 `response.data`로 바로 접근합니다.

```typescript
// 올바른 방식
export const getMyTrips = async (): Promise<Trip[]> => {
  const response = await apiClient.get<Trip[]>('/passenger/trips');
  return response.data; // 배열 직접 반환
};
```

### 진행 중인 운행 조회
진행 중인 운행 조회는 `{ success, data }` 래퍼를 사용합니다.

```typescript
export const getInProgressTrip = async (): Promise<Trip | null> => {
  const response = await apiClient.get<{ success: boolean; data: Trip | null }>(
    '/passenger/trips/in-progress/current'
  );
  return response.data.data;
};
```

### 인증 토큰 관리
- Expo SecureStore에 안전하게 저장
- Axios Interceptor를 통해 자동으로 헤더에 첨부
- 401 에러 시 자동 로그아웃

## 향후 개선 사항

- [ ] 실제 지도 통합 (react-native-maps)
- [ ] Push 알림 (차량 출발/도착 알림)
- [ ] 운행 상세 화면 (승객 정보, 경로 정보)
- [ ] 프로필 화면 (내 정보, 설정)
- [ ] 임시 셔틀 신청 기능
- [ ] 오프라인 모드 지원

## 문제 해결

### iOS 시뮬레이터에서 localhost 연결 안 됨
- API_BASE_URL을 컴퓨터의 실제 IP 주소로 변경
- `src/api/client.ts` 파일 수정

### Android 에뮬레이터에서 localhost 연결 안 됨
- `http://10.0.2.2:3000` 사용 (Android 에뮬레이터의 localhost)

### 토큰 만료 문제
- 로그아웃 후 다시 로그인
- Backend에서 토큰 유효 기간 확인

## 라이센스

Private Project
