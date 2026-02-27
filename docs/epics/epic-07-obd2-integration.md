# Epic 7: OBD-II 차량 진단 연동

**문서 버전**: 1.0
**작성일**: 2026-02-28
**상태**: 기획 검토 중

---

## 1. 개요

### 배경

현재 픽업 시스템은 스마트폰 GPS(소프트웨어 측위)로 차량 위치를 추적합니다.
OBD-II 동글을 추가하면 **차량 내부 CAN 버스 데이터**를 직접 수신하여 다음을 실현할 수 있습니다.

- **정확한 차속**: GPS 속도(지표속도)가 아닌 바퀴 회전수 기반 실속도
- **엔진 상태 모니터링**: RPM, 냉각수 온도, 연료량 등
- **운전 습관 분석**: 급가속/급제동/과속 감지 → 기사 안전 점수
- **예지정비**: 엔진 오류 코드(DTC) 조기 감지

### OBD-II란

| 항목 | 내용 |
|------|------|
| 정식명 | On-Board Diagnostics II |
| 표준화 | SAE J1979 / ISO 15031 |
| 의무화 | 미국 1996년~, 유럽 2004년~, 한국 2006년~ |
| 포트 | 운전석 하단 16핀 커넥터 (D형) |
| 통신 | OBD-II over Bluetooth 4.0 BLE 또는 Wi-Fi (ELM327 칩셋) |

---

## 2. 비즈니스 목적 및 기대 효과

### 2.1 기관(B2B 고객) 가치

| 기능 | 현재 | OBD-II 연동 후 |
|------|------|----------------|
| 속도 정보 | GPS 기반 (±5 km/h 오차) | 차속 센서 기반 (±0.5 km/h) |
| 과속 감지 | 없음 | 실시간 과속 알림 + 이력 저장 |
| 차량 상태 | 없음 | 엔진 오류 코드 자동 감지 |
| 운전 습관 | 없음 | 기사별 안전 점수 리포트 |
| 정비 알림 | 없음 | 예지정비 스케줄 자동 추천 |

### 2.2 SaaS 수익 모델 영향

```
현재 구독 플랜:
  STARTER  ₩149,000/월  → GPS 추적만
  PRO      ₩299,000/월  → 기본 분석
  ENTERPRISE ₩599,000/월 → 고급 분석

OBD-II 추가 후 (제안):
  PRO      ₩299,000/월  → OBD-II 기본 (DTC + 속도)
  ENTERPRISE ₩599,000/월 → OBD-II 풀 패키지 (안전 점수 + 예지정비)
  OBD 동글  ₩89,000/개  → 하드웨어 별도 판매 또는 렌탈 ₩5,000/월
```

### 2.3 시장 차별화

국내 학원버스/주간보호센터 셔틀 SaaS 중 OBD-II 안전 분석을 제공하는 서비스 **없음** → 선점 기회

---

## 3. 기술 스펙

### 3.1 하드웨어 선정

| 동글 | 가격 | 통신 | 장점 | 단점 |
|------|------|------|------|------|
| **Viecar 4.0 BLE** | ₩18,000 | BLE 4.0 | 저전력, iOS 지원 | ELM327 v1.5 |
| **KONNWEI KW902** | ₩22,000 | BLE 4.0 | 안정적인 ELM327 v2.1 | 약간 큰 사이즈 |
| **OBDLink MX+** | ₩85,000 | BLE 5.0 | 최고 호환성, ARF 지원 | 가격 높음 |

**추천**: KONNWEI KW902 (BLE 4.0, ELM327 v2.1, iOS/Android 모두 지원)

### 3.2 통신 프로토콜 스택

```
차량 CAN 버스
    ↓
OBD-II 포트 (16핀)
    ↓
ELM327 칩셋 (AT 명령어로 PID 조회)
    ↓
BLE 4.0 (GATT Profile)
    ↓
Expo BLE 라이브러리 (react-native-ble-plx)
    ↓
Driver App (React Native)
    ↓
Rails API POST /driver/trips/:id/update_location
    ↓
ActionCable WebSocket → 관리자 대시보드
```

### 3.3 핵심 OBD-II PID (Parameter IDs)

| PID | 데이터 | 공식 | 용도 |
|-----|--------|------|------|
| `01 0C` | 엔진 RPM | `(A×256+B)/4` | 공회전/과부하 감지 |
| `01 0D` | 차속 (km/h) | `A` | 속도 측정 (GPS 대체) |
| `01 05` | 냉각수 온도 | `A - 40 (°C)` | 오버히트 경고 |
| `01 2F` | 연료량 (%) | `A×100/255` | 주유 알림 |
| `01 5E` | 연료 소비율 | `(A×256+B)/20 (L/h)` | 연비 분석 |
| `03` | DTC 조회 | — | 엔진 오류 코드 |
| `04` | DTC 초기화 | — | 경고등 초기화 |

### 3.4 안전 점수 알고리즘

```
운전 이벤트 감지 기준:
  급가속: 속도 변화 > +10 km/h / 3초
  급제동: 속도 변화 > -15 km/h / 3초
  과속:   차속 > 제한속도 + 10 km/h (도로 등급별)
  장시간 공회전: RPM 700~900, 차속 0, 지속 > 3분

안전 점수 (100점 만점):
  기본 100점
  급가속 1회: -2점
  급제동 1회: -3점
  과속 1회:   -5점
  공회전 과다: -1점/5분

주간 리포트:
  평균 점수, 이벤트 빈도, 최다 위반 유형 → 기관 관리자 대시보드
```

---

## 4. 구현 범위 (Stories)

### Story 7.1: BLE 연결 관리 (드라이버 앱)

**Actor**: 드라이버
**목표**: OBD-II 동글과 BLE 연결 수립 및 유지

```
시나리오:
1. 드라이버가 앱 설정 화면에서 "OBD 연결" 탭 진입
2. 주변 BLE 기기 스캔 (ELM327 필터링)
3. 동글 선택 → 페어링
4. 연결 성공 시 홈 화면에 "OBD 연결됨" 배지 표시
5. 운행 시작 시 자동으로 PID 폴링 시작 (1초 간격)
6. 앱 백그라운드 전환 시 BLE 유지 (expo-background-fetch)

완료 조건:
  - BLE 연결 성공/실패 상태 UI 표시
  - 연결된 동글 정보 SecureStore에 저장 (재연결 자동화)
  - 연결 끊김 시 자동 재연결 시도 (최대 3회)
```

**신규 패키지**: `react-native-ble-plx`

### Story 7.2: 실시간 PID 데이터 수집 및 전송

**Actor**: 시스템 (자동)
**목표**: 운행 중 OBD 데이터를 5초마다 서버로 전송

```
수집 → 파싱 → 전송 흐름:
  ELM327.send("01 0D\r") → "41 0D 3C" → speed = 0x3C = 60 km/h
  ELM327.send("01 0C\r") → "41 0C 0F A0" → rpm = (0x0F*256+0xA0)/4 = 1000
  ELM327.send("01 05\r") → "41 05 5A" → coolant = 0x5A - 40 = 50°C

서버 전송 (확장된 update_location):
  POST /api/v1/driver/trips/:id/update_location
  {
    lat: 37.4979,
    lng: 127.0276,
    heading: 90.0,
    speed: 60.0,         ← OBD 차속 (GPS 속도 대체)
    rpm: 1000,           ← 신규
    coolant_temp: 50,    ← 신규
    fuel_level: 72.5,    ← 신규
    events: ["harsh_brake"]  ← 신규 (안전 이벤트)
  }
```

### Story 7.3: Rails API 확장 (OBD 데이터 저장)

**Actor**: 시스템
**목표**: trips 테이블에 OBD 컬럼 추가 + 이벤트 로그 테이블 생성

```ruby
# 마이그레이션 1: trips에 OBD 컬럼 추가
add_column :trips, :avg_speed,     :decimal, precision: 5, scale: 2
add_column :trips, :max_speed,     :decimal, precision: 5, scale: 2
add_column :trips, :avg_rpm,       :integer
add_column :trips, :fuel_consumed, :decimal, precision: 5, scale: 2

# 마이그레이션 2: driving_events 테이블
create_table :driving_events do |t|
  t.references :trip,    null: false, foreign_key: true
  t.string     :event_type   # harsh_accel, harsh_brake, speeding, idling
  t.decimal    :lat,     precision: 10, scale: 7
  t.decimal    :lng,     precision: 10, scale: 7
  t.decimal    :speed,   precision: 5, scale: 2
  t.integer    :rpm
  t.datetime   :occurred_at, null: false
  t.timestamps
end

# 마이그레이션 3: driver_safety_scores 테이블
create_table :driver_safety_scores do |t|
  t.references :user,        null: false, foreign_key: true
  t.date       :week_start
  t.integer    :score,       default: 100
  t.integer    :harsh_accel_count, default: 0
  t.integer    :harsh_brake_count, default: 0
  t.integer    :speeding_count,    default: 0
  t.integer    :idling_minutes,    default: 0
  t.timestamps
end
```

### Story 7.4: DTC 오류 코드 감지 및 알림

**Actor**: 시스템 → 기관 관리자
**목표**: 엔진 경고등 발생 시 즉시 Push 알림

```
흐름:
1. 드라이버 앱이 운행 시작 시 DTC 조회 (AT PID 03)
2. 오류 코드 감지 → 서버 POST /api/v1/driver/trips/:id/report_dtc
3. Rails: DTC 코드 디코딩 (P0xxx, B0xxx, C0xxx, U0xxx)
4. ActionCable → 기관 관리자 대시보드 실시간 경고
5. 선택: FCM/APNs Push 알림 → 관리자 모바일

DTC 코드 데이터베이스:
  P0300 → "랜덤 실화 감지"
  P0420 → "촉매 변환기 효율 저하"
  P0171 → "연료 시스템 희박 (뱅크 1)"
  ... (약 3,000개 표준 DTC)
```

### Story 7.5: 기관 관리자 안전 대시보드

**Actor**: 기관 관리자 (Admin Portal)
**목표**: 기사별/기간별 안전 점수 및 이벤트 시각화

```
화면 구성:
  1. 기사별 주간 안전 점수 랭킹
  2. 이벤트 지도: 급가속/급제동 발생 위치 히트맵
  3. 운행별 상세: 속도 프로파일 그래프 (시간 vs 속도)
  4. 월간 리포트 PDF 다운로드
  5. DTC 이력 및 정비 이력 연동

API:
  GET /api/v1/institutions/safety/scores?week=2026-02-23
  GET /api/v1/institutions/safety/events?trip_id=1
  GET /api/v1/institutions/safety/dtc_history
```

---

## 5. 데이터 모델 다이어그램

```
Trip (기존)
  ├── current_lat, current_lng      ← GPS
  ├── speed (from OBD)              ← 추가
  ├── avg_speed, max_speed          ← 추가
  └── fuel_consumed                 ← 추가

DrivingEvent (신규)
  ├── trip_id → Trip
  ├── event_type (harsh_accel / harsh_brake / speeding / idling)
  ├── lat, lng, speed, rpm
  └── occurred_at

DriverSafetyScore (신규)
  ├── user_id → User (driver)
  ├── week_start (월요일 기준)
  ├── score (0~100)
  └── 이벤트 카운터들

Vehicle (기존)
  ├── current_lat, current_lng      ← 기존
  └── dtc_codes (jsonb)             ← 추가 예정
```

---

## 6. 구현 우선순위 및 일정

| 단계 | Story | 예상 기간 | 우선순위 |
|------|-------|----------|---------|
| Phase A | 7.1 BLE 연결 관리 | 3일 | 높음 (기반) |
| Phase A | 7.2 PID 수집 + 전송 | 2일 | 높음 |
| Phase B | 7.3 Rails API 확장 | 2일 | 높음 |
| Phase B | 7.4 DTC 감지 + 알림 | 2일 | 중간 |
| Phase C | 7.5 안전 대시보드 | 5일 | 중간 |

**총 예상 개발 기간**: 2~3주 (Phase A~C 순차 진행)

---

## 7. 리스크 및 제약사항

| 리스크 | 내용 | 대응 방안 |
|--------|------|----------|
| **iOS BLE 제한** | iOS 13+에서 백그라운드 BLE 제한 | `allowDuplicatesKey: true` + 백그라운드 모드 entitlement 설정 |
| **차량 호환성** | 일부 국산 차량은 비표준 PID 사용 | 현대/기아 확장 PID 별도 지원 (HKMC OBD) |
| **동글 품질** | 저가 동글의 ELM327 클론 칩 불안정 | KONNWEI/OBDLink 공식 파트너 동글만 인증 |
| **데이터 프라이버시** | 운전 습관 데이터는 민감 개인정보 | 이용약관 동의 필수, 데이터 보존 90일 후 익명화 |
| **정비 책임** | DTC 정보 제공이 정비 책임 오해 야기 가능 | "참고용" 면책 문구 명시, 전문 정비사 확인 권고 |

---

## 8. 의존성 (기존 Epic 기준)

```
Epic 4 (실시간 추적) ──→ 필수 (update_location API 확장)
Epic 5 (드라이버 앱) ──→ 필수 (BLE 모듈 추가)
Epic 7 (OBD-II)     ──→ 본 기획
                         ↓
                    Epic 8 (예지정비) 에 데이터 제공 예정
```

---

## 9. 향후 확장 (Epic 8 예고)

OBD-II 데이터가 축적되면 AI 기반 예지정비 서비스로 확장 가능합니다.

- 주행 패턴 기반 브레이크 패드 교체 시기 예측
- 엔진 오일 교환 주기 최적화 (주행 조건 반영)
- 타이어 마모도 예측 (급제동 이벤트 빈도 연계)

---

**작성자**: Claude (Senior Fullstack Engineer, Gagahoho Inc.)
**검토 요청**: 대표님 (기획 방향 및 하드웨어 파트너십 전략 확인 필요)
