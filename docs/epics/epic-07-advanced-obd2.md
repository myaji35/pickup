# Epic 7 고도화: OBD-II 통합 고도화 (Advanced OBD-II Integration)

> **Summary**: Gap Analysis 기반 미구현 항목 완성 + AI 예측 정비 · 안전 코칭 · 보험 연동으로 OBD-II를 핵심 수익 기능으로 고도화
>
> **Project**: Pickup MaaS Platform
> **Version**: 2.0
> **Author**: Claude (Senior Fullstack Engineer, Gagahoho Inc.)
> **Date**: 2026-02-28
> **Status**: Draft
> **Based On**: epic-07-obd2-integration.md (v1.0) + epic-07-obd2-integration.analysis.md (Match Rate 63%)

---

## 1. 개요

### 1.1 목적

Epic 7 기본 구현(OBD-II BLE 연결, PID 수집, 안전 이벤트 감지, Rails API)이 완료된 상태에서,
Gap Analysis 결과 드러난 **6개 핵심 미구현 항목**을 완성하고,
**5개 고도화 영역**(안전 점수 · 관리자 대시보드 · AI 예측정비 · 보험연동 · 운전 코칭)을 추가하여
OBD-II를 Pickup MaaS의 **프리미엄 수익 드라이버**로 전환한다.

### 1.2 배경 및 현황

```
현재 상태 (Epic 7 기본 구현 완료):
  BLE 연결 + PID 수집         ✅ 완료
  안전 이벤트 감지 / 저장     ✅ 완료
  DTC 보고 + 실시간 알림      ✅ 완료
  안전 대시보드 API            ✅ 완료 (백엔드)

Gap Analysis 주요 미구현 항목:
  driver_safety_scores DB/API  ❌ 미구현 (영향도: 높음)
  Admin Portal 안전 대시보드  ❌ 미구현 (영향도: 높음)
  백그라운드 BLE 유지          ❌ 미구현 (영향도: 높음)
  FCM Push 알림               ❌ 미구현 (영향도: 중간)
  DTC 한글 설명 DB            ❌ 미구현 (영향도: 중간)
  자동 재연결 3회 로직         ❌ 미구현 (영향도: 낮음)
```

### 1.3 관련 문서

- 기본 설계: [epic-07-obd2-integration.md](./epic-07-obd2-integration.md)
- Gap 분석: [epic-07-obd2-integration.analysis.md](../03-analysis/epic-07-obd2-integration.analysis.md)
- 아키텍처: [architecture.md](../architecture.md)
- API 스펙: [api-spec.md](../api-spec.md)

---

## 2. 범위

### 2.1 In Scope

#### Phase A: Gap 완성 (1~2주, Must)

- [ ] 드라이버 안전 점수 시스템 (`driver_safety_scores` 테이블 + 산출 API)
- [ ] 백그라운드 BLE 유지 (`expo-task-manager` 통합)
- [ ] FCM Push 알림 (DTC 감지 → 기관 관리자 모바일)
- [ ] DTC 한글 설명 DB (약 3,000개 표준 코드 시드 데이터)
- [ ] 자동 재연결 3회 + 지수 백오프
- [ ] Trip 통계 컬럼 집계 (`avg_speed`, `max_speed`, `fuel_consumed`)

#### Phase B: 관리자 안전 대시보드 UI (2~3주, Must)

- [ ] 드라이버 안전 점수 랭킹 화면 (Admin Portal React)
- [ ] 안전 이벤트 히트맵 (지도 + 이벤트 레이어)
- [ ] 운행별 속도 프로파일 차트
- [ ] DTC 알림 관리 화면 (acknowledge 워크플로우)
- [ ] 월간 안전 리포트 PDF 다운로드

#### Phase C: AI 예측 정비 (3~4주, Should)

- [ ] OBD 데이터 패턴 분석 서비스 (Rails 백그라운드 Job)
- [ ] 정비 시기 예측 모델 (규칙 기반 1차 → ML 2차)
- [ ] 이상 징후 조기 경보 알림 채널

#### Phase D: 보험 · 리스크 관리 연동 (3~4주, Should)

- [ ] 안전 점수 기반 보험료 할인 계산 API
- [ ] 기관별 사고 리스크 지수 산출
- [ ] 리스크 리포트 생성 (기관 구독 월간 자동 발송)

#### Phase E: 운전 코칭 시스템 (2~3주, Could)

- [ ] 드라이버 앱 실시간 음성/시각 피드백
- [ ] 주간 코칭 리포트 (드라이버 개인 뷰)
- [ ] 게이미피케이션 (배지 · 랭킹 · 인센티브 연동)

### 2.2 Out of Scope

- OBD-II 하드웨어 직접 제조 / 공급망 관리
- 차량 제조사별 독점 프로토콜 (현대 HKMC 비표준 PID) — Epic 8 이관
- 실시간 도로 제한속도 API 연동 (TMAP/카카오) — Phase D 이후 별도 검토
- 보험사 직접 API 연동 계약 — 1차는 리포트 출력 형식으로 제공
- 사고 영상 블랙박스 연동

---

## 3. 요구사항

### 3.1 기능 요구사항

#### FR-Phase-A: Gap 완성

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|:--------:|:----:|
| FR-A01 | `driver_safety_scores` 테이블 생성 (user_id, week_start, score, 이벤트 카운터) | Must | 미구현 |
| FR-A02 | 운행 종료 시 SafetyScoreService 자동 실행 → 주간 점수 갱신 | Must | 미구현 |
| FR-A03 | GET /api/v1/institutions/safety/scores?week=YYYY-MM-DD 엔드포인트 | Must | 미구현 |
| FR-A04 | expo-task-manager 기반 백그라운드 BLE 유지 (iOS + Android) | Must | 미구현 |
| FR-A05 | FCM 토큰 등록 + DTC 감지 시 Push 알림 전송 | Must | 미구현 |
| FR-A06 | DTC 코드 3,000개 한글 설명 시드 데이터 + 조회 API | Must | 미구현 |
| FR-A07 | BLE 자동 재연결 3회 + 지수 백오프 (1s → 2s → 4s) | Must | 미구현 |
| FR-A08 | Trip 종료 시 avg_speed · max_speed · fuel_consumed 집계 저장 | Must | 미구현 |

#### FR-Phase-B: Admin Portal 대시보드 UI

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|:--------:|:----:|
| FR-B01 | 기사별 주간 안전 점수 랭킹 카드 (점수 · 이벤트 수 · 트렌드 배지) | Must | 미구현 |
| FR-B02 | 안전 이벤트 히트맵 지도 (급가속/급제동/과속 마커 레이어) | Must | 미구현 |
| FR-B03 | 운행별 속도 프로파일 라인 차트 (시간 축 vs 속도/RPM 이중 Y축) | Must | 미구현 |
| FR-B04 | DTC 알림 관리 테이블 (pending → acknowledged → resolved 상태 전환 UI) | Must | 미구현 |
| FR-B05 | 월간 안전 리포트 PDF 다운로드 (기관별 · 기사별) | Should | 미구현 |
| FR-B06 | 실시간 차량 OBD 상태 패널 (RPM · 냉각수 온도 · 연료량 게이지) | Should | 미구현 |

#### FR-Phase-C: AI 예측 정비

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|:--------:|:----:|
| FR-C01 | OBD 누적 데이터 기반 부품별 잔여 수명 계산 (규칙 기반) | Should | 신규 |
| FR-C02 | 정비 시기 예측 알림 (브레이크 · 엔진오일 · 타이어) | Should | 신규 |
| FR-C03 | DTC 반복 패턴 감지 → 구조적 결함 조기 경보 | Should | 신규 |
| FR-C04 | 차량별 정비 이력 CRUD + 정비소 연락처 관리 | Could | 신규 |

#### FR-Phase-D: 보험 · 리스크 관리

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|:--------:|:----:|
| FR-D01 | 드라이버 안전 점수 → 보험료 할인율 계산 API | Should | 신규 |
| FR-D02 | 기관별 월간 사고 리스크 지수 산출 (이벤트 빈도 · DTC · 주행 거리 가중) | Should | 신규 |
| FR-D03 | 리스크 리포트 PDF 자동 생성 + 이메일 발송 (월 1회) | Should | 신규 |
| FR-D04 | 보험사 제출용 운행 데이터 내보내기 (CSV/JSON) | Could | 신규 |

#### FR-Phase-E: 운전 코칭

| ID | 요구사항 | 우선순위 | 상태 |
|----|----------|:--------:|:----:|
| FR-E01 | 드라이버 앱 운행 중 실시간 피드백 (안전 이벤트 발생 시 시각/진동 알림) | Could | 신규 |
| FR-E02 | 드라이버 개인 주간 코칭 리포트 (앱 내 화면) | Could | 신규 |
| FR-E03 | 게이미피케이션 배지 시스템 (연속 안전 운전 일수 · 이벤트 0회 달성) | Could | 신규 |
| FR-E04 | 인센티브 연동 API (기관이 안전 점수 기준으로 드라이버 보너스 설정) | Won't | 향후 |

### 3.2 비기능 요구사항

| 카테고리 | 기준 | 측정 방법 |
|----------|------|----------|
| 성능 | 안전 점수 API 응답 < 300ms (인덱스 적용 후) | k6 부하 테스트 |
| 성능 | 히트맵 지도 초기 렌더링 < 2초 (이벤트 1,000건 기준) | Lighthouse |
| 신뢰성 | 백그라운드 BLE 유지율 > 95% (iOS/Android 각각) | 실기기 8시간 운행 테스트 |
| 신뢰성 | FCM 알림 전송 성공률 > 98% | Firebase Analytics |
| 보안 | 운전 습관 데이터 전송 TLS 1.3 필수 | SSL Labs A+ |
| 보안 | driver_safety_scores는 기관 범위 내 데이터만 조회 | RSpec scope 테스트 |
| 법규 | 운전 습관 데이터 보존 90일 후 자동 익명화 | 배치 Job 검증 |
| 확장성 | 안전 점수 집계 Job이 드라이버 1,000명 기준 5분 내 완료 | ActiveJob 벤치마크 |

---

## 4. 성공 기준

### 4.1 완료 정의 (Definition of Done)

- [ ] Phase A: Gap Analysis 6개 항목 모두 ✅ (Match Rate 63% → 90% 이상)
- [ ] Phase B: Admin Portal 안전 대시보드 5개 화면 QA 통과
- [ ] Phase C: 정비 예측 정확도 검증 (실제 정비 이력 기준 재현율 70% 이상)
- [ ] Phase D: 리스크 리포트 PDF 생성 E2E 테스트 통과
- [ ] Phase E: 코칭 리포트 드라이버 앱 실기기 검증
- [ ] 전체 RSpec 테스트 커버리지 80% 이상
- [ ] SLDS 스타일 가이드 준수 (아이콘 Feather Icons SVG 전환 포함)

### 4.2 비즈니스 성공 지표

| 지표 | 현재 | 목표 (6개월) |
|------|------|-------------|
| OBD 기능 활성 기관 비율 | 0% | 40% 이상 |
| PRO/ENTERPRISE 플랜 전환율 | 측정 불가 | +15%p |
| 기사 평균 안전 점수 개선 (6개월) | 미측정 | +10점 |
| 관리자 대시보드 주간 활성 사용자 | 0 | 전체 기관 관리자의 60% |
| DTC 발생 후 평균 정비 소요 시간 | 미측정 | 현재 대비 30% 단축 |

---

## 5. 스토리

### Story A-1: 드라이버 안전 점수 시스템 구축

**Actor**: 시스템 (자동) + 기관 관리자
**목표**: 주간/월간 안전 점수 자동 산출 및 API 제공

#### 5.1.1 안전 점수 산출 알고리즘

```
[기본 점수 100점 / 주간 기준]

감점 규칙:
  harsh_accel 1회  → -2점
  harsh_brake 1회  → -3점
  speeding 1회     → -5점
  idling 5분 초과  → -1점 (5분당)

가산 규칙 (보너스):
  이벤트 0건 주간  → +5점 (상한 100점)
  연속 3주 90점 이상 → "안전 운전자" 배지

점수 등급:
  90~100점: A (안전 운전자)
  75~89점:  B (양호)
  60~74점:  C (주의 필요)
  60점 미만:  D (관리 필요 → 기관 자동 알림)
```

#### 5.1.2 구현 단계

1. **DB**: `driver_safety_scores` 마이그레이션 + `monthly_scores` 뷰 생성
2. **Service**: `SafetyScoreCalculatorService` — 운행 종료 트리거 기반 점수 갱신
3. **Job**: `WeeklySafetyScoreJob` — 매주 월요일 00:10 전주 점수 확정 + 주간 리포트 이메일 발송
4. **API**: GET /api/v1/institutions/safety/scores (주간 랭킹), GET .../drivers/:id/score_trend (13주 트렌드)
5. **인센티브 연동**: 기관별 인센티브 금액 설정 테이블 + 점수 기준 지급 대상 필터 API

#### 5.1.3 데이터 모델

```ruby
# 신규 마이그레이션
create_table :driver_safety_scores do |t|
  t.references :user,        null: false, foreign_key: true   # 드라이버
  t.references :institution, null: false, foreign_key: true   # 기관 범위 보안
  t.date       :week_start,  null: false                       # 월요일 기준
  t.integer    :score,       default: 100, null: false
  t.integer    :harsh_accel_count, default: 0
  t.integer    :harsh_brake_count, default: 0
  t.integer    :speeding_count,    default: 0
  t.integer    :idling_minutes,    default: 0
  t.integer    :total_trips,       default: 0
  t.decimal    :total_distance,    precision: 8, scale: 2, default: 0
  t.string     :grade             # A / B / C / D
  t.timestamps
  t.index [:user_id, :week_start], unique: true
end

# 월간 집계 (뷰 또는 별도 테이블)
create_table :driver_monthly_scores do |t|
  t.references :user, null: false, foreign_key: true
  t.references :institution, null: false, foreign_key: true
  t.integer    :year
  t.integer    :month
  t.decimal    :avg_score, precision: 5, scale: 2
  t.integer    :best_week_score
  t.string     :trend  # improving / stable / declining
  t.timestamps
end
```

#### 5.1.4 완료 조건

- `SafetyScoreCalculatorService` 단위 테스트 (엣지 케이스: 이벤트 0건, 100점 초과 방지)
- GET /safety/scores API 기관 범위 격리 검증 (기관 A 관리자가 기관 B 데이터 조회 불가)
- 주간 Job 멱등성 검증 (동일 주 중복 실행 시 점수 중복 집계 없음)

**예상 공수**: 3인일

---

### Story A-2: 백그라운드 BLE 유지 + 자동 재연결

**Actor**: 드라이버 (앱 백그라운드 전환 시)
**목표**: 운행 중 앱 백그라운드 전환 시에도 OBD 데이터 수집 지속

#### 5.2.1 기술 구현 방향

```
현재 문제:
  앱 → 백그라운드 → iOS/Android BLE 연결 종료 → OBD 데이터 수집 중단

해결 방안:
  expo-task-manager + expo-background-fetch 조합
    - iOS: UIBackgroundModes에 bluetooth-central 추가 (app.json)
    - Android: foreground service로 BLE 유지

구현 아키텍처:
  TaskManager.defineTask('BACKGROUND_OBD_TASK', async () => {
    const ble = await ObdService.getInstance();
    if (!ble.isConnected()) await ble.reconnect();
    const data = await ble.pollPids();
    await tripApi.sendObdSnapshot(data);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  });

폴링 간격:
  포그라운드: 5초 (기존 유지)
  백그라운드: 15초 (iOS 백그라운드 제약 준수, 배터리 최적화)
```

#### 5.2.2 자동 재연결 로직

```typescript
// ObdService.ts 개선
const MAX_RECONNECT = 3;
const BACKOFF_BASE_MS = 1000;

async reconnectWithBackoff(): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_RECONNECT; attempt++) {
    try {
      await this.connectOrScan();
      return true;
    } catch (e) {
      if (attempt < MAX_RECONNECT) {
        await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt - 1));
      }
    }
  }
  // 3회 실패 시 NotificationService로 드라이버 앱 내 알림
  NotificationService.alert('OBD 연결 실패', '기기를 확인해 주세요');
  return false;
}
```

#### 5.2.3 구현 단계

1. `app.json` iOS/Android 백그라운드 모드 권한 추가
2. `ObdBackgroundTask.ts` — expo-task-manager 태스크 정의
3. `ObdService.ts` — `reconnectWithBackoff()` 구현 (3회 + 지수 백오프)
4. 실기기 테스트: iPhone 14 + Android 13 기준 8시간 백그라운드 유지 검증

#### 5.2.4 완료 조건

- iOS 시뮬레이터 + 실기기에서 앱 백그라운드 전환 후 15초 내 OBD 재폴링 확인
- 재연결 3회 실패 시 드라이버 알림 + 서버 로그 기록
- 배터리 소모량: 백그라운드 OBD 유지 시 1시간당 5% 이하

**예상 공수**: 2인일

---

### Story A-3: FCM Push 알림 + DTC 한글 설명 DB

**Actor**: 시스템 → 기관 관리자 (모바일)
**목표**: DTC 감지 시 관리자 스마트폰으로 즉시 Push 알림, 한글 DTC 설명 제공

#### 5.3.1 FCM 통합 아키텍처

```
흐름:
  드라이버 앱 → POST /trips/:id/report_dtc
  → Rails DtcReportService
  → FcmNotificationService.notify_institution_admins(dtc:, institution:)
  → Google FCM API (HTTP v1)
  → 기관 관리자 스마트폰 (Admin 모바일 앱 or PWA)

구현 파일:
  pickup_rails/app/services/fcm_notification_service.rb
  pickup_rails/app/jobs/send_dtc_notification_job.rb (ActiveJob, 비동기)

관리자 FCM 토큰:
  admin_users 테이블에 fcm_token 컬럼 추가
  관리자 Admin Portal 로그인 시 토큰 등록 API:
    POST /api/v1/admin/fcm_token { token: "..." }
```

#### 5.3.2 DTC 한글 설명 DB

```
구현 방법:
  옵션 1 (권장): seeds/dtc_codes.yml — 3,000개 YAML 로드
  옵션 2: dtc_codes 테이블 (code, description_ko, severity: info/warning/critical)

우선 커버 범위:
  P0xxx: 파워트레인 표준 코드 (1,200개) — 가장 빈번
  P1xxx: 제조사 특정 파워트레인 (주요 300개)
  B, C, U 코드: 200개 선별

테이블 구조:
  create_table :dtc_codes do |t|
    t.string  :code, null: false, index: { unique: true }  # "P0420"
    t.string  :description_ko, null: false                  # "촉매 변환기 효율 저하 (뱅크 1)"
    t.string  :description_en
    t.string  :severity   # info / warning / critical
    t.string  :system     # engine / transmission / abs / body / network
    t.text    :action_guide_ko                               # 권고 조치 (한국어)
    t.timestamps
  end

API:
  GET /api/v1/dtc_codes/:code
  → { code: "P0420", description_ko: "...", severity: "warning", action_guide_ko: "..." }
```

#### 5.3.3 구현 단계

1. Google Firebase 프로젝트 설정 + 서비스 계정 키 발급
2. `admin_users` 테이블 `fcm_token` 컬럼 마이그레이션
3. `FcmNotificationService` 구현 (HTTP v1 API, `google-auth-library` gem)
4. `SendDtcNotificationJob` — ActiveJob + Sidekiq 큐 처리
5. DTC 시드 데이터 YAML 작성 (P0xxx 우선 1,200개)
6. `dtc_codes` 테이블 + 조회 API 구현

**예상 공수**: 3인일 (FCM 2인일 + DTC DB 1인일)

---

### Story B-1: Admin Portal 안전 대시보드 UI

**Actor**: 기관 관리자 (Admin Portal Web)
**목표**: 실시간 차량 OBD 상태 · 안전 이벤트 시각화 · 드라이버 점수 관리 화면 제공

#### 5.4.1 화면 구성 (SLDS 3-Column Layout)

```
[Admin Portal 안전 대시보드 레이아웃]

┌─────────────────────────────────────────────────────────────────┐
│  HEADER: 기관명 · 날짜 선택 · 내보내기 버튼 (Feather: download)  │
├─────────────┬───────────────────────────────┬───────────────────┤
│  LEFT NAV   │   MAIN WORKSPACE              │  RIGHT SIDEBAR    │
│             │                               │                   │
│  - 대시보드  │  [KPI 카드 4개: 상단 고정]    │  실시간 차량 OBD  │
│  - 드라이버  │  - 평균 안전 점수             │  상태 패널        │
│  - 차량      │  - 금주 이벤트 수             │  ─────────────    │
│  - DTC 관리  │  - D등급 드라이버 수          │  RPM 게이지       │
│  - 리포트    │  - DTC 미처리 건수            │  냉각수 온도      │
│             │                               │  연료 잔량        │
│             │  [탭 전환]                    │  속도 (OBD)       │
│             │  탭1: 드라이버 점수 랭킹       │                   │
│             │  탭2: 이벤트 히트맵           │  DTC 활성 경고    │
│             │  탭3: 속도 프로파일           │  ─────────────    │
│             │  탭4: DTC 관리               │  [목록]           │
└─────────────┴───────────────────────────────┴───────────────────┘
```

#### 5.4.2 핵심 컴포넌트

**탭1: 드라이버 점수 랭킹**
```
컴포넌트: SafetyScoreRankingTable
데이터: GET /api/v1/institutions/safety/scores?week=YYYY-MM-DD

표시 항목:
  순위 | 드라이버명 | 점수 | 등급 배지 | 급가속 | 급제동 | 과속 |
        전주 대비 트렌드 화살표 (Feather: trending-up / trending-down)

인터랙션:
  - 드라이버 행 클릭 → 13주 트렌드 모달
  - 등급 D 행: 빨간 배경 하이라이트 + 알림 버튼
  - 기간 선택: 이번 주 / 저번 주 / 이번 달 토글
```

**탭2: 이벤트 히트맵**
```
컴포넌트: SafetyEventHeatmap (react-native-maps 대신 Leaflet.js 또는 Kakao Maps SDK)
데이터: GET /api/v1/institutions/safety/events?date_from=&date_to=&event_type=

마커 레이어:
  harsh_accel → 주황 원 마커 (Feather: zap)
  harsh_brake → 빨간 원 마커 (Feather: alert-triangle)
  speeding    → 보라 원 마커 (Feather: fast-forward)
  idling      → 회색 원 마커 (Feather: clock)

필터 패널:
  드라이버 선택 (멀티셀렉트)
  이벤트 타입 체크박스
  날짜 범위 DatePicker
```

**탭3: 속도 프로파일**
```
컴포넌트: TripSpeedChart (Recharts 또는 Chart.js)
데이터: GET /api/v1/institutions/safety/events?trip_id=&include_obd=true

차트 구성:
  X축: 운행 시간 (분)
  Y축 (왼쪽): 속도 km/h (파란 라인)
  Y축 (오른쪽): RPM (주황 라인)
  오버레이: 이벤트 발생 지점 수직선 + 레이블

인터랙션:
  운행 목록 드롭다운 → 선택 시 차트 갱신
  마우스 오버 → 툴팁 (시간, 속도, RPM, 이벤트)
```

**탭4: DTC 관리**
```
컴포넌트: DtcManagementTable
데이터: GET /api/v1/institutions/safety/dtc_history

표시 항목:
  DTC 코드 | 한글 설명 | 심각도 배지 | 차량 | 드라이버 | 발생일 | 상태

상태 전환 워크플로우:
  pending   → [확인] 버튼 → acknowledged (PATCH acknowledge_dtc)
  acknowledged → [완료] 버튼 → resolved (정비 완료 일자 입력 모달)

심각도별 배지 색상:
  critical → 빨간 (#E74C3C)
  warning  → 노란 (#F39C12)
  info     → 파란 (#3498DB)
```

#### 5.4.3 구현 단계

1. Admin Portal React 라우팅 추가: `/safety` 대시보드 라우트
2. KPI 카드 컴포넌트 (4개) — 기존 카드 스타일 재사용
3. 탭1: SafetyScoreRankingTable — 정렬 · 필터 · 모달 트렌드 차트
4. 탭2: SafetyEventHeatmap — 지도 라이브러리 선택 후 마커 레이어 구현
5. 탭3: TripSpeedChart — Recharts 이중 Y축 라인 차트
6. 탭4: DtcManagementTable — 상태 전환 워크플로우
7. Right Sidebar: 실시간 OBD 상태 패널 (ActionCable 구독)
8. PDF 다운로드: Rails `WickedPDF` or `Prawn` 기반 월간 리포트 생성

**예상 공수**: 8인일

---

### Story C-1: AI 기반 예측 정비 시스템

**Actor**: 시스템 (자동) + 기관 관리자
**목표**: OBD 누적 데이터 패턴 분석으로 부품 교체 시기를 미리 예측하고 알림 발송

#### 5.5.1 예측 정비 모델 (1차: 규칙 기반)

```
[부품별 예측 규칙]

1. 브레이크 패드 수명 예측:
   - 누적 harsh_brake 이벤트 횟수 + 총 주행 거리 기반
   - 기준: 신규 장착 후 harsh_brake 800회 OR 50,000km 주행 시 교체 권고
   - 잔여: (800 - harsh_brake_count) / 평균_주간_harsh_brake × 7일

2. 엔진 오일 교환 예측:
   - 누적 idling_minutes + 고온 주행 이력 (coolant_temp > 100°C 빈도) 보정
   - 기준: 표준 5,000km → idling 과다 시 4,000km로 단축
   - DTC P0521(오일 압력 센서) 반복 → 즉시 교환 권고

3. 타이어 마모도 예측:
   - 누적 (harsh_accel + harsh_brake + speeding 이벤트) 가중 주행 거리
   - 기준: 40,000km 교체 기준 → 이벤트 가중치로 잔여 거리 단축

4. 배터리 상태 (차량 12V):
   - RPM 공회전 시 전압 불안정 패턴 감지 (향후 추가 PID: PID 42)
```

#### 5.5.2 데이터 모델

```ruby
# 정비 예측 테이블
create_table :maintenance_predictions do |t|
  t.references :vehicle,      null: false, foreign_key: true
  t.string     :component     # brake_pad / engine_oil / tire / battery
  t.date       :predicted_date                # 예측 교체일
  t.integer    :confidence_pct                # 예측 신뢰도 (%)
  t.string     :trigger_reason               # 규칙 트리거 이유
  t.string     :status        # active / notified / dismissed / completed
  t.timestamps
end

# 정비 이력 테이블
create_table :maintenance_records do |t|
  t.references :vehicle,       null: false, foreign_key: true
  t.string     :component
  t.date       :serviced_at, null: false
  t.text       :notes
  t.string     :garage_name
  t.decimal    :cost_krw, precision: 10, scale: 2
  t.timestamps
end
```

#### 5.5.3 구현 단계

1. `MaintenancePredictionService` — 규칙 기반 엔진 (PredictionRule 모듈 패턴)
2. `MaintenancePredictionJob` — 매일 03:00 전체 차량 예측 갱신
3. 예측 결과 Admin Portal 표시 (차량 상세 탭 → 예측 정비 섹션)
4. 교체 시기 D-30/D-7 자동 알림 (FCM + 이메일)
5. 정비 이력 CRUD API + Admin Portal UI (탭 추가)

**예상 공수**: 5인일

---

### Story D-1: 보험 · 리스크 관리 리포트

**Actor**: 기관 관리자 + 보험사 (간접)
**목표**: 안전 점수 데이터로 보험료 할인 근거 및 리스크 리포트를 자동 생성

#### 5.6.1 리스크 지수 산출 공식

```
기관 월간 리스크 지수 (0~100, 높을수록 위험):

Risk Index = (
  (speeding_events / total_trips × 30) +      # 과속 빈도 30%
  (harsh_brake_events / total_trips × 25) +    # 급제동 빈도 25%
  (harsh_accel_events / total_trips × 15) +    # 급가속 빈도 15%
  (dtc_critical_count × 5) +                   # 심각 DTC 건수 5점씩
  (grade_d_driver_ratio × 100 × 25)            # D등급 드라이버 비율 25%
) / total_trips × normalization_factor

보험료 할인율 매핑:
  Risk Index 0~20  → 15% 할인 (최우수)
  Risk Index 21~40 → 10% 할인
  Risk Index 41~60 → 5% 할인
  Risk Index 61~80 → 표준 (할인 없음)
  Risk Index 81~100 → 할증 검토 대상
```

#### 5.6.2 리포트 구성

```
[월간 리스크 리포트 PDF 구조]

1. 요약 페이지
   - 기관명 · 기간 · 리스크 지수 게이지 차트
   - 보험료 예상 할인율 박스

2. 드라이버별 안전 점수 테이블 (전월 대비 변화)

3. 이벤트 통계
   - 유형별 발생 횟수 바 차트
   - 시간대별 이벤트 히트맵 (오전/오후/심야)

4. DTC 발생 이력 요약 + 정비 완료 여부

5. 예측 정비 권고 목록

6. 면책 문구
   "본 리포트는 OBD-II 수집 데이터 기반 참고 자료이며,
    법적 구속력이 없습니다. 정비는 전문 정비사 확인 권고."
```

#### 5.6.3 구현 단계

1. `RiskIndexCalculatorService` — 기관별 월간 리스크 지수 산출
2. `InsuranceDiscountService` — 리스크 지수 → 할인율 변환 API
3. `MonthlyRiskReportJob` — 매월 1일 리포트 생성 + PDF 파일 저장 (ActiveStorage)
4. 리포트 PDF: `Prawn` gem 기반 한국어 폰트 (NanumGothic) 적용
5. 이메일 발송: `ReportMailer` — 기관 대표 이메일 자동 발송
6. Admin Portal: 리포트 목록 + 다운로드 UI

**예상 공수**: 5인일

---

### Story E-1: 운전 코칭 시스템 (드라이버 앱)

**Actor**: 드라이버 (드라이버 앱 사용자)
**목표**: 실시간 피드백 + 주간 코칭 리포트 + 게이미피케이션으로 안전 운전 행동 유도

#### 5.7.1 실시간 피드백 UX

```
[이벤트 발생 시 드라이버 앱 반응]

harsh_brake 감지 시:
  → 진동 (Haptics.notificationAsync)
  → 화면 상단 Banner: "급제동 감지됨 - 안전 거리 유지를 권장합니다"
  → 배너 자동 닫힘 3초 후

speeding 감지 시:
  → 빨간 속도계 테두리 강조
  → 진동 + 짧은 경고음
  → TTS(Text-to-Speech): "속도를 줄여주세요" (선택적, 기본 비활성)

harsh_accel:
  → 주황 배너 + 진동

이벤트 발생 빈도가 높을 때 (30분 내 5회 이상):
  → 운행 중 휴식 권고 메시지
```

#### 5.7.2 주간 코칭 리포트 화면

```
드라이버 앱 내 [내 기록] 탭:

상단 카드: 이번 주 안전 점수 + 등급 배지
하단 섹션:
  - 이번 주 이벤트 요약 (유형별 카운트)
  - 전주 대비 개선/악화 표시
  - 개선 팁 (이벤트 유형에 따른 맞춤 가이드)
    예: 급제동이 많은 경우 → "앞차와 안전 거리 3초 유지"
  - 13주 점수 트렌드 라인 차트
```

#### 5.7.3 게이미피케이션 배지 시스템

```
배지 목록:
  "안전 주간" — 해당 주 이벤트 0건 달성
  "3연속 안전" — 3주 연속 90점 이상
  "DTC 제로" — 최근 30일 DTC 발생 0건
  "연료 효율왕" — 이번 주 평균 연비 상위 20%
  "신뢰 드라이버" — 누적 50운행 90점 이상

배지 표시:
  드라이버 앱 홈 화면 프로필 섹션에 최근 획득 배지 3개 표시
  기관 관리자 안전 대시보드 드라이버 랭킹에 배지 아이콘 표시
```

#### 5.7.4 구현 단계

1. `RealTimeFeedbackService.ts` — 이벤트 감지 즉시 진동 + 배너 트리거
2. 드라이버 앱 [내 기록] 탭 화면 (`MyScoreScreen.tsx`)
3. `BadgeAwardService` (Rails) — 배지 조건 체크 Job (운행 종료 시)
4. `driver_badges` 테이블 + 배지 정의 시드 데이터
5. 배지 표시 UI (홈 화면 + 대시보드)

**예상 공수**: 4인일

---

## 6. 아키텍처 결정

### 6.1 기존 아키텍처 수준

**Enterprise** (현 Pickup 플랫폼 레벨 유지)

### 6.2 핵심 아키텍처 결정 사항

| 결정 | 옵션 | 선택 | 근거 |
|------|------|------|------|
| FCM 라이브러리 | fcm gem / google-auth gem | `google-auth-library` + 직접 HTTP v1 | FCM gem 미유지, 공식 v1 API 사용 |
| 지도 라이브러리 (Admin Portal) | Google Maps / Kakao Maps / Leaflet | Leaflet.js + OpenStreetMap | 무료 + 서버 사이드 키 불필요 |
| 차트 라이브러리 | Chart.js / Recharts / D3 | Recharts | React 친화적, 커스텀 용이 |
| PDF 생성 | WickedPDF / Prawn / Puppeteer | Prawn | Rails 네이티브, 한국어 폰트 안정적 |
| 백그라운드 BLE | expo-background-fetch / expo-task-manager | expo-task-manager (권장 최신) | Expo SDK 51+ 권장 |
| DTC 한글 DB 소스 | 직접 번역 / OBD2-database 오픈소스 | obd-codes 오픈소스 + 한글 번역 보강 | 3,000개 기반 데이터 확보 |

### 6.3 신규 파일 구조

```
pickup_rails/
├── app/
│   ├── models/
│   │   ├── driver_safety_score.rb      ← 신규
│   │   ├── driver_monthly_score.rb     ← 신규
│   │   ├── maintenance_prediction.rb   ← 신규
│   │   ├── maintenance_record.rb       ← 신규
│   │   ├── dtc_code.rb                 ← 신규
│   │   └── driver_badge.rb             ← 신규
│   ├── services/
│   │   ├── safety_score_calculator_service.rb  ← 신규
│   │   ├── fcm_notification_service.rb         ← 신규
│   │   ├── maintenance_prediction_service.rb   ← 신규
│   │   ├── risk_index_calculator_service.rb    ← 신규
│   │   ├── insurance_discount_service.rb       ← 신규
│   │   └── badge_award_service.rb              ← 신규
│   ├── jobs/
│   │   ├── weekly_safety_score_job.rb          ← 신규
│   │   ├── send_dtc_notification_job.rb        ← 신규
│   │   ├── maintenance_prediction_job.rb       ← 신규
│   │   └── monthly_risk_report_job.rb          ← 신규
│   ├── controllers/api/v1/
│   │   └── institutions/
│   │       └── safety_controller.rb    ← scores 액션 추가
│   └── mailers/
│       └── report_mailer.rb            ← 신규

driver-app/src/
├── services/obd2/
│   ├── ObdBackgroundTask.ts            ← 신규
│   └── RealTimeFeedbackService.ts      ← 신규
└── screens/
    └── MyScoreScreen.tsx               ← 신규

admin-portal/src/
├── pages/
│   └── Safety/
│       ├── SafetyDashboard.tsx         ← 신규
│       ├── SafetyScoreRanking.tsx      ← 신규
│       ├── SafetyEventHeatmap.tsx      ← 신규
│       ├── TripSpeedChart.tsx          ← 신규
│       └── DtcManagement.tsx           ← 신규
```

---

## 7. 리스크 및 완화 방안

| 리스크 | 영향도 | 발생 가능성 | 완화 방안 |
|--------|:------:|:-----------:|----------|
| iOS 백그라운드 BLE 승인 거부 | 높음 | 중간 | App Store 제출 전 CoreBluetooth 백그라운드 모드 사전 검토. 거부 시 15분 주기 재연결로 대체 |
| FCM 토큰 만료 / 갱신 누락 | 중간 | 낮음 | 관리자 로그인 시마다 토큰 갱신 API 호출. 만료 토큰 자동 정리 Job |
| DTC 한글 번역 품질 | 중간 | 중간 | 오픈소스 기반 + 자동차 정비사 1인 검수 계약. 초기 500개 우선 검수 |
| Prawn 한국어 폰트 라이선스 | 낮음 | 낮음 | 나눔고딕 OFL 라이선스 확인 완료 (상업 이용 허용) |
| 예측 정비 정확도 미달 | 중간 | 중간 | 1차 규칙 기반 배포 → 6개월 이력 축적 후 ML 모델로 교체. 리포트에 신뢰도% 명시 |
| 운전 습관 데이터 개인정보 | 높음 | 낮음 | PIPA 개인정보 보호법 준수: 수집 동의 팝업, 90일 후 익명화 배치 Job, 개인정보 처리방침 업데이트 |
| Admin Portal 지도 API 비용 | 낮음 | 낮음 | Leaflet + OSM 무료 사용. 고도화 시 카카오 맵 API 전환 (월 30만 호출 무료) |

---

## 8. 전제 조건 및 의존성

```
필수 완료 조건:
  Epic 4 (실시간 추적) ✅ 완료
  Epic 5 (드라이버 앱) ✅ 완료
  Epic 7 기본 구현     ✅ 완료 (Match Rate 63%)

외부 서비스:
  Google Firebase 프로젝트 생성 + 서비스 계정
  (iOS) Apple Developer Push 인증서 등록

신규 gem 의존성:
  google-auth-library → FCM HTTP v1
  prawn + prawn-table → PDF 생성
  prawn-fonts-ipafont OR nanum_gothic → 한국어 폰트

신규 npm 패키지:
  expo-task-manager → 백그라운드 태스크
  expo-background-fetch → 주기적 백그라운드 실행
  recharts → Admin Portal 차트
  leaflet + react-leaflet → Admin Portal 지도
```

---

## 9. 구현 우선순위 및 예상 공수

### 9.1 MoSCoW 우선순위

| Story | 제목 | 우선순위 | 예상 공수 |
|-------|------|:--------:|:--------:|
| A-1 | 드라이버 안전 점수 시스템 | Must | 3인일 |
| A-2 | 백그라운드 BLE + 자동 재연결 | Must | 2인일 |
| A-3 | FCM Push + DTC 한글 DB | Must | 3인일 |
| B-1 | Admin Portal 안전 대시보드 UI | Must | 8인일 |
| C-1 | AI 예측 정비 시스템 | Should | 5인일 |
| D-1 | 보험 · 리스크 관리 리포트 | Should | 5인일 |
| E-1 | 운전 코칭 시스템 (드라이버 앱) | Could | 4인일 |

**총 예상 개발 공수**: 30인일 (Must 16인일 + Should 10인일 + Could 4인일)

### 9.2 단계별 일정 (권장)

| 단계 | 기간 | 내용 | 산출물 |
|------|------|------|--------|
| Phase A | 1~2주 | Gap 완성 (A-1, A-2, A-3) | 안전 점수 API, BLE 안정화, FCM, DTC DB |
| Phase B | 2~3주 | Admin Portal UI (B-1) | 안전 대시보드 5개 화면 |
| Phase C | 3~4주 | AI 예측 정비 (C-1) | 정비 예측 서비스 + Admin UI |
| Phase D | 3~4주 | 보험 리포트 (D-1) | 리스크 리포트 PDF + 이메일 |
| Phase E | 2~3주 | 운전 코칭 (E-1) | 드라이버 앱 코칭 화면 + 게이미피케이션 |

**총 소요 기간**: 약 8~10주 (Phase A~B 병행 시 단축 가능)

---

## 10. 다음 단계

1. [ ] CTO(대표님) Plan 문서 검토 및 승인
2. [ ] Phase A 설계 문서 작성 (`epic-07-advanced-obd2.design.md`)
3. [ ] Google Firebase 프로젝트 생성 (FCM 서비스 계정 발급)
4. [ ] Phase A 구현 착수 (Story A-1 → A-2 → A-3 순서)
5. [ ] Phase B Admin Portal UI 설계 착수 (SLDS 와이어프레임)

---

## 버전 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-02-28 | 초안 작성 (Gap Analysis 기반 고도화 기획) | Claude (Gagahoho Inc.) |

---

**작성자**: Claude (Senior Fullstack Engineer, Gagahoho Inc.)
**검토 요청**: 대표님 — Phase 우선순위 및 외부 서비스(Firebase) 계정 준비 확인 필요
