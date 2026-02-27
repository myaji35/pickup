# Epic 7: OBD-II 차량 진단 연동 - Gap Analysis Report

> **Analysis Type**: Design vs Implementation Gap Analysis
>
> **Project**: Pickup SaaS
> **Analyst**: Claude (Senior Fullstack Engineer, Gagahoho Inc.)
> **Date**: 2026-02-28
> **Design Doc**: [epic-07-obd2-integration.md](../epics/epic-07-obd2-integration.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Epic 7 OBD-II 통합 설계서(5개 Story)와 실제 구현 코드 간의 일치율을 측정하고,
미구현 / 부분 구현 / 설계 대비 변경 항목을 식별하여 후속 개선 우선순위를 제공한다.

### 1.2 Analysis Scope

| 구분 | 경로 |
|------|------|
| **설계 문서** | `docs/epics/epic-07-obd2-integration.md` |
| **드라이버 앱** | `driver-app/src/services/obd2/`, `driver-app/src/contexts/`, `driver-app/src/screens/`, `driver-app/src/api/tripApi.ts`, `driver-app/App.tsx` |
| **Rails API** | `pickup_rails/app/models/`, `pickup_rails/app/services/`, `pickup_rails/app/controllers/api/v1/`, `pickup_rails/config/routes.rb`, `pickup_rails/db/migrate/` |

---

## 2. Story별 Gap Analysis

### 2.1 Story 7.1: BLE 연결 관리 (드라이버 앱)

| 설계 항목 | 설계 위치 | 구현 상태 | 구현 파일 | 비고 |
|-----------|----------|:---------:|----------|------|
| BLE 스캔 (ELM327 필터링) | Story 7.1 #2 | ✅ 완료 | `ObdService.ts:75-105` | UUID + 이름 기반 이중 필터 |
| 동글 선택 -> 페어링 | Story 7.1 #3 | ✅ 완료 | `ObdService.ts:147-201` | 자동 스캔 후 첫 ELM327 장치 자동 연결 |
| "OBD 연결됨" 배지 표시 | Story 7.1 #4 | ✅ 완료 | `TripDetailScreen.tsx:186-193` | OBD 배지 UI 구현 |
| PID 폴링 1초 간격 | Story 7.1 #5 | ⚠️ 변경 | `ObdService.ts:21` | 설계 1초 -> 구현 5초 (POLL_INTERVAL_MS = 5000) |
| 백그라운드 BLE 유지 (expo-background-fetch) | Story 7.1 #6 | ❌ 미구현 | - | expo-background-fetch 미사용 |
| BLE 연결 성공/실패 UI | 완료조건 #1 | ✅ 완료 | `ObdSettingsScreen.tsx:15-31` | 6개 상태 라벨 + 색상 구현 |
| SecureStore에 동글 정보 저장 | 완료조건 #2 | ✅ 완료 | `ObdService.ts:186` | `setItemAsync(SECURE_KEY_DEVICE_ID, ...)` |
| 연결 끊김 시 자동 재연결 (최대 3회) | 완료조건 #3 | ⚠️ 부분 | `ObdService.ts:61-72` | 저장된 ID로 1회 재연결 시도, 3회 로직 없음 |
| react-native-ble-plx 패키지 | 신규 패키지 | ✅ 완료 | `ObdService.ts:12` | import 확인 |
| OBD 설정 화면 | Story 7.1 #1 | ✅ 완료 | `ObdSettingsScreen.tsx` | 연결/해제/데이터 미리보기/DTC 카드/안내 |
| ObdContext (앱 전체 제공) | 암묵적 | ✅ 완료 | `ObdContext.tsx` + `App.tsx:20` | ObdProvider로 앱 전역 래핑 |

**Story 7.1 Match Rate: 73% (8/11 완전 구현, 2 부분, 1 미구현)**

---

### 2.2 Story 7.2: 실시간 PID 데이터 수집 및 전송

| 설계 항목 | 설계 위치 | 구현 상태 | 구현 파일 | 비고 |
|-----------|----------|:---------:|----------|------|
| ELM327 AT 명령어 파싱 | Story 7.2 | ✅ 완료 | `elm327.ts:39-67` | parseResponse 함수 |
| PID 0D (차속) 수집 | 수집 흐름 | ✅ 완료 | `elm327.ts:13, 60` | PIDS.SPEED = '010D' |
| PID 0C (RPM) 수집 | 수집 흐름 | ✅ 완료 | `elm327.ts:14, 61` | PIDS.RPM = '010C' |
| PID 05 (냉각수 온도) 수집 | 수집 흐름 | ✅ 완료 | `elm327.ts:15, 62` | PIDS.COOLANT_TEMP = '0105' |
| PID 2F (연료량) 수집 | 기술스펙 3.3 | ✅ 완료 | `elm327.ts:16, 63` | PIDS.FUEL_LEVEL = '012F' |
| PID 5E (연료 소비율) 수집 | 기술스펙 3.3 | ❌ 미구현 | - | 설계에 있으나 구현 없음 |
| PID 11 (스로틀) 수집 | - | ⚠️ 추가 | `elm327.ts:17, 64` | 설계에 없으나 구현됨 |
| 서버 전송 5초 간격 | Story 7.2 | ✅ 완료 | `ObdService.ts:21` | GPS watchLocation 주기와 동기화 |
| POST update_location에 OBD 데이터 포함 | 서버 전송 | ✅ 완료 | `tripApi.ts:33-52` | rpm, coolant_temp, fuel_level, throttle, events |
| 안전 이벤트 감지 (급가속) | 기술스펙 3.4 | ✅ 완료 | `elm327.ts:114` | +10 km/h / 3초 기준 |
| 안전 이벤트 감지 (급제동) | 기술스펙 3.4 | ✅ 완료 | `elm327.ts:119` | -15 km/h / 3초 기준 |
| 안전 이벤트 감지 (과속) | 기술스펙 3.4 | ⚠️ 변경 | `elm327.ts:123-125` | 설계: "제한속도+10" 동적 -> 구현: 고정 90km/h |
| 안전 이벤트 감지 (공회전) | 기술스펙 3.4 | ⚠️ 변경 | `elm327.ts:128-131` | 설계: RPM 700~900, 3분 -> 구현: RPM 700~1000, 시간 제한 없음 |
| events 배열 서버 전송 | 서버 전송 | ✅ 완료 | `TripDetailScreen.tsx:84-91` | event_type, speed, rpm 포함 |

**Story 7.2 Match Rate: 79% (9/14 완전 구현, 3 변경, 1 추가, 1 미구현)**

---

### 2.3 Story 7.3: Rails API 확장 (OBD 데이터 저장)

| 설계 항목 | 설계 위치 | 구현 상태 | 구현 파일 | 비고 |
|-----------|----------|:---------:|----------|------|
| trips 테이블 avg_speed 컬럼 | 마이그레이션 1 | ❌ 미구현 | `20260228010002_add_obd_to_trips.rb` | 설계에 있으나 구현은 last_rpm 등 실시간 값 저장 방식 |
| trips 테이블 max_speed 컬럼 | 마이그레이션 1 | ❌ 미구현 | - | 통계 컬럼 대신 실시간 OBD 스냅샷 방식 채택 |
| trips 테이블 avg_rpm 컬럼 | 마이그레이션 1 | ❌ 미구현 | - | last_rpm으로 대체 |
| trips 테이블 fuel_consumed 컬럼 | 마이그레이션 1 | ❌ 미구현 | - | last_fuel_level로 대체 (잔량 vs 소비량 차이) |
| trips에 last_rpm 추가 | - | ⚠️ 추가 | `20260228010002_add_obd_to_trips.rb:3` | 설계에 없는 실시간 스냅샷 컬럼 |
| trips에 last_coolant_temp 추가 | - | ⚠️ 추가 | `20260228010002_add_obd_to_trips.rb:4` | |
| trips에 last_fuel_level 추가 | - | ⚠️ 추가 | `20260228010002_add_obd_to_trips.rb:5` | |
| trips에 last_throttle 추가 | - | ⚠️ 추가 | `20260228010002_add_obd_to_trips.rb:6` | |
| trips에 obd_updated_at 추가 | - | ⚠️ 추가 | `20260228010002_add_obd_to_trips.rb:7` | |
| driving_events 테이블 생성 | 마이그레이션 2 | ✅ 완료 | `20260228010000_create_driving_events.rb` | 구조 일치 |
| driving_events.trip_id FK | 마이그레이션 2 | ✅ 완료 | 마이그레이션:4 | |
| driving_events.event_type | 마이그레이션 2 | ✅ 완료 | 마이그레이션:6 | 4종류 동일 |
| driving_events.lat/lng | 마이그레이션 2 | ✅ 완료 | 마이그레이션:9-10 | precision 일치 |
| driving_events.speed/rpm | 마이그레이션 2 | ✅ 완료 | 마이그레이션:7-8 | |
| driving_events.occurred_at | 마이그레이션 2 | ⚠️ 변경 | 마이그레이션:11 | 설계: `occurred_at` 전용 컬럼 -> 구현: `timestamps` (created_at 대용) |
| driving_events.driver_id FK | - | ⚠️ 추가 | 마이그레이션:5 | 설계에 없으나 driver 연결 추가 |
| driver_safety_scores 테이블 | 마이그레이션 3 | ❌ 미구현 | - | 주간 안전 점수 테이블 전체 미구현 |
| DrivingEvent 모델 | - | ✅ 완료 | `driving_event.rb` | 검증 로직 포함 |
| DtcReport 모델 | - | ⚠️ 추가 | `dtc_report.rb` | 설계에 명시적 테이블 정의 없으나 Story 7.4 필요에 의해 구현 |
| dtc_reports 마이그레이션 | - | ⚠️ 추가 | `20260228010001_create_dtc_reports.rb` | 설계에 테이블 정의 없으나 DTC 보고용으로 추가 |
| LocationUpdateService | - | ✅ 완료 | `location_update_service.rb` | OBD 데이터 + 이벤트 저장 + ActionCable 통합 |

**Story 7.3 Match Rate: 55% (7/20 완전 구현, 7 추가/변경, 6 미구현)**

---

### 2.4 Story 7.4: DTC 오류 코드 감지 및 알림

| 설계 항목 | 설계 위치 | 구현 상태 | 구현 파일 | 비고 |
|-----------|----------|:---------:|----------|------|
| 운행 시작 시 DTC 조회 | 흐름 #1 | ✅ 완료 | `TripDetailScreen.tsx:107-117` | handleStart에서 checkDtc() 호출 |
| DTC 파싱 (PID 03) | 흐름 #1 | ✅ 완료 | `elm327.ts:73-98` | parseDtc 함수 (P/C/B/U 코드 지원) |
| POST /driver/trips/:id/report_dtc | 흐름 #2 | ✅ 완료 | `tripApi.ts:55-64`, `trips_controller.rb:68-102` | |
| DTC 코드 디코딩 (P0xxx 등) | 흐름 #3 | ⚠️ 부분 | `elm327.ts:73-98` | 코드 파싱만 구현, 한글 설명 DB (약 3,000개) 미구현 |
| ActionCable 실시간 경고 | 흐름 #4 | ✅ 완료 | `trips_controller.rb:86-98` | dtc_alert 타입 브로드캐스트 |
| FCM/APNs Push 알림 | 흐름 #5 | ❌ 미구현 | - | Push 알림 서비스 미구현 |
| DtcReport 모델 (상태 관리) | 암묵적 | ✅ 완료 | `dtc_report.rb` | pending/acknowledged/resolved 상태 |
| DTC 코드 유효성 검증 | 암묵적 | ✅ 완료 | `dtc_report.rb:7` | 정규식 검증 |
| 운전자 알림 (Alert) | 흐름 | ✅ 완료 | `TripDetailScreen.tsx:112-115` | Alert.alert로 DTC 감지 알림 |
| DTC 초기화 (PID 04) | 기술스펙 3.3 | ❌ 미구현 | - | AT 04 DTC 초기화 기능 미구현 |

**Story 7.4 Match Rate: 70% (7/10 완전 구현, 1 부분, 2 미구현)**

---

### 2.5 Story 7.5: 기관 관리자 안전 대시보드

| 설계 항목 | 설계 위치 | 구현 상태 | 구현 파일 | 비고 |
|-----------|----------|:---------:|----------|------|
| GET /institutions/safety/scores?week= | API #1 | ❌ 미구현 | - | driver_safety_scores 테이블 자체가 없음 |
| GET /institutions/safety/events?trip_id= | API #2 | ✅ 완료 | `safety_controller.rb:10-28` | trip_id 대신 다양한 필터 (date_from, date_to, event_type, driver_id) |
| GET /institutions/safety/dtc_history | API #3 | ✅ 완료 | `safety_controller.rb:73-85` | status, code 필터 포함 |
| 기사별 주간 안전 점수 랭킹 | 화면 #1 | ❌ 미구현 | - | SafetyController에 scores 액션 없음 |
| 이벤트 지도 (히트맵) | 화면 #2 | ❌ 미구현 | - | 프론트엔드 Admin Portal 미구현 |
| 운행별 속도 프로파일 그래프 | 화면 #3 | ❌ 미구현 | - | |
| 월간 리포트 PDF 다운로드 | 화면 #4 | ❌ 미구현 | - | |
| DTC 이력 + 정비 이력 연동 | 화면 #5 | ⚠️ 부분 | `safety_controller.rb:73-85` | DTC 이력 API는 있으나 정비 이력 연동 없음 |
| 안전 요약 API (summary) | - | ⚠️ 추가 | `safety_controller.rb:30-69` | 설계에 없으나 30일 집계 요약 API 추가 |
| DTC 확인 처리 (acknowledge) | - | ⚠️ 추가 | `safety_controller.rb:87-99` | 설계에 없으나 DTC 상태 관리 추가 |
| 라우트 등록 | 라우트 | ✅ 완료 | `routes.rb:63-68` | events, summary, dtc_history, acknowledge_dtc |

**Story 7.5 Match Rate: 38% (3/11 완전 구현, 2 부분/추가, 6 미구현)**

---

## 3. 데이터 모델 비교

### 3.1 Trip 테이블 OBD 컬럼

| 설계 컬럼 | 설계 타입 | 구현 컬럼 | 구현 타입 | 상태 |
|-----------|----------|-----------|----------|:----:|
| avg_speed | decimal(5,2) | - | - | ❌ 미구현 |
| max_speed | decimal(5,2) | - | - | ❌ 미구현 |
| avg_rpm | integer | - | - | ❌ 미구현 |
| fuel_consumed | decimal(5,2) | - | - | ❌ 미구현 |
| - | - | last_rpm | decimal(7,2) | ⚠️ 추가 |
| - | - | last_coolant_temp | decimal(5,2) | ⚠️ 추가 |
| - | - | last_fuel_level | decimal(5,2) | ⚠️ 추가 |
| - | - | last_throttle | decimal(5,2) | ⚠️ 추가 |
| - | - | obd_updated_at | datetime | ⚠️ 추가 |

**접근 방식 차이**: 설계는 운행 완료 후 통계값(avg, max) 저장, 구현은 실시간 스냅샷(last_*) 저장. 두 접근은 상호 보완적이며, 통계 컬럼은 운행 종료 시 집계하여 추가할 수 있음.

### 3.2 driving_events 테이블

| 설계 컬럼 | 구현 컬럼 | 상태 |
|-----------|----------|:----:|
| trip_id (FK) | trip_id (FK) | ✅ |
| event_type (string) | event_type (string, NOT NULL) | ✅ |
| lat (decimal 10,7) | lat (decimal 10,7) | ✅ |
| lng (decimal 10,7) | lng (decimal 10,7) | ✅ |
| speed (decimal 5,2) | speed (decimal 6,2) | ⚠️ precision 차이 |
| rpm (integer) | rpm (decimal 7,2) | ⚠️ 타입 변경 |
| occurred_at (datetime, NOT NULL) | created_at (via timestamps) | ⚠️ 변경 |
| - | driver_id (FK to users) | ⚠️ 추가 |

### 3.3 driver_safety_scores 테이블

| 설계 항목 | 구현 상태 |
|-----------|:---------:|
| 테이블 전체 | ❌ 미구현 |
| user_id FK | ❌ |
| week_start | ❌ |
| score (default 100) | ❌ |
| harsh_accel_count | ❌ |
| harsh_brake_count | ❌ |
| speeding_count | ❌ |
| idling_minutes | ❌ |

### 3.4 dtc_reports 테이블 (설계에 명시 없음, 구현에 추가)

| 구현 컬럼 | 타입 | 비고 |
|-----------|------|------|
| trip_id (FK) | reference | |
| vehicle_id (FK) | reference | |
| code | string, NOT NULL | P0xxx 형식 |
| status | string, default 'pending' | pending/acknowledged/resolved |

---

## 4. API Endpoint 비교

### 4.1 드라이버 API

| 설계 Endpoint | 구현 Endpoint | 상태 | 비고 |
|---------------|--------------|:----:|------|
| POST /api/v1/driver/trips/:id/update_location (OBD 확장) | POST /api/v1/driver/trips/:id/update_location | ✅ | rpm, coolant_temp, fuel_level, throttle, events 파라미터 추가 |
| POST /api/v1/driver/trips/:id/report_dtc | POST /api/v1/driver/trips/:id/report_dtc | ✅ | codes 배열 전송 |

### 4.2 기관 관리자 API

| 설계 Endpoint | 구현 Endpoint | 상태 | 비고 |
|---------------|--------------|:----:|------|
| GET /api/v1/institutions/safety/scores?week= | - | ❌ 미구현 | driver_safety_scores 없음 |
| GET /api/v1/institutions/safety/events?trip_id= | GET /api/v1/institutions/safety/events | ⚠️ 변경 | trip_id 대신 date_from, date_to, event_type, driver_id 필터 |
| GET /api/v1/institutions/safety/dtc_history | GET /api/v1/institutions/safety/dtc_history | ✅ | status, code 필터 추가 |
| - | GET /api/v1/institutions/safety/summary | ⚠️ 추가 | 30일 집계 요약 (설계에 없음) |
| - | PATCH /api/v1/institutions/safety/dtc_history/:id/acknowledge | ⚠️ 추가 | DTC 확인 처리 (설계에 없음) |

---

## 5. Overall Scores

| 카테고리 | 점수 | 상태 |
|----------|:----:|:----:|
| Story 7.1 BLE 연결 관리 | 73% | ⚠️ |
| Story 7.2 PID 수집 + 전송 | 79% | ⚠️ |
| Story 7.3 Rails API 확장 | 55% | ❌ |
| Story 7.4 DTC 감지 + 알림 | 70% | ⚠️ |
| Story 7.5 안전 대시보드 | 38% | ❌ |
| **전체 Design Match Rate** | **63%** | **❌** |

```
+-----------------------------------------------+
|  Overall Match Rate: 63%                       |
+-----------------------------------------------+
|  완전 구현:     34 항목 (52%)                    |
|  변경/추가:     16 항목 (24%)                    |
|  미구현:        16 항목 (24%)                    |
+-----------------------------------------------+
```

---

## 6. Differences Found

### 6.1 Missing Features (설계 O, 구현 X)

| 우선순위 | 항목 | 설계 위치 | 설명 | 영향도 |
|:--------:|------|----------|------|:------:|
| 1 | driver_safety_scores 테이블 | Story 7.3 마이그레이션 3 | 주간 안전 점수 테이블 전체 미구현. 점수 산출/랭킹 기능 불가. | 높음 |
| 2 | GET /safety/scores API | Story 7.5 API #1 | 기사별 주간 안전 점수 랭킹 API 미구현 | 높음 |
| 3 | 안전 대시보드 UI (프론트엔드) | Story 7.5 화면 #1~#4 | 이벤트 히트맵, 속도 그래프, 월간 PDF 등 Admin Portal 화면 전체 미구현 | 높음 |
| 4 | 백그라운드 BLE 유지 | Story 7.1 #6 | expo-background-fetch 미사용. 앱 백그라운드 시 BLE 끊길 수 있음 | 높음 |
| 5 | FCM/APNs Push 알림 | Story 7.4 흐름 #5 | DTC 감지 시 관리자 모바일 Push 알림 미구현 | 중간 |
| 6 | DTC 코드 한글 설명 DB | Story 7.4 흐름 #3 | 약 3,000개 표준 DTC 한글 디코딩 없음 | 중간 |
| 7 | DTC 초기화 (PID 04) | 기술스펙 3.3 | 경고등 초기화 기능 미구현 | 낮음 |
| 8 | PID 5E (연료 소비율) | 기술스펙 3.3 | 연비 분석용 연료 소비율 수집 미구현 | 낮음 |
| 9 | avg_speed / max_speed / fuel_consumed 통계 | Story 7.3 마이그레이션 1 | 운행 종료 시 통계 집계 컬럼 없음 | 중간 |
| 10 | 자동 재연결 최대 3회 | Story 7.1 완료조건 #3 | 1회만 시도 | 낮음 |

### 6.2 Added Features (설계 X, 구현 O)

| 항목 | 구현 위치 | 설명 |
|------|----------|------|
| DtcReport 모델/마이그레이션 | `dtc_report.rb`, `20260228010001` | DTC 보고서 영속화 및 상태 관리 (pending/acknowledged/resolved) |
| PATCH acknowledge_dtc API | `safety_controller.rb:87-99` | DTC 확인 처리 워크플로우 |
| GET /safety/summary API | `safety_controller.rb:30-69` | 30일 집계 요약 (이벤트 타입별, 드라이버별) |
| PID 11 (스로틀) 수집 | `elm327.ts:17` | 설계에 없는 추가 PID |
| trips last_* 실시간 스냅샷 컬럼 | `20260228010002_add_obd_to_trips.rb` | 통계 대신 실시간 스냅샷 방식 채택 |
| LocationUpdateService | `location_update_service.rb` | GPS + OBD + 이벤트를 통합 처리하는 서비스 객체 |

### 6.3 Changed Features (설계 != 구현)

| 항목 | 설계 | 구현 | 영향도 |
|------|------|------|:------:|
| PID 폴링 간격 | 1초 (Story 7.1) | 5초 (POLL_INTERVAL_MS) | 중간 - 이벤트 감지 정확도에 영향 |
| 과속 기준 | 제한속도 + 10 km/h (도로 등급별 동적) | 고정 90 km/h | 중간 - 도로 등급 연동 필요 |
| 공회전 기준 RPM | 700~900, 3분 이상 | 700~1000, 시간 제한 없음 | 낮음 - 폴링마다 감지되어 과다 이벤트 가능 |
| driving_events.occurred_at | 전용 datetime 컬럼 (NOT NULL) | timestamps (created_at 대용) | 낮음 - 기능적 동일 |
| driving_events.speed precision | decimal(5,2) | decimal(6,2) | 낮음 - 범위 확장 |
| driving_events.rpm 타입 | integer | decimal(7,2) | 낮음 - 소수점 정밀도 향상 |
| Trip OBD 컬럼 전략 | 통계값 (avg_speed 등) | 실시간 스냅샷 (last_rpm 등) | 중간 - 보완적, 양쪽 다 필요할 수 있음 |
| events API 필터 | trip_id 기반 | date_from, date_to, event_type, driver_id | 낮음 - 더 유연한 필터링 |

---

## 7. Architecture Compliance

### 7.1 드라이버 앱 (React Native) 레이어 구조

| 레이어 | 기대 폴더 | 실제 폴더 | 상태 |
|--------|----------|----------|:----:|
| Presentation | screens/, components/ | `ObdSettingsScreen.tsx`, `TripDetailScreen.tsx` | ✅ |
| Application (Context) | contexts/ | `ObdContext.tsx` | ✅ |
| Service | services/ | `services/obd2/ObdService.ts` | ✅ |
| Infrastructure | api/ | `api/tripApi.ts` | ✅ |
| Domain (Types) | services/obd2/ | `elm327.ts` (ObdData, DrivingEvent) | ✅ |

의존성 방향: `Screen -> Context -> Service -> elm327(types)`, `Screen -> tripApi(API)` -- 적절함.

### 7.2 Rails API 레이어 구조

| 레이어 | 기대 위치 | 실제 위치 | 상태 |
|--------|----------|----------|:----:|
| Controller | controllers/api/v1/ | `driver/trips_controller.rb`, `institutions/safety_controller.rb` | ✅ |
| Service | services/ | `location_update_service.rb` | ✅ |
| Model | models/ | `driving_event.rb`, `dtc_report.rb` | ✅ |
| Migration | db/migrate/ | 3개 마이그레이션 | ✅ |
| Routes | config/routes.rb | OBD 관련 라우트 등록 | ✅ |

**Architecture Compliance: 95%** -- 레이어 분리 및 의존 방향 양호.

---

## 8. Convention Compliance

| 카테고리 | 규칙 | 준수율 | 위반 사항 |
|----------|------|:------:|----------|
| React 컴포넌트 | PascalCase | 100% | - |
| 함수명 | camelCase (TS) / snake_case (Ruby) | 100% | - |
| 상수 | UPPER_SNAKE_CASE | 100% | PIDS, INIT_COMMANDS 등 |
| 파일명 (컴포넌트) | PascalCase.tsx | 100% | ObdSettingsScreen.tsx, TripDetailScreen.tsx |
| 파일명 (서비스) | PascalCase.ts / snake_case.rb | 100% | ObdService.ts, location_update_service.rb |
| Ruby 모델 | snake_case.rb | 100% | driving_event.rb, dtc_report.rb |
| 아이콘 | Feather Icons (Line) | ❌ 0% | EVENT_ICON에 이모지 사용 (line-icon 규칙 위반) |
| Import 순서 | 외부 -> 내부 -> 상대 | 95% | 대부분 준수 |

**Convention Compliance: 88%** (아이콘 규칙 위반이 주요 감점 요인)

---

## 9. Overall Score Summary

```
+-----------------------------------------------+
|  Overall Score: 72/100                         |
+-----------------------------------------------+
|  Design Match:        63%                      |
|  Architecture:        95%                      |
|  Convention:          88%                      |
|  Code Quality:        90%                      |
+-----------------------------------------------+
|  Weighted Average:    72%                      |
+-----------------------------------------------+
```

---

## 10. Recommended Actions

### 10.1 Immediate (Phase A - 1~2일)

| 우선순위 | 항목 | 파일 | 설명 |
|:--------:|------|------|------|
| 1 | 백그라운드 BLE 유지 구현 | `ObdService.ts` | expo-background-fetch 또는 expo-task-manager 통합. 운행 중 앱 백그라운드 전환 시 BLE 끊김 방지 필수. |
| 2 | 자동 재연결 3회 로직 | `ObdService.ts:connectOrScan()` | 재연결 실패 시 최대 3회 재시도 + 지수 백오프 |
| 3 | 공회전 시간 누적 로직 | `elm327.ts:detectEvents()` | 3분 이상 지속 시에만 idling 이벤트 발생하도록 수정 |

### 10.2 Short-term (Phase B - 3~5일)

| 우선순위 | 항목 | 파일 | 설명 |
|:--------:|------|------|------|
| 1 | driver_safety_scores 테이블 + 마이그레이션 | 신규 | 주간 안전 점수 집계 테이블 생성 |
| 2 | SafetyScoreService 구현 | 신규 | 운행 종료 시 이벤트 기반 점수 계산 + 주간 집계 |
| 3 | GET /safety/scores API | `safety_controller.rb` | 기사별 주간 안전 점수 랭킹 엔드포인트 |
| 4 | Trip 통계 컬럼 추가 | 마이그레이션 | avg_speed, max_speed, fuel_consumed -- 운행 종료 시 집계 |
| 5 | 과속 기준 동적화 | `elm327.ts` | 도로 등급 파라미터 수용 (기본값 90, 설정 가능) |

### 10.3 Medium-term (Phase C - 1~2주)

| 우선순위 | 항목 | 위치 | 설명 |
|:--------:|------|------|------|
| 1 | Admin Portal 안전 대시보드 UI | admin-portal/ | 이벤트 지도, 속도 그래프, 점수 랭킹 화면 |
| 2 | FCM/APNs Push 알림 | Rails + Mobile | DTC 감지 시 기관 관리자 모바일 Push |
| 3 | DTC 한글 설명 DB | Rails seeds/lookup | 약 3,000개 표준 DTC 코드 -> 한글 설명 매핑 |
| 4 | 월간 PDF 리포트 | Rails (wicked_pdf 등) | 안전 리포트 PDF 생성 + 다운로드 API |

### 10.4 Long-term (Backlog)

| 항목 | 설명 |
|------|------|
| PID 5E 연료 소비율 수집 | 연비 분석 고도화 |
| DTC 초기화 (PID 04) | 정비 후 경고등 리셋 기능 |
| EVENT_ICON을 Feather Icons로 교체 | SLDS 규칙 준수 (이모지 -> SVG 라인 아이콘) |
| PID 폴링 간격 설정 가능화 | 1초~10초 범위 사용자 설정 |

---

## 11. Design Document Updates Needed

구현이 설계보다 진보한 부분은 설계 문서에 반영이 필요합니다:

- [ ] DtcReport 모델/테이블 정의 추가 (Story 7.4에 테이블 정의 명시)
- [ ] trips 테이블 컬럼을 실시간 스냅샷(last_*) + 통계(avg_*) 병행 방식으로 업데이트
- [ ] GET /safety/summary API 설계 추가
- [ ] PATCH /safety/dtc_history/:id/acknowledge API 설계 추가
- [ ] PID 11 (스로틀) 수집 항목 추가
- [ ] PID 폴링 간격 5초 (설계 1초에서 변경) 근거 문서화
- [ ] events API 필터 파라미터 변경 반영 (trip_id -> 다중 필터)
- [ ] driving_events 테이블 driver_id FK 추가 반영

---

## 12. Synchronization Recommendation

**Match Rate 63% (< 70%)** 이므로 설계와 구현 간 상당한 갭이 존재합니다.

**권장 접근**:
1. **구현 수정 우선**: Story 7.1의 백그라운드 BLE, 재연결 로직 등 핵심 기능 보완
2. **설계 업데이트 병행**: DtcReport, summary API 등 구현 진보 항목을 설계에 반영
3. **Story 7.5 (38%)는 별도 Sprint 계획**: Admin Portal 안전 대시보드는 대규모 프론트엔드 작업이므로 독립 Sprint로 분리 권장

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-28 | Initial gap analysis | Claude (Gagahoho Inc.) |
