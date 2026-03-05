# [Report] migrate — Rails API 완전 전환 & 기관 포털 관제화면 구현

**작성일**: 2026-03-05
**Match Rate**: 95%
**Phase**: Plan → Design → Do → Check → Report ✅

---

## 1. Executive Summary

NestJS 레거시 백엔드를 Rails 8.1.2로 완전 전환하고, Next.js Admin Portal의 기관 포털(`/institutions/[id]/`) 전체 화면에서 발생하던 에러 15개를 전수 수정하였습니다. 추가로 AI 경로 최적화 흐름을 지원하는 로스터 출발지/출발시간 필드를 추가하고 관련 UI를 구현하였습니다.

---

## 2. 구현 완료 항목

### 2.1 Rails API 버그 전수 수정 (Do Phase)

| # | 파일 | 문제 | 수정 내용 |
|---|------|------|-----------|
| 1 | `vehicles_controller.rb` | `.includes(:users)` — 연관관계 없음 | `.includes` 제거 |
| 2 | `trips_controller.rb` | `current_institution` private 메서드 누락 | 메서드 추가 |
| 3 | `risk_index_calculator_service.rb` | `period_start`, `overall_score`, `reported_at` 컬럼 없음 | `period_year/period_week`, `total_score`, `created_at`으로 수정 |
| 4 | `insurance_safety_report_service.rb` | 동일 스키마 불일치 | 전체 치환 |
| 5 | `driver_coaching_service.rb` | 동일 스키마 불일치 | 전체 치환 |
| 6 | `coaching_controller.rb` | `.order(period_start:)`, `overall_score`, `grade` 없음 | 필드 수정 + grade 인라인 계산 |
| 7 | `institution.rb` | `has_many :trips` 연관관계 없음 | `through: :rosters` 추가 |
| 8 | `rosters_controller.rb` | `departure_address`, `departure_time` permit 누락 | permit + roster_json 직렬화 추가 |

### 2.2 프론트엔드 데이터 언래핑 수정

| # | 파일 | 문제 | 수정 내용 |
|---|------|------|-----------|
| 9 | `trips/page.tsx` | `railsClient.get` 이중 `.data` 언래핑 | 타입 `TripItem[]`로 직접 수신 |
| 10 | `trips/[tripId]/page.tsx` | 동일 패턴 | 수정 |
| 11 | `settlements/page.tsx` | vehicles, receipts, settlements 3곳 | 수정 |
| 12 | `risk-report/page.tsx` | plain json 응답을 `railsClient.get`으로 호출 | `railsClient.getRaw`로 전환 |
| 13 | `hooks/queries/use-vehicles.ts` | `plate_last4`/`capacity` → 프론트 필드명 미매핑 | 변환 로직 추가 |
| 14 | `rosters/page.tsx` | Roster 인터페이스 Rails 실제 응답과 불일치 | 인터페이스 재정의 |
| 15 | `app/institutions/[id]/page.tsx` | 루트 경로 404 | `/analytics` 리다이렉트 추가 |

### 2.3 로스터 출발지/출발시간 기능 추가

- **DB 마이그레이션**: `20260305081149_add_departure_fields_to_rosters.rb`
  - `departure_address :string`
  - `departure_time :string`
- **Rails Controller**: `roster_params` permit + `roster_json` 직렬화 포함
- **프론트 목록**: 로스터 카드에 출발시간(파란색), 출발지 표시
- **프론트 상세**: `/rosters/[rosterId]/optimize` 인라인 편집 UI (편집/저장/취소)
  - `PATCH /institutions/rosters/:id` API 연동
  - `useMutation` + `useQuery` 패턴

---

## 3. 테스트 결과 (Check Phase)

### 3.1 API 엔드포인트 검증

| 엔드포인트 | 상태 | 비고 |
|-----------|------|------|
| `GET /api/v1/institutions/vehicles` | ✅ 200 | 차량 목록 정상 |
| `GET /api/v1/institutions/trips` | ✅ 200 | 운행 목록 정상 |
| `GET /api/v1/institutions/risk_reports/current` | ✅ 200 | 리스크 지수 정상 |
| `GET /api/v1/institutions/rosters` | ✅ 200 | 출발지/시간 포함 |
| `PATCH /api/v1/institutions/rosters/:id` | ✅ 200 | 출발지/시간 저장 |
| `GET /api/v1/institutions/settlements` | ✅ 200 | 정산 데이터 정상 |

### 3.2 브라우저 UI 검증 (Playwright)

| 화면 | 상태 | 비고 |
|------|------|------|
| `/institutions/3` | ✅ analytics 리다이렉트 | |
| `/institutions/3/vehicles` | ✅ 차량 목록 표시 | plate_number, capacity 정상 |
| `/institutions/3/trips` | ✅ 운행 목록 표시 | |
| `/institutions/3/risk-report` | ✅ 리스크 게이지 + 추이 차트 | |
| `/institutions/3/rosters` | ✅ 출발지/시간 표시 | |
| `/institutions/3/rosters/1/optimize` | ✅ 인라인 편집 저장 확인 | "서울시 마포구 햇살 어린이집" / 07:30 |

---

## 4. 기술적 핵심 결정

### 4.1 railsClient 패턴 명확화

```typescript
// railsClient.get — { success, data } 자동 언래핑 → data 반환
const vehicles = await railsClient.get<Vehicle[]>('/institutions/vehicles');

// railsClient.getRaw — 전체 응답 반환 (plain json 컨트롤러용)
const riskData = await railsClient.getRaw<RiskData>('/institutions/risk_reports/current');
```

이 패턴은 `render_success()` wrapper를 사용하는 컨트롤러와 직접 `render json:` 반환 컨트롤러를 구분하는 핵심입니다.

### 4.2 DriverSafetyScore 스키마

```ruby
# 실제 스키마 (Rails DB)
period_year :integer
period_week :integer
total_score :decimal

# 잘못된 참조 (수정 전)
# period_start, overall_score, grade
```

### 4.3 Institution → Trip 연관관계

```ruby
# institution.rb
has_many :trips, through: :rosters
```

---

## 5. 커밋 이력

| 커밋 | 메시지 |
|------|--------|
| `0adc87d` | fix: 기관 포털 API 연동 버그 전수 수정 |
| `c8512f9` | feat: 로스터에 출발지/출발시간 필드 추가 |

---

## 6. 잔여 과제 (5% Gap)

- `optimized_distance_km` 프론트 타입 — `optimized_distance_m`(m 단위) → km 변환 표시 누락 (로스터 카드)
- 정산 페이지 OCR 영수증 파일 업로드 경로 — 배포 환경 Active Storage 설정 확인 필요

---

## 7. 결론

Rails API 완전 전환 마이그레이션이 성공적으로 완료되었습니다. 15개 버그 전수 수정, 로스터 출발지/시간 기능 추가, 브라우저 검증까지 모두 완료하였으며 **Match Rate 95%**로 목표 기준(90%)을 초과 달성하였습니다.
