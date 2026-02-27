# PickUp - API 명세서

**프로젝트**: PickUp MVP
**버전**: 1.0
**Base URL**: `https://pickup.vercel.app/api` (운영 예정)
**인증**: Clerk JWT

---

## 🔐 인증

모든 API는 **Clerk JWT 토큰**을 요구합니다 (공개 API 제외).

### Headers
```http
Authorization: Bearer <CLERK_JWT_TOKEN>
Content-Type: application/json
```

### 역할별 접근 권한

| 역할 | 접근 가능 API |
|------|---------------|
| **platform_admin** | 모든 API |
| **institution_admin** | 자기 기관 관련 API |
| **driver** | 운행 관리, 승객 체크인 API |
| **guardian** | 운행 조회, 위치 조회 API |

---

## 📋 API 엔드포인트 목록

### Institution Context

| Method | Endpoint | 설명 | 역할 |
|--------|----------|------|------|
| POST | `/api/institutions` | 기관 등록 | platform_admin |
| GET | `/api/institutions` | 기관 목록 조회 | platform_admin |
| GET | `/api/institutions/[id]` | 기관 상세 조회 | institution_admin |
| PUT | `/api/institutions/[id]` | 기관 정보 수정 | institution_admin |
| PATCH | `/api/institutions/[id]/status` | 기관 상태 변경 | platform_admin |
| POST | `/api/institutions/[id]/admins` | 관리자 초대 | institution_admin |

### Fleet Context

| Method | Endpoint | 설명 | 역할 |
|--------|----------|------|------|
| POST | `/api/vehicles` | 차량 등록 | institution_admin |
| GET | `/api/vehicles` | 차량 목록 조회 | institution_admin |
| GET | `/api/vehicles/[id]` | 차량 상세 조회 | institution_admin |
| PUT | `/api/vehicles/[id]` | 차량 정보 수정 | institution_admin |
| PUT | `/api/vehicles/[id]/assign-driver` | 기사 배정 | institution_admin |
| DELETE | `/api/vehicles/[id]/unassign-driver` | 기사 배정 해제 | institution_admin |
| POST | `/api/drivers` | 기사 등록 | institution_admin |
| GET | `/api/drivers` | 기사 목록 조회 | institution_admin |
| PUT | `/api/drivers/[id]` | 기사 정보 수정 | institution_admin |

### Roster Context

| Method | Endpoint | 설명 | 역할 |
|--------|----------|------|------|
| POST | `/api/passengers` | 승객 등록 | institution_admin |
| POST | `/api/passengers/upload` | 엑셀 업로드 | institution_admin |
| GET | `/api/passengers` | 승객 목록 조회 | institution_admin |
| PUT | `/api/passengers/[id]` | 승객 정보 수정 | institution_admin |
| POST | `/api/passengers/link` | 초대 코드로 보호자 연결 | guardian |
| POST | `/api/rosters` | 명단 생성 | institution_admin |
| GET | `/api/rosters` | 명단 목록 조회 | institution_admin |
| GET | `/api/rosters/[id]` | 명단 상세 조회 | institution_admin |
| POST | `/api/rosters/[id]/copy` | 명단 복사 | institution_admin |
| DELETE | `/api/rosters/[id]` | 명단 삭제 | institution_admin |
| POST | `/api/rosters/[id]/entries` | 명단에 승객 추가 | institution_admin |
| DELETE | `/api/roster-entries/[id]` | 명단에서 승객 제거 | institution_admin |
| POST | `/api/roster-entries/[id]/board` | 승객 탑승 체크인 | driver |
| POST | `/api/roster-entries/[id]/alight` | 승객 하차 체크인 | driver |
| POST | `/api/roster-entries/[id]/cancel` | 당일 운행 취소 | guardian |

### Route Context

| Method | Endpoint | 설명 | 역할 |
|--------|----------|------|------|
| POST | `/api/trips/start` | 운행 시작 | driver |
| POST | `/api/trips/[id]/location` | GPS 위치 업데이트 | driver |
| GET | `/api/trips/[id]/location` | 최신 위치 조회 | driver, guardian, institution_admin |
| POST | `/api/trips/[id]/end` | 운행 종료 | driver |
| GET | `/api/drivers/[id]/rosters/today` | 기사 당일 명단 조회 | driver |
| GET | `/api/passengers/[id]/schedule` | 승객 주간 일정 조회 | guardian |

### Notifications

| Method | Endpoint | 설명 | 역할 |
|--------|----------|------|------|
| POST | `/api/notifications/register-token` | FCM 토큰 등록 | driver, guardian |
| GET | `/api/notifications` | 알림 목록 조회 | driver, guardian |

---

## 📝 상세 API 명세

### 1. Institution Context

#### POST `/api/institutions`

**설명**: 새로운 기관 등록

**요청 본문**:
```json
{
  "businessRegistrationNumber": "1234567890",
  "name": "행복학원",
  "address": "서울시 강남구 테헤란로 123",
  "phone": "02-1234-5678"
}
```

**응답 (201 Created)**:
```json
{
  "id": "inst_abc123",
  "businessRegistrationNumber": "1234567890",
  "name": "행복학원",
  "address": "서울시 강남구 테헤란로 123",
  "phone": "02-1234-5678",
  "status": "ACTIVE",
  "createdAt": "2025-11-09T10:00:00Z"
}
```

**에러**:
- `400`: 사업자등록번호 중복
- `401`: 인증 실패
- `403`: 권한 없음

---

#### GET `/api/institutions`

**설명**: 기관 목록 조회 (페이지네이션)

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 개수 (기본값: 20)
- `search`: 검색어 (기관명 또는 사업자등록번호)
- `status`: 필터 (ACTIVE, INACTIVE)

**요청 예시**:
```http
GET /api/institutions?page=1&limit=20&status=ACTIVE
```

**응답 (200 OK)**:
```json
{
  "data": [
    {
      "id": "inst_abc123",
      "name": "행복학원",
      "businessRegistrationNumber": "1234567890",
      "status": "ACTIVE",
      "createdAt": "2025-11-09T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 2. Fleet Context

#### POST `/api/vehicles`

**설명**: 차량 등록

**요청 본문**:
```json
{
  "licensePlate": "12가3456",
  "vehicleType": "그랜드스타렉스",
  "capacity": 9
}
```

**응답 (201 Created)**:
```json
{
  "id": "veh_xyz789",
  "institutionId": "inst_abc123",
  "licensePlate": "12가3456",
  "licensePlateLast4": "3456",
  "vehicleType": "그랜드스타렉스",
  "capacity": 9,
  "status": "ACTIVE",
  "driverId": null,
  "createdAt": "2025-11-09T11:00:00Z"
}
```

---

#### PUT `/api/vehicles/[id]/assign-driver`

**설명**: 차량에 기사 배정

**요청 본문**:
```json
{
  "driverId": "driver_def456"
}
```

**응답 (200 OK)**:
```json
{
  "id": "veh_xyz789",
  "licensePlate": "12가3456",
  "driverId": "driver_def456",
  "updatedAt": "2025-11-09T11:30:00Z"
}
```

**에러**:
- `400`: 기사가 이미 다른 차량에 배정됨
- `404`: 차량 또는 기사를 찾을 수 없음

---

### 3. Roster Context

#### POST `/api/passengers/upload`

**설명**: 엑셀 파일로 승객 대량 등록

**요청 본문 (multipart/form-data)**:
```http
Content-Type: multipart/form-data

file: [Excel 파일]
```

**엑셀 형식 (필수 컬럼)**:
| 이름 | 연락처 | 픽업 주소 | 하차 주소 |
|------|--------|-----------|-----------|
| 김철수 | 010-1234-5678 | 서울시 강남구... | 서울시 강남구... |

**응답 (200 OK)**:
```json
{
  "success": true,
  "created": 50,
  "errors": [
    {
      "row": 5,
      "message": "연락처 형식이 올바르지 않습니다"
    }
  ]
}
```

---

#### POST `/api/rosters`

**설명**: 주간 명단 생성

**요청 본문**:
```json
{
  "vehicleId": "veh_xyz789",
  "week": "2025-W10",
  "shuttleType": "MORNING",
  "passengerIds": ["pass_001", "pass_002", "pass_003"]
}
```

**응답 (201 Created)**:
```json
{
  "id": "roster_aaa111",
  "institutionId": "inst_abc123",
  "vehicleId": "veh_xyz789",
  "week": "2025-W10",
  "shuttleType": "MORNING",
  "entriesCount": 3,
  "createdAt": "2025-11-09T12:00:00Z"
}
```

---

#### POST `/api/rosters/[id]/copy`

**설명**: 명단을 다음 주로 복사

**요청 본문**:
```json
{
  "targetWeek": "2025-W11"
}
```

**응답 (201 Created)**:
```json
{
  "id": "roster_bbb222",
  "week": "2025-W11",
  "entriesCount": 3,
  "copiedFrom": "roster_aaa111"
}
```

---

### 4. Route Context

#### POST `/api/trips/start`

**설명**: 운행 시작

**요청 본문**:
```json
{
  "rosterId": "roster_aaa111"
}
```

**응답 (201 Created)**:
```json
{
  "id": "trip_ccc333",
  "rosterId": "roster_aaa111",
  "vehicleId": "veh_xyz789",
  "driverId": "driver_def456",
  "status": "IN_PROGRESS",
  "startedAt": "2025-11-09T08:00:00Z",
  "passengers": [
    {
      "id": "pass_001",
      "name": "김철수",
      "pickupAddress": "서울시 강남구..."
    }
  ]
}
```

**부가 효과**:
- GPS 추적 시작
- 모든 승객의 보호자에게 푸시 알림 발송

---

#### POST `/api/trips/[id]/location`

**설명**: GPS 위치 업데이트 (기사 앱 → 서버)

**요청 본문**:
```json
{
  "latitude": 37.5665,
  "longitude": 126.9780,
  "timestamp": "2025-11-09T08:05:30Z"
}
```

**응답 (200 OK)**:
```json
{
  "success": true
}
```

**참고**:
- Redis에 최신 위치 저장 (TTL 1시간)
- PostgreSQL에 비동기 배치 삽입

---

#### GET `/api/trips/[id]/location`

**설명**: 최신 위치 조회 (승객 앱, 관리자 포털)

**응답 (200 OK)**:
```json
{
  "tripId": "trip_ccc333",
  "latitude": 37.5665,
  "longitude": 126.9780,
  "timestamp": "2025-11-09T08:05:30Z"
}
```

**에러**:
- `404`: 운행 중이 아니거나 위치 정보 없음

---

#### POST `/api/roster-entries/[id]/board`

**설명**: 승객 탑승 체크인

**요청 본문**: 없음

**응답 (200 OK)**:
```json
{
  "id": "entry_ddd444",
  "passengerId": "pass_001",
  "boardedAt": "2025-11-09T08:10:00Z"
}
```

**부가 효과**:
- 보호자에게 푸시 알림 발송 ("김철수 학생이 셔틀에 탑승했습니다")

---

#### GET `/api/drivers/[id]/rosters/today`

**설명**: 기사 당일 명단 조회 (기사 앱)

**응답 (200 OK)**:
```json
{
  "date": "2025-11-09",
  "rosters": [
    {
      "id": "roster_aaa111",
      "shuttleType": "MORNING",
      "vehicleId": "veh_xyz789",
      "entries": [
        {
          "id": "entry_ddd444",
          "passenger": {
            "id": "pass_001",
            "name": "김철수",
            "phone": "010-1234-5678",
            "pickupAddress": "서울시 강남구...",
            "dropoffAddress": "서울시 강남구 테헤란로 123"
          },
          "boardedAt": null,
          "alightedAt": null,
          "status": "ACTIVE"
        }
      ]
    }
  ]
}
```

---

#### GET `/api/passengers/[id]/schedule`

**설명**: 승객 주간 일정 조회 (승객 앱)

**쿼리 파라미터**:
- `week`: ISO Week (예: "2025-W10")

**요청 예시**:
```http
GET /api/passengers/pass_001/schedule?week=2025-W10
```

**응답 (200 OK)**:
```json
{
  "passengerId": "pass_001",
  "week": "2025-W10",
  "schedule": [
    {
      "date": "2025-03-03",
      "shuttles": [
        {
          "type": "MORNING",
          "vehicleId": "veh_xyz789",
          "vehicleName": "3456",
          "pickupAddress": "서울시 강남구..."
        }
      ]
    },
    {
      "date": "2025-03-04",
      "shuttles": [
        {
          "type": "MORNING",
          "vehicleId": "veh_xyz789",
          "vehicleName": "3456",
          "pickupAddress": "서울시 강남구..."
        },
        {
          "type": "EVENING",
          "vehicleId": "veh_xyz789",
          "vehicleName": "3456",
          "dropoffAddress": "서울시 강남구..."
        }
      ]
    }
  ]
}
```

---

## 🔔 푸시 알림 (FCM)

### POST `/api/notifications/register-token`

**설명**: FCM 토큰 등록 (기사/승객 앱)

**요청 본문**:
```json
{
  "token": "FCM_DEVICE_TOKEN",
  "platform": "ios" // 또는 "android"
}
```

**응답 (200 OK)**:
```json
{
  "success": true
}
```

---

### 알림 타입

| 타입 | 제목 | 내용 | 대상 |
|------|------|------|------|
| `trip_started` | 셔틀 출발 | "셔틀이 출발했습니다. 실시간 위치를 확인하세요." | 보호자 |
| `passenger_boarded` | 탑승 확인 | "{승객명} 학생이 셔틀에 탑승했습니다." | 보호자 |
| `passenger_alighted` | 하차 확인 | "{승객명} 학생이 학원에 도착했습니다." | 보호자 |
| `trip_cancelled` | 운행 취소 | "{승객명}님이 오늘 셔틀을 취소했습니다." | 기사 |

---

## ⚠️ 에러 코드

### HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (검증 실패) |
| 401 | 인증 실패 (토큰 없음/만료) |
| 403 | 권한 없음 |
| 404 | 리소스를 찾을 수 없음 |
| 409 | 충돌 (중복 데이터) |
| 500 | 서버 오류 |

### 에러 응답 형식

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "차량번호 형식이 올바르지 않습니다",
    "details": {
      "field": "licensePlate",
      "value": "invalid"
    }
  }
}
```

---

## 🧪 테스트 환경

### Base URL
- **개발**: `http://localhost:3000/api`
- **스테이징**: `https://pickup-staging.vercel.app/api`
- **운영**: `https://pickup.vercel.app/api`

### Postman Collection
- [PickUp API Postman Collection](./postman/pickup-api.json) (작성 예정)

---

**작성자**: John (Product Manager)
**최종 수정**: 2025-11-09
**문서 버전**: 1.0
