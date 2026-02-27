# Pickup MaaS Platform — Stage 2 고도화 로드맵

> **Summary**: MVP 완성 이후 B2B SaaS 수익 고도화, 승객/보호자 앱 구현, AI 경로 최적화, BI 대시보드, QR/NFC 체크인, 파트너십 에코시스템 구축을 통해 ARR 성장과 시장 확대를 달성하는 6~12개월 로드맵
>
> **Project**: Pickup MaaS Platform
> **Version**: 2.0
> **Author**: Claude (Product Manager, Gagahoho Inc.)
> **Date**: 2026-02-28
> **Status**: Draft — CTO 승인 대기

---

## 목차

1. [현황 요약 (MVP 기준선)](#1-현황-요약-mvp-기준선)
2. [비즈니스 목표 및 KPI](#2-비즈니스-목표-및-kpi)
3. [구독 플랜 매트릭스 (수익 고도화)](#3-구독-플랜-매트릭스-수익-고도화)
4. [Epic 목록 및 MoSCoW 우선순위](#4-epic-목록-및-moscow-우선순위)
5. [Epic 8: 승객/보호자 앱 (Epic 6 구현)](#5-epic-8-승객보호자-앱-epic-6-구현)
6. [Epic 9: AI 경로 최적화 (VRP 엔진)](#6-epic-9-ai-경로-최적화-vrp-엔진)
7. [Epic 10: BI 대시보드](#7-epic-10-bi-대시보드)
8. [Epic 11: QR/NFC 자동 체크인](#8-epic-11-qrnfc-자동-체크인)
9. [Epic 12: 결제 및 구독 관리 시스템](#9-epic-12-결제-및-구독-관리-시스템)
10. [Epic 13: 파트너십 에코시스템](#10-epic-13-파트너십-에코시스템)
11. [전체 타임라인](#11-전체-타임라인)
12. [기술 아키텍처 고도화](#12-기술-아키텍처-고도화)
13. [리스크 및 완화 방안](#13-리스크-및-완화-방안)
14. [투자 대비 수익 분석 (ROI)](#14-투자-대비-수익-분석-roi)

---

## 1. 현황 요약 (MVP 기준선)

### 1.1 구현 완료 현황

| Epic | 기능 | 상태 |
|------|------|:----:|
| Epic 1 | 기관 관리 + 슈퍼어드민 포털 (승인/거부/정지) | 완료 |
| Epic 2 | 차량 및 기사 관리 (CRUD, 1:1 배정) | 완료 |
| Epic 3 | 승객 명단 관리 (CSV 업로드, 주간 명단, 복사) | 완료 |
| Epic 4 | 실시간 차량 추적 (ActionCable WebSocket + GPS) | 완료 |
| Epic 5 | 드라이버 모바일 앱 (로그인, 운행, 체크인, GPS) | 완료 |
| Epic 6 | 승객/보호자 앱 | 설계 문서만 존재 — **미구현** |
| Epic 7 (기본) | OBD-II BLE 통합 (BLE 연결, PID, 안전 이벤트) | 완료 (Match Rate 63%) |
| Epic 7 (고도화) | OBD-II 고도화 (안전 점수, Admin UI, FCM, DTC DB) | 기획 완료 — **구현 대기** |

### 1.2 현재 기술 스택 (MVP 실제 구현)

```
백엔드:    Rails 8.1.2 API-only + SQLite3 + solid_cable
인증:      JWT 자체 구현 (15분 access + 7일 refresh)
실시간:    ActionCable (WebSocket)
드라이버앱: React Native (Expo)
Admin Portal: Rails 웹 (구현 중)
```

### 1.3 현재 데이터 모델 (핵심 테이블)

```
users, institutions, institution_types, plans, subscriptions,
vehicles, passengers, passenger_schedules, rosters, roster_passengers,
trips, check_ins, driving_events, driver_safety_scores,
dtc_reports, solid_cable_messages
```

### 1.4 Stage 2 착수 전 완료 조건

- [ ] Epic 6 (승객/보호자 앱) 미구현 — Stage 2 최우선 과제
- [ ] Epic 7 고도화 Phase A~B 완료 (driver_safety_scores, Admin Portal UI)
- [ ] Admin Portal 핵심 화면 (기관 관리, 차량/기사, 명단) QA 완료
- [ ] 파일럿 기관 3개 이상 확보 및 실운행 피드백 수집

---

## 2. 비즈니스 목표 및 KPI

### 2.1 Stage 2 목표 (6개월: 2026-03 ~ 2026-08)

| 지표 | 현재 | 목표 |
|------|------|------|
| 계약 기관 수 | 파일럿 3~5개 | 30개 이상 |
| MRR (월간 반복 매출) | 0원 (파일럿 무료) | 1,500만원 이상 |
| ARR (연간 반복 매출) | 0원 | 1.8억원 이상 |
| 승객/보호자 앱 활성 사용자 | 0명 | 500명 이상 |
| PRO 이상 플랜 비율 | 해당 없음 | 60% 이상 |
| NPS (순추천지수) | 측정 불가 | 60 이상 |
| 정시 도착률 | 측정 중 | 93% 이상 |

### 2.2 Stage 3 목표 (12개월: 2026-09 ~ 2027-02)

| 지표 | Stage 2 달성 | 목표 |
|------|------------|------|
| 계약 기관 수 | 30개 | 100개 이상 |
| MRR | 1,500만원 | 5,000만원 이상 |
| ARR | 1.8억원 | 6억원 이상 |
| ENTERPRISE 플랜 기관 수 | 2~3개 | 10개 이상 |
| 보험 파트너 연동 기관 | 0 | 20개 이상 |

### 2.3 핵심 성장 드라이버

```
1. 승객/보호자 앱 출시 → B2B 계약 차별화 포인트 확보
2. AI 경로 최적화 → 운행비용 15~20% 절감 → ENTERPRISE 플랜 전환 유도
3. 구독 플랜 차별화 → ARPU(기관당 평균 매출) 상승
4. OBD + 보험 파트너십 → 신규 수익원 창출
5. BI 대시보드 → 관리자 Lock-in 강화 → 이탈률 감소
```

---

## 3. 구독 플랜 매트릭스 (수익 고도화)

### 3.1 플랜 정의

| 기능 | BASIC | PRO | ENTERPRISE |
|------|:-----:|:---:|:----------:|
| **월 구독료** | 30만원 | 80만원 | 200만원+ (협의) |
| **차량 수** | 최대 3대 | 최대 10대 | 무제한 |
| **승객 수** | 최대 50명 | 최대 300명 | 무제한 |
| **기관 관리자 계정** | 1개 | 3개 | 무제한 |
| **관리자 포털 (웹)** | 기본 | 전체 | 전체 + 커스텀 |
| **기사 모바일 앱** | 포함 | 포함 | 포함 |
| **승객/보호자 앱** | 미포함 | 포함 | 포함 |
| **실시간 GPS 추적** | 포함 | 포함 | 포함 |
| **FCM 푸시 알림** | 미포함 | 포함 | 포함 |
| **ETA 표시** | 직선거리 | AI 기반 | AI 기반 |
| **AI VRP 경로 최적화** | 미포함 | 미포함 | 포함 |
| **OBD-II 안전 점수** | 미포함 | 포함 | 포함 |
| **QR/NFC 체크인** | 미포함 | 포함 | 포함 |
| **BI 대시보드** | 기본 (7일) | 표준 (90일) | 고급 (무제한) |
| **월간 안전 리포트** | 미포함 | 포함 | 포함 + 맞춤 |
| **보험 연동 리포트** | 미포함 | 미포함 | 포함 |
| **API 연동** | 미포함 | 미포함 | 포함 |
| **SLA** | 99% | 99.5% | 99.9% + 전담 CS |
| **데이터 보존 기간** | 30일 | 90일 | 1년 이상 |
| **온보딩 지원** | 셀프 | 원격 지원 | 전담 PM |

### 3.2 플랜 전환 시나리오 (업셀 경로)

```
BASIC (파일럿/소규모 학원)
  → 승객/보호자 앱 수요 발생 → PRO 전환
  → 차량 3대 초과 → PRO 전환

PRO (중규모 학원/데이케어)
  → 기관 10대 초과 또는 AI 경로 최적화 ROI 확인 → ENTERPRISE 전환
  → 보험사 연동 요청 → ENTERPRISE 전환

ENTERPRISE (대형 기관/요양원 체인)
  → 다수 지점 통합 관리 → Enterprise Multi-Site 플랜 (별도 협의)
```

### 3.3 ARR 시나리오 (보수 추정)

```
기준: 계약 기관 30개 달성 시 (Stage 2 목표)

시나리오 1 (보수):
  BASIC 18개 × 30만원 × 12개월 = 6,480만원
  PRO   10개 × 80만원 × 12개월 = 9,600만원
  ENTERPRISE 2개 × 200만원 × 12개월 = 4,800만원
  합계: 약 2.1억원 ARR

시나리오 2 (목표):
  BASIC 10개 × 30만원 × 12개월 = 3,600만원
  PRO   15개 × 80만원 × 12개월 = 14,400만원
  ENTERPRISE 5개 × 200만원 × 12개월 = 12,000만원
  합계: 약 3억원 ARR
```

---

## 4. Epic 목록 및 MoSCoW 우선순위

### Stage 2 Epic 전체 목록

| Epic | 제목 | MoSCoW | 예상 공수 | 플랜 연계 |
|------|------|:------:|:--------:|-----------|
| Epic 7 (고도화) | OBD-II 고도화 Phase A~B | Must | 24인일 | PRO/ENTERPRISE |
| Epic 8 | 승객/보호자 앱 (Epic 6 구현) | Must | 20인일 | PRO/ENTERPRISE |
| Epic 9 | AI 경로 최적화 (VRP 엔진) | Should | 25인일 | ENTERPRISE |
| Epic 10 | BI 대시보드 | Should | 18인일 | PRO/ENTERPRISE |
| Epic 11 | QR/NFC 자동 체크인 | Should | 10인일 | PRO/ENTERPRISE |
| Epic 12 | 결제 및 구독 관리 시스템 | Must | 12인일 | 전체 플랜 |
| Epic 13 | 파트너십 에코시스템 | Could | 15인일 | ENTERPRISE |
| OBD7 Phase C~E | AI 예측 정비 · 보험 · 코칭 | Could | 14인일 | ENTERPRISE |

**총 예상 개발 공수**: 138인일

```
Must  (Stage 2 필수): 56인일 (Epic 7 고도화 + Epic 8 + Epic 12)
Should (6개월 내 목표): 53인일 (Epic 9 + Epic 10 + Epic 11)
Could (Stage 3 이관 가능): 29인일 (Epic 13 + OBD 고도화 C~E)
```

---

## 5. Epic 8: 승객/보호자 앱 (Epic 6 구현)

> **MoSCoW**: Must | **예상 공수**: 20인일 | **대상 플랜**: PRO, ENTERPRISE

### 5.1 비즈니스 임팩트

```
현황 문제:
  - 보호자가 자녀 탑승 여부를 학원에 전화로 확인해야 함
  - 기관이 PRO 플랜으로 업셀되지 않는 핵심 이유: 보호자 앱 없음
  - 경쟁 서비스(카카오 T 전세버스, i-BUS)와 차별화 포인트 부재

기대 효과:
  - 보호자 안심 서비스 → NPS +20점 기대
  - BASIC → PRO 전환 주요 트리거
  - 승객 앱 활성화 → 기관 계약 갱신율 +25% 기대
```

### 5.2 주요 사용자 스토리

| Story | 기능 | 우선순위 |
|-------|------|:-------:|
| 8.1 | 보호자 회원가입 (JWT 인증 + 초대 코드 연결) | Must |
| 8.2 | 이번 주 운행 일정 조회 (주간 캘린더) | Must |
| 8.3 | 실시간 셔틀 위치 지도 (ActionCable WebSocket) | Must |
| 8.4 | AI 기반 ETA 표시 (PRO+) / 직선거리 ETA (BASIC) | Must |
| 8.5 | 운행 시작 FCM 푸시 알림 | Must |
| 8.6 | 승하차 확인 FCM 푸시 알림 | Must |
| 8.7 | 당일 운행 취소 요청 | Should |
| 8.8 | 알림 센터 (수신 이력 조회) | Should |
| 8.9 | 프로필 및 알림 설정 | Should |
| 8.10 | Geofence 도착 임박 알림 (500m 이내 진입 시) | Could |

### 5.3 기술 스펙

#### 5.3.1 인증 (JWT 기반, Clerk 미사용)

```
현재 Rails JWT 인증 시스템 확장:
  - users 테이블에 role: 'guardian' 추가
  - passengers 테이블에 invite_code 컬럼 추가 (UUID, unique)
  - guardians 테이블 신규 생성

  POST /api/v1/auth/guardian/register
    { phone, password, invite_code }
    → invite_code 검증 → passenger_id 연결 → JWT 발급

  POST /api/v1/auth/refresh
    { refresh_token } → 새 access_token 발급
```

#### 5.3.2 실시간 위치 (ActionCable 활용)

```
기존 Epic 4 ActionCable 채널 재활용:
  TripChannel → 기사 앱(publisher) + 관리자 포털(subscriber)
  → 승객 앱도 동일 채널 구독 추가

  # app/channels/trip_channel.rb (확장)
  def subscribed
    stream_from "trip_#{params[:trip_id]}"
  end

  # 승객 앱 구독 조건: 자신의 승객이 포함된 Trip만
  # API: GET /api/v1/guardian/active_trip → trip_id 반환
```

#### 5.3.3 ETA 계산

```
BASIC 플랜: 직선거리 기반 (기존 Epic 4 로직 유지)
  ETA = (직선거리 km / 30) × 60 분

PRO/ENTERPRISE 플랜 (Stage 2 Epic 9 연계):
  ETA = 카카오 Directions API 기반 실시간 교통 반영 예측
  캐시: Redis TTL 60초 (동일 경로 중복 API 호출 방지)
```

#### 5.3.4 FCM 푸시 알림

```
Rails 백엔드 FCM 통합:
  users 테이블에 fcm_token 컬럼 추가
  POST /api/v1/guardian/fcm_token { token } — 토큰 등록

  알림 트리거:
    1. 운행 시작 → TripService.start! → FCM 발송 (관련 보호자 전체)
    2. 체크인(탑승) → CheckIn.board! → FCM 발송 (해당 보호자)
    3. 체크아웃(하차) → CheckIn.alight! → FCM 발송 (해당 보호자)
    4. 당일 취소 처리 → RosterCancellation → 기사 FCM 발송

  구현 파일:
    app/services/fcm_notification_service.rb (신규)
    app/jobs/send_push_notification_job.rb (비동기 ActiveJob)
```

#### 5.3.5 신규 DB 마이그레이션

```ruby
# guardians 테이블 신규
create_table :guardians do |t|
  t.references :user,      null: false, foreign_key: true  # JWT 인증 주체
  t.references :passenger, null: false, foreign_key: true  # 연결 승객
  t.string     :relationship  # parent / child / other
  t.timestamps
  t.index [:user_id, :passenger_id], unique: true
end

# passengers 테이블 확장
add_column :passengers, :invite_code, :string  # UUID
add_index  :passengers, :invite_code, unique: true

# trip_cancellations 테이블 신규 (당일 취소)
create_table :trip_cancellations do |t|
  t.references :roster_passenger, null: false, foreign_key: true
  t.references :requested_by,     null: false, foreign_key: { to_table: :users }
  t.string     :reason
  t.date       :cancel_date,      null: false
  t.timestamps
end
```

### 5.4 앱 화면 구성

```
승객/보호자 앱 (React Native Expo)

탭 구조:
  탭1: 홈 (오늘 운행 상태 + 실시간 지도 + ETA)
  탭2: 일정 (주간 캘린더 + 결석 신청)
  탭3: 알림 센터 (탑승/하차/운행시작 이력)
  탭4: 프로필 (보호자 정보 + 알림 설정 + 연결 승객)

주요 화면:
  초대 코드 입력 화면 (회원가입 step 2)
  실시간 지도 화면 (셔틀 마커 + 내 픽업 지점 마커 + ETA 카드)
  운행 취소 확인 다이얼로그
```

### 5.5 예상 공수

| Story | 내용 | 공수 |
|-------|------|:----:|
| 8.1~8.4 | 백엔드 API (인증, 일정, 위치, ETA) | 5인일 |
| 8.5~8.6 | FCM 통합 (Rails + Expo) | 3인일 |
| 8.7~8.9 | 취소/알림센터/프로필 API | 2인일 |
| 8.1~8.9 | 앱 화면 구현 (RN/Expo) | 8인일 |
| 8.10 | Geofence 알림 (Could) | 2인일 |
| **합계** | | **20인일** |

---

## 6. Epic 9: AI 경로 최적화 (VRP 엔진)

> **MoSCoW**: Should | **예상 공수**: 25인일 | **대상 플랜**: ENTERPRISE

### 6.1 비즈니스 임팩트

```
문제:
  현재 픽업 순서는 기사 또는 관리자가 수동으로 설정
  비효율적 경로로 인한 불필요한 연료비 + 운행 시간 증가

기대 효과:
  - 경로 최적화 시 평균 운행 거리 15~20% 단축
  - 차량 1대/일 기준 연료비 약 3,000~5,000원 절감
  - 10대 운영 기관 기준 월 90~150만원 절감
  → ENTERPRISE 플랜 월 200만원 구독료 ROI 정당화

영업 메시지:
  "AI 경로 최적화로 연료비 절감 효과가 구독료를 상회합니다"
```

### 6.2 VRP (Vehicle Routing Problem) 설계

#### 6.2.1 알고리즘 선택

```
1차 (MVP급 빠른 구현):
  OR-Tools (Google) — Python 마이크로서비스
  입력: 승객 픽업 주소 좌표 + 차량 시작 위치 + 시간 제약
  출력: 최적 방문 순서 + 예상 총 거리/시간

2차 (정확도 향상):
  카카오 Directions API 실제 도로 거리 행렬 + OR-Tools
  → 직선거리 대신 실제 도로 경로 반영

구성:
  pickup_rails/ (Rails API) ← HTTP → vrp_service/ (Python FastAPI + OR-Tools)
```

#### 6.2.2 마이크로서비스 구조

```
vrp_service/ (Python FastAPI)
├── main.py                   # FastAPI 앱
├── solver/
│   ├── vrp_solver.py         # OR-Tools VRP 솔버
│   ├── distance_matrix.py    # 카카오 API 기반 거리 행렬
│   └── constraints.py        # 시간 창/용량 제약
├── requirements.txt
└── Dockerfile

Rails 연동:
  app/services/vrp_client_service.rb
    POST http://vrp_service:8000/optimize
    { passengers: [{id, lat, lng}], vehicle: {start_lat, start_lng, capacity} }
    → { optimized_order: [passenger_id, ...], estimated_distance_km, estimated_duration_min }
```

#### 6.2.3 API 설계

```
POST /api/v1/institutions/rosters/:id/optimize
  → VRP 솔버 호출
  → 최적 픽업 순서 반환
  → roster_passengers.boarding_order 자동 업데이트 옵션

GET /api/v1/institutions/rosters/:id/route_preview
  → 현재 픽업 순서 기반 예상 경로 + 거리/시간
  → 최적화 전/후 비교 제공

POST /api/v1/institutions/rosters/:id/apply_optimization
  → 최적화 결과 확정 적용 (boarding_order 업데이트)
```

#### 6.2.4 ETA 고도화 (카카오 Directions API)

```
기존 직선거리 기반 ETA 대체:
  EtaCalculatorService (Rails)
    1. 현재 차량 위치 (GPS) 조회
    2. 목적지 (다음 승객 픽업 주소) 설정
    3. 카카오 Directions API 호출 (실시간 교통 반영)
    4. 예상 도착 시간 계산
    5. Redis 캐시 (TTL 60초) → 동일 경로 재요청 시 캐시 사용

비용 최적화:
  카카오 모빌리티 API 무료 쿼터: 월 30만 호출
  캐싱 + 배치 처리로 호출 최소화
  30만 초과 시 → 직선거리 fallback

연료비 절감 리포트:
  월별 실제 주행 거리 vs 최적화 전 예상 거리 비교
  절감 금액 = 절감 거리(km) × 연비(L/km) × 유가(원/L)
  Admin Portal BI 대시보드에 "절감 효과" 위젯 표시
```

### 6.3 예상 공수

| 작업 | 내용 | 공수 |
|------|------|:----:|
| VRP 마이크로서비스 | Python FastAPI + OR-Tools 솔버 | 8인일 |
| 카카오 API 연동 | 거리 행렬 + ETA 고도화 | 5인일 |
| Rails VRP 클라이언트 | API 통합 + 결과 저장 | 4인일 |
| Admin Portal UI | 경로 최적화 화면 + 미리보기 지도 | 5인일 |
| 연료비 절감 리포트 | 계산 로직 + BI 연동 | 3인일 |
| **합계** | | **25인일** |

---

## 7. Epic 10: BI 대시보드

> **MoSCoW**: Should | **예상 공수**: 18인일 | **대상 플랜**: PRO (90일), ENTERPRISE (무제한)

### 7.1 비즈니스 임팩트

```
문제:
  관리자가 운행 데이터를 활용한 의사결정을 내릴 수 없음
  기관 원장/대표가 구독 가치를 체감하지 못함 → 이탈 위험

기대 효과:
  - 관리자 주간 로그인 빈도 3배 이상 증가 예상
  - "데이터 기반 운행 관리" 차별화 포인트 → 영업 레버리지
  - ENTERPRISE 업셀 핵심 트리거
  - 이탈률 30% 감소 (Lock-in 효과)
```

### 7.2 대시보드 구성

#### 7.2.1 운행 효율성 지표

```
[KPI 카드 — 상단 고정]
  정시 도착률 (%)   |  평균 운행 시간 (분)  |  총 운행 거리 (km)  |  승하차 완료율 (%)

[정시 도착률 트렌드]
  주간 라인 차트 (최근 12주)
  기준선: 목표 정시 도착률 (기관 설정 가능, 기본 90%)
  임계값 미달 구간: 빨간 배경 하이라이트

정시 도착 계산:
  scheduled_arrival_time(픽업 예정 시각) vs actual_arrival_time(체크인 시각)
  허용 오차: ±10분 이내 = 정시
  (passenger_schedules.pickup_time vs check_ins.boarded_at 비교)
```

#### 7.2.2 기관별 비교 리포트 (ENTERPRISE)

```
[기관별 운행 효율 순위표]
  기관명 | 정시율 | 평균 운행시간 | 이탈율 | 안전점수 평균

[시간대별 운행 부하 히트맵]
  X축: 요일 (월~금)
  Y축: 시간 (오전/오후)
  색상: 운행 차량 수 (연한 → 진한)

목적: 비효율 시간대 파악 → 차량 배치 최적화 제안
```

#### 7.2.3 승객 이탈 분석

```
[취소율 트렌드]
  주간 당일 취소 건수 바 차트
  취소 이유 분류 (파이 차트): 결석 / 개인 사정 / 기타

[픽업 대기 시간 분포]
  승객별 평균 대기 시간 히스토그램
  상위 10% 대기 시간이 긴 승객 목록 (경로 재배치 권고 트리거)
```

#### 7.2.4 OBD 안전 점수 연계 (Epic 7 고도화 연동)

```
[안전 지수 트렌드]
  기관 전체 평균 안전 점수 (주간)
  D등급 드라이버 비율 추이

[이벤트 발생 패턴]
  급가속/급제동/과속 유형별 월간 추이 바 차트
  시간대별 이벤트 발생 히트맵
```

#### 7.2.5 기술 구현

```
Rails 백엔드 집계:
  analytics_controller.rb (신규)
  AnalyticsQueryService — 복잡한 집계 쿼리 캡슐화
  SQLite → 집계 쿼리 최적화 (인덱스 추가)
  Redis 캐시 (TTL 1시간) — 무거운 집계 결과 캐싱

Admin Portal 프론트엔드:
  Recharts 라이브러리 (이미 Epic 7 고도화에서 채택)
  탭 기반 대시보드 레이아웃 (SLDS 3-Column)

데이터 범위:
  BASIC: 최근 7일
  PRO: 최근 90일
  ENTERPRISE: 전체 (무제한) + 기관 간 비교
```

### 7.3 예상 공수

| 작업 | 내용 | 공수 |
|------|------|:----:|
| 집계 API 구현 | Rails AnalyticsQueryService + 엔드포인트 | 5인일 |
| 운행 효율 차트 | 정시 도착률, 운행 시간, KPI 카드 | 5인일 |
| 기관 비교 리포트 | 순위표, 히트맵 (ENTERPRISE) | 4인일 |
| 승객 이탈 분석 | 취소율, 대기 시간 분포 | 2인일 |
| 데이터 내보내기 | CSV/Excel 다운로드 | 2인일 |
| **합계** | | **18인일** |

---

## 8. Epic 11: QR/NFC 자동 체크인

> **MoSCoW**: Should | **예상 공수**: 10인일 | **대상 플랜**: PRO, ENTERPRISE

### 8.1 비즈니스 임팩트

```
문제:
  기사가 수동으로 각 승객 체크박스를 클릭해야 함
  승객 수 20명 이상 시 운행 시작 후 체크인 처리에 1~2분 소요
  오탑승/누락 발생 위험

기대 효과:
  - 체크인 처리 시간 80% 단축 (20명 기준 2분 → 20초)
  - 오탑승 사고 방지 → 기관 법적 책임 경감
  - PRO 플랜 차별화 기능 → 업셀 레버리지
```

### 8.2 QR 코드 체계

#### 8.2.1 QR 코드 생성 (Admin Portal)

```
승객별 QR 코드 내용:
  {
    "type": "passenger_checkin",
    "passenger_id": 123,
    "institution_id": 45,
    "checksum": "sha256(passenger_id + institution_id + secret_key)"
  }

생성 주체: Admin Portal (Rails)
  GET /api/v1/institutions/passengers/:id/qr_code
  → PNG QR 이미지 반환 (rqrcode gem)

배포 방법:
  1. Admin Portal에서 PDF 출력 → 보호자에게 인쇄 제공
  2. 승객/보호자 앱 내 QR 코드 화면 표시 (Epic 8 연계)
  3. 기관 NFC 태그 발주 대행 (ENTERPRISE 옵션)
```

#### 8.2.2 드라이버 앱 스캔 기능

```
드라이버 앱 체크인 화면 개선:
  기존: 승객 목록 → 체크박스 수동 클릭
  신규: [QR 스캔] 버튼 → 카메라 실행 → QR 인식 → 자동 체크인

  expo-barcode-scanner (또는 expo-camera) 활용
  스캔 성공 시:
    POST /api/v1/driver/check_ins (기존 엔드포인트 재사용)
    { trip_id, passenger_id, type: "board", source: "qr" }

  스캔 결과 UI:
    성공: 초록 체크 + "김민수 탑승 완료" + 진동(Haptics)
    실패: 빨간 X + "해당 승객을 찾을 수 없습니다"
    오탑승: 빨간 경고 + "이 차량 탑승 대상이 아닙니다"
```

#### 8.2.3 NFC 태그 옵션 (ENTERPRISE)

```
NFC 태그 활용:
  NTAG213 (1KB, 저가) NFC 태그에 승객 ID URL 기록
  https://pickup.app/checkin/{passenger_id}?hmac={signature}

  드라이버 앱: expo-nfc (또는 react-native-nfc-manager)
  스마트폰 NFC 탭 → URL 파싱 → 체크인 API 호출

ENTERPRISE 부가 서비스:
  NFC 태그 발주 대행 (500개 기준 약 15만원)
  태그 프로그래밍 서비스
  → 추가 수익원 (ENTERPRISE 구독 외 1회성 수수료)
```

#### 8.2.4 보안 고려사항

```
QR/NFC 코드 위변조 방지:
  HMAC-SHA256 서명 (server-side secret key 기반)
  유효 기간: 해당 운행 날짜만 유효 (daily rotation)
  재사용 방지: check_ins 테이블에 trip_id + passenger_id unique index 존재

체크인 소스 기록:
  check_ins 테이블에 source 컬럼 추가
  source: manual / qr / nfc
  → 분석 데이터 활용 (QR 도입 후 수동 체크인 감소 추적)
```

### 8.3 예상 공수

| 작업 | 내용 | 공수 |
|------|------|:----:|
| QR 생성 API | rqrcode gem + Admin Portal UI | 2인일 |
| 승객 앱 QR 화면 | 보호자 앱 내 QR 표시 화면 (Epic 8 연계) | 1인일 |
| 드라이버 앱 스캔 | expo-barcode-scanner + 스캔 UI | 3인일 |
| NFC 지원 | expo-nfc + ENTERPRISE 설정 | 3인일 |
| 보안 로직 | HMAC 서명 + 유효기간 검증 | 1인일 |
| **합계** | | **10인일** |

---

## 9. Epic 12: 결제 및 구독 관리 시스템

> **MoSCoW**: Must | **예상 공수**: 12인일 | **대상 플랜**: 전체

### 9.1 비즈니스 임팩트

```
현황:
  plans, subscriptions 테이블은 존재하나 결제 시스템 미연동
  파일럿 기관은 무료 운영 중
  수익 발생을 위해 결제 시스템 연동 필수

목표:
  - 신용카드 자동 결제 (월별 구독료)
  - 구독 상태 자동 관리 (갱신/만료/정지)
  - 슈퍼어드민 수동 플랜 변경 (영업 지원)
  - 인보이스 자동 발행
```

### 9.2 결제 시스템 설계

#### 9.2.1 PG사 선택

```
1순위: 토스페이먼츠 (국내 SaaS 표준, B2B 카드 결제 강점)
  - 정기 결제(자동 빌링) API 제공
  - 세금계산서 연동 가능
  - 결제 대시보드 제공

2순위: 포트원 (아임포트) — 다중 PG 통합 옵션
  - 복수 PG 전환 유연성
  - 해외 결제 지원 (글로벌 확장 고려 시)

구현 방향: 토스페이먼츠 API 직접 연동 (첫 빌링 카드 등록 → 자동 갱신)
```

#### 9.2.2 구독 라이프사이클

```
신규 기관 온보딩:
  1. 슈퍼어드민이 기관 승인 + 플랜 배정
  2. 기관 관리자가 Admin Portal에서 카드 등록 (토스페이먼츠 위젯)
  3. 첫 달 무료 체험 (trial_ends_at)
  4. 체험 종료 3일 전 이메일 알림 (ActionMailer)
  5. 자동 첫 결제 → 구독 활성화

자동 갱신 (매월):
  SubscriptionRenewalJob (ActiveJob + solid_queue)
  매월 1일 00:05 실행:
    - 갱신 예정 구독 목록 조회
    - 토스페이먼츠 자동 결제 API 호출
    - 성공: subscription.status = active, end_date + 1개월
    - 실패: 3회 재시도 → 실패 시 subscription.status = suspended

플랜 변경:
  업그레이드: 즉시 적용 + 잔여 기간 일할 계산 차액 청구
  다운그레이드: 다음 갱신일부터 적용
```

#### 9.2.3 신규 DB 마이그레이션

```ruby
# subscriptions 테이블 확장
add_column :subscriptions, :toss_billing_key, :string   # 자동결제 키
add_column :subscriptions, :next_billing_date, :date
add_column :subscriptions, :failed_payment_count, :integer, default: 0

# payment_records 테이블 신규
create_table :payment_records do |t|
  t.references :subscription, null: false, foreign_key: true
  t.string     :toss_payment_key
  t.integer    :amount_krw,     null: false
  t.string     :status          # pending / success / failed / refunded
  t.string     :failure_reason
  t.datetime   :paid_at
  t.timestamps
end

# invoices 테이블 신규 (세금계산서 발행)
create_table :invoices do |t|
  t.references :payment_record, null: false, foreign_key: true
  t.references :institution,    null: false, foreign_key: true
  t.string     :invoice_number, null: false, index: { unique: true }
  t.integer    :amount_krw
  t.date       :issue_date
  t.string     :pdf_url         # ActiveStorage
  t.timestamps
end
```

### 9.3 예상 공수

| 작업 | 내용 | 공수 |
|------|------|:----:|
| 토스페이먼츠 연동 | 카드 등록 + 자동 결제 API | 4인일 |
| 구독 라이프사이클 | 갱신 Job + 상태 관리 | 3인일 |
| Admin Portal UI | 결제 현황 + 플랜 변경 + 인보이스 | 3인일 |
| 이메일 알림 | 갱신 예정/실패/성공 ActionMailer | 2인일 |
| **합계** | | **12인일** |

---

## 10. Epic 13: 파트너십 에코시스템

> **MoSCoW**: Could | **예상 공수**: 15인일 | **대상 플랜**: ENTERPRISE

### 10.1 보험사 연동 (OBD 안전 점수 기반 할인)

#### 10.1.1 비즈니스 모델

```
가치 제안:
  "Pickup에 가입한 기관의 차량 보험료를 OBD 안전 점수로 최대 15% 절감"

파트너십 구조:
  1. 보험사와 API 데이터 공유 협약 체결
  2. 기관이 보험사에 "Pickup 안전 리포트" 제출 → 보험료 할인
  3. Pickup은 보험사로부터 레퍼럴 수수료 또는 공동 마케팅 지원 수령

1차 목표 보험사:
  DB손해보험, 현대해상 (상업용 차량보험 강자)
  KB손해보험 (플리트 보험 전문)
```

#### 10.1.2 기술 구현

```
보험 연동 데이터 API (ENTERPRISE 전용):
  GET /api/v1/partner/insurance/safety_report
    Header: X-Partner-Key: {insurance_company_api_key}
    Params: institution_id, month
    Response: 기관 월간 안전 리포트 (JSON)
    {
      institution_id, period,
      risk_index, insurance_discount_rate,
      drivers: [{ driver_id, safety_score, event_summary }],
      vehicles: [{ vehicle_id, dtc_summary, mileage }]
    }

데이터 익명화:
  외부 보험사에 드라이버 개인 식별 정보(이름, 연락처) 미포함
  driver_id만 제공 (기관 내부 참조용)
  개인정보 보호법 준수

수익 모델:
  레퍼럴: 보험사가 Pickup 기관 소개로 계약 성사 시 1회성 수수료
  API 사용료: 보험사 월 조회 건수 기반 과금 (별도 협의)
```

### 10.2 정비소 네트워크 연동

#### 10.2.1 비즈니스 모델

```
가치 제안:
  DTC 발생 → Pickup이 근처 제휴 정비소 자동 추천 → 예약 연결

파트너십 구조:
  제휴 정비소: 예약 연결 건당 건당 수수료 5,000원 또는 월 고정 리스팅 비용
  기관 관리자: 원클릭 정비 예약 편의

1차 목표:
  보쉬 카 서비스 (전국 체인, B2B 경험)
  카카오모빌리티 정비 파트너 네트워크
```

#### 10.2.2 기술 구현

```
Admin Portal DTC 관리 화면 확장:
  DTC 알림 → "근처 제휴 정비소 추천" 버튼 (기관 주소 기준 3km 반경)
  정비소 카드: 이름, 전화번호, 예약 가능 일정, 리뷰
  온라인 예약: POST /api/v1/partner/garages/:id/reservations

신규 테이블:
  partner_garages (정비소 정보)
  garage_reservations (예약 이력)
  referral_rewards (수수료 트래킹)
```

### 10.3 카카오/네이버 내비게이션 고도화

```
현황:
  드라이버 앱 → 외부 앱(Tmap/카카오내비) URL Scheme 실행

고도화 (Epic 9 VRP 연계):
  최적화된 경로 좌표 배열을 내비앱에 Waypoint로 전달
  카카오내비 다중 경유지 URL Scheme:
    kakaomap://route?sp={lat},{lng}&ep={lat},{lng}&waypoints=[{lat},{lng},...]

  드라이버 앱 개선:
    VRP 최적화 결과 → 자동으로 다중 경유지 내비 실행
    기존: 수동으로 다음 승객 주소를 복사해서 내비 입력
    신규: [내비 시작] 버튼 → 모든 픽업 순서 자동 설정된 내비 실행
```

### 10.4 예상 공수

| 작업 | 내용 | 공수 |
|------|------|:----:|
| 보험 연동 API | 안전 리포트 API + 파트너 인증 | 5인일 |
| 정비소 네트워크 | 정비소 DB + 추천 + 예약 UI | 6인일 |
| 내비 고도화 | VRP 결과 → 다중 경유지 내비 연동 | 4인일 |
| **합계** | | **15인일** |

---

## 11. 전체 타임라인

### Stage 2 로드맵 (2026-03 ~ 2026-08, 6개월)

```
2026-03 (Month 1): 기반 완성
  Week 1-2: Epic 7 고도화 Phase A 완성 (안전 점수 API, BLE 안정화, FCM)
  Week 3-4: Epic 12 결제 시스템 (토스페이먼츠 연동 + 구독 라이프사이클)
  목표: 첫 유료 전환 기관 확보

2026-04 (Month 2): 보호자 앱 출시
  Week 1-2: Epic 8 백엔드 (인증, 위치, FCM, ETA)
  Week 3-4: Epic 8 앱 화면 개발 (React Native Expo)
  목표: 보호자 앱 TestFlight/Play Store 출시

2026-05 (Month 3): BI + QR 체크인
  Week 1-2: Epic 7 고도화 Phase B (Admin Portal 안전 대시보드 UI)
  Week 3-4: Epic 10 BI 대시보드 기본 (KPI 카드, 정시 도착률 트렌드)
  Week 3-4 병행: Epic 11 QR 체크인 (QR 생성 + 드라이버 앱 스캔)
  목표: PRO 플랜 기능 완성 → 업셀 공세

2026-06 (Month 4): AI VRP 시작 + BI 고도화
  Week 1-3: Epic 9 VRP 마이크로서비스 + 카카오 API 연동
  Week 2-4: Epic 10 BI 고도화 (기관 비교, 승객 이탈 분석)
  목표: ENTERPRISE 첫 계약 확보

2026-07 (Month 5): VRP 완성 + NFC
  Week 1-2: Epic 9 Admin Portal UI (경로 최적화 화면, 연료비 리포트)
  Week 3-4: Epic 11 NFC 지원 (ENTERPRISE) + 내비 다중 경유지 연동
  목표: ENTERPRISE 2~3개 계약

2026-08 (Month 6): 파트너십 + QA + 출시 준비
  Week 1-2: Epic 13 보험 연동 API (Could → 시장 반응 확인 후 진행)
  Week 3-4: 전체 QA, 성능 테스트, 문서화
  목표: Stage 2 KPI 달성 확인 (30개 기관, MRR 1,500만원)
```

### Stage 3 로드맵 (2026-09 ~ 2027-02, 6개월)

```
2026-09: OBD 고도화 Phase C (AI 예측 정비)
2026-10: OBD 고도화 Phase D (보험 리스크 리포트 고도화)
2026-11: Epic 13 정비소 네트워크 고도화 + 다중 지점 관리
2026-12: 운전 코칭 시스템 (Phase E) + 게이미피케이션
2027-01: 글로벌 확장 준비 (영문화, PG 다국화)
2027-02: Stage 3 KPI 검토 (100개 기관, ARR 6억원)
```

### 마일스톤 요약

| 마일스톤 | 날짜 | 조건 |
|---------|------|------|
| M1: 첫 유료 전환 | 2026-03 말 | 유료 결제 기관 1개 이상 |
| M2: 보호자 앱 출시 | 2026-04 말 | iOS/Android 스토어 배포 |
| M3: PRO 플랜 완성 | 2026-05 말 | PRO 기능 전체 QA 완료 |
| M4: ENTERPRISE 첫 계약 | 2026-06 말 | VRP + BI + OBD 패키지 계약 |
| M5: Stage 2 목표 달성 | 2026-08 말 | 30개 기관, MRR 1,500만원 |
| M6: Stage 3 시작 | 2026-09 | AI 고도화 + 글로벌 준비 |

---

## 12. 기술 아키텍처 고도화

### 12.1 현재 아키텍처 (MVP)

```
클라이언트:
  Admin Portal (Rails + 웹 브라우저)
  Driver App (React Native / Expo)

백엔드:
  Rails 8.1.2 API-only (단일 서버)
  SQLite3 + solid_cable (ActionCable 브로커)
  JWT 자체 인증

실시간:
  ActionCable WebSocket (GPS 위치)
```

### 12.2 Stage 2 아키텍처 변경사항

```
신규 컴포넌트:
  1. Passenger App (React Native / Expo) — Epic 8
  2. VRP Microservice (Python FastAPI + OR-Tools) — Epic 9
  3. Redis (캐시 레이어) — ETA 캐싱, 집계 결과 캐싱
  4. ActiveStorage — QR 이미지, PDF 리포트, 인보이스 파일
  5. solid_queue (Rails 8 내장 ActiveJob 백엔드)
     — FCM 비동기 발송, 구독 갱신 Job, VRP 계산 Job
  6. Toss Payments 연동 모듈

인프라 업그레이드 고려:
  현재: SQLite (단일 파일 DB, 단일 서버)
  Stage 2 기준: SQLite 유지 가능 (30개 기관, 동시 접속 ~100명)
  Stage 3 기준 (100개 기관 이상): PostgreSQL 마이그레이션 검토
    → Rails 8.1의 solid_cable / solid_queue는 PostgreSQL에서도 동작
    → 마이그레이션 시 ActiveRecord 마이그레이션만으로 전환 가능
```

### 12.3 아키텍처 다이어그램 (Stage 2)

```
[클라이언트 레이어]
  Admin Portal (Rails + Web)
  Driver App (React Native / Expo)
  Passenger App (React Native / Expo)  ← 신규
        |
        | HTTP/WebSocket (ActionCable)
        |
[Rails 8.1.2 API 서버]
  ├── API v1 Controllers
  ├── ActionCable Channels (실시간 GPS)
  ├── ActiveJob (solid_queue)  ← FCM, 구독갱신, VRP
  ├── ActionMailer
  └── ActiveStorage
        |
        ├── SQLite3 (메인 DB)
        ├── Redis (ETA 캐시, 집계 캐시)
        └── HTTP → [VRP Service]  ← 신규
                    Python FastAPI
                    OR-Tools
                    카카오 Directions API
        |
  [외부 서비스]
  ├── Google FCM (푸시 알림)
  ├── Toss Payments (결제)   ← 신규
  ├── 카카오 Directions API  ← 신규
  └── (Stage 3) 보험사 파트너 API
```

### 12.4 성능 기준 (Stage 2 목표)

| 항목 | 기준 |
|------|------|
| API 응답 시간 | P99 < 500ms |
| WebSocket GPS 업데이트 지연 | < 2초 |
| 보호자 앱 ETA 갱신 | 60초 캐시 TTL 기준 |
| VRP 최적화 응답 | < 5초 (30명 승객 기준) |
| FCM 푸시 발송 | 비동기 처리, 30초 이내 도달 |
| BI 대시보드 로딩 | P95 < 3초 (Redis 캐시 활용) |
| 동시 접속 지원 | 100명 (Stage 2), 500명 (Stage 3) |

---

## 13. 리스크 및 완화 방안

| 리스크 | 영향도 | 발생 가능성 | 완화 방안 |
|--------|:------:|:-----------:|----------|
| SQLite 동시성 한계 | 높음 | 중간 | Stage 3 PostgreSQL 마이그레이션 계획 수립. Stage 2 기간 내 모니터링 강화 |
| VRP 마이크로서비스 운영 복잡성 | 중간 | 중간 | 초기 Python 컨테이너(Docker)로 격리. 장애 시 직선거리 ETA fallback 자동 전환 |
| 카카오 Directions API 비용 초과 | 중간 | 낮음 | Redis TTL 60초 캐시. 월 30만 호출 초과 예상 시 직선거리 fallback |
| 승객 앱 iOS 푸시 알림 승인 지연 | 높음 | 낮음 | APNs 인증서 사전 발급 (2주 여유). ADP(Apple Developer Program) 유지 |
| 토스페이먼츠 API 연동 이슈 | 중간 | 낮음 | 개발 환경에서 테스트 결제 충분히 검증. fallback: 계좌이체 수동 처리 |
| QR 코드 복사/위변조 | 중간 | 낮음 | HMAC-SHA256 일일 유효 서명. trip_id + passenger_id 중복 체크인 방지 |
| 보험사 파트너십 협상 지연 | 중간 | 높음 | Could 우선순위 유지. 협상 독립적으로 진행하되 API는 선구현 후 협약 체결 |
| 개인정보 보호법 위반 | 높음 | 낮음 | 외부 파트너 API에 익명화 데이터만 제공. 개인정보 처리방침 업데이트 |
| 파일럿 기관 유료 전환 거부 | 높음 | 중간 | BASIC 30만원 → 시장 반응 테스트 후 조정. 3개월 무료 연장 협상 여지 확보 |

---

## 14. 투자 대비 수익 분석 (ROI)

### 14.1 Stage 2 개발 투자

```
총 개발 공수: 138인일 (Must 56 + Should 53 + Could 29)
1인일 비용 기준: 50만원 (시니어 개발자)

총 개발 비용 추정:
  Must 56인일 × 50만원 = 2,800만원
  Should 53인일 × 50만원 = 2,650만원
  Could (선택) 29인일 × 50만원 = 1,450만원
  합계: Must+Should 기준 5,450만원

외부 서비스 비용:
  토스페이먼츠: 결제 수수료 2.2% (매출 기준)
  카카오 Directions API: 월 최대 10만원 (캐싱 최적화 기준)
  Firebase FCM: 무료 (10만 메시지/월 이내)
  VRP 서버: 월 5만원 (소형 VPS)
  합계: 월 15~20만원 고정 + 결제 수수료
```

### 14.2 수익 회수 시나리오

```
Stage 2 목표 달성 시 (30개 기관, MRR 1,500만원):
  연간 매출 = 1,800만원/월 (성장 고려)
  개발 투자비 회수: 약 3~4개월 후 BEP 달성

단위 경제학 (Unit Economics):
  BASIC 기관: LTV(3년) = 30만 × 36 = 1,080만원
  PRO 기관: LTV(3년) = 80만 × 36 = 2,880만원
  ENTERPRISE: LTV(3년) = 200만 × 36 = 7,200만원

  CAC (고객 획득 비용) 목표: < 50만원/기관
  LTV:CAC 목표: BASIC 21:1, PRO 57:1, ENTERPRISE 144:1
```

### 14.3 Epic별 ROI 우선순위

| Epic | 개발 비용 | 수익 기여 | ROI 등급 |
|------|:--------:|:--------:|:-------:|
| Epic 12 (결제) | 600만원 | 수익 발생 전제 | S (필수) |
| Epic 8 (보호자 앱) | 1,000만원 | PRO 업셀 주 트리거 | A |
| Epic 10 (BI 대시보드) | 900만원 | Lock-in 강화 + ENTERPRISE 업셀 | A |
| Epic 11 (QR/NFC) | 500만원 | PRO 차별화 + NFC 수수료 수익 | A |
| Epic 9 (VRP) | 1,250만원 | ENTERPRISE 전환 핵심 | B |
| Epic 13 (파트너십) | 750만원 | 신규 수익원 (장기) | C |

---

## 관련 문서

- Epic 1~5 기본 구현: [`docs/epics/README.md`](./README.md)
- Epic 6 설계: [`docs/epics/epic-06-passenger-mobile-app.md`](./epic-06-passenger-mobile-app.md)
- Epic 7 고도화: [`docs/epics/epic-07-advanced-obd2.md`](./epic-07-advanced-obd2.md)
- OBD Gap Analysis: [`docs/03-analysis/epic-07-obd2-integration.analysis.md`](../03-analysis/epic-07-obd2-integration.analysis.md)
- 아키텍처: [`docs/architecture.md`](../architecture.md)
- API 스펙: [`docs/api-spec.md`](../api-spec.md)

---

## 버전 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-02-28 | 초안 작성 — Stage 2 전체 고도화 기획 | Claude (Gagahoho Inc.) |

---

**작성자**: Claude (Product Manager, Gagahoho Inc.)
**검토 요청**: 대표님 — 구독 플랜 가격 및 Epic 우선순위 최종 확인 필요
