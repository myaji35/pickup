# notification-settings Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: Pickup MaaS
> **Analyst**: bkit-gap-detector
> **Date**: 2026-02-28
> **Design Doc**: 구현 계획 (사용자 제공)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

notification-settings 기능의 구현 계획(Plan)과 실제 구현 코드 간의 차이를 식별하고 일치율을 산출한다.

### 1.2 Analysis Scope

- **구현 계획**: 9개 검증 포인트 (마이그레이션, 모델, 서비스, FCM, LocationUpdate, API, 라우트, 설정 UI, 동승자 UI)
- **구현 경로**:
  - Backend: `pickup_rails/db/migrate/`, `pickup_rails/app/models/`, `pickup_rails/app/services/`, `pickup_rails/app/controllers/`, `pickup_rails/config/routes.rb`
  - Frontend: `frontend/app/institutions/[id]/settings/page.tsx`, `frontend/app/institutions/[id]/trips/[tripId]/companion-checkin/page.tsx`
- **Analysis Date**: 2026-02-28

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 Step 1: DB Migration

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| 파일명 `20260228120000_add_notification_settings_to_guardians.rb` | `20260228120000_add_notification_settings_to_guardians.rb` | **Match** | |
| 테이블명 `guardian_notification_settings` | `guardian_notification_settings` | **Match** | |
| `guardian_id` (FK, NOT NULL) | `t.references :guardian, null: false, foreign_key: true` | **Match** | |
| `notif_type` (string NOT NULL) | `t.string :notif_type, null: false` | **Match** | |
| `enabled` (boolean default true) | `t.boolean :enabled, default: true, null: false` | **Match** | |
| `template` (text nullable) | `t.text :template` | **Match** | |
| UNIQUE 인덱스 (guardian_id, notif_type) | `add_index ... unique: true, name: 'idx_guardian_notif_settings_unique'` | **Match** | |

**schema.rb 확인 결과**: `guardian_notification_settings` 테이블이 정상 반영됨 (Line 153-162).

**Step 1 Score**: 7/7 (100%)

---

### 2.2 Step 2: Rails Model

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| `belongs_to :guardian` | `belongs_to :guardian` (L12) | **Match** | |
| `validates notif_type inclusion` | `validates :notif_type, inclusion: { in: NOTIF_TYPES }` (L14) | **Match** | |
| `defaults_for(guardian)` 클래스 메서드 | `def self.defaults_for(guardian)` (L18-29) | **Match** | 미설정 유형 기본값 채워서 반환 |
| `effective_template` 인스턴스 메서드 | `def effective_template` (L40-42) | **Match** | `template.presence \|\| DEFAULT_TEMPLATES[notif_type]` |
| 5개 NOTIF_TYPES | `NOTIF_TYPES = %w[trip_started eta_before_boarding boarded eta_before_alighting alighted]` (L2) | **Match** | |
| 5개 기본 템플릿 문구 | `DEFAULT_TEMPLATES` Hash (L4-10) | **Match** | 계획의 문구와 정확히 일치 |
| Guardian `has_many :notification_settings` | `has_many :notification_settings, class_name: 'GuardianNotificationSetting', dependent: :destroy` (L5) | **Match** | `dependent: :destroy` 추가 (계획 초과 구현) |

**추가 구현 (계획에 없음)**:
- `defaults_for_passenger(passenger)` 클래스 메서드 (L33-38) - Admin Portal에서 승객 기준 조회용
- `validates :guardian_id, uniqueness: { scope: :notif_type }` (L15) - 모델 레벨 유니크 검증

**Step 2 Score**: 7/7 + 2 추가 (100% + alpha)

---

### 2.3 Step 3: NotificationTemplateService

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| `render(template, variables)` 메서드 | `def self.render(template, variables = {})` (L12-18) | **Match** | |
| `{{ETA분}}` -> eta_minutes | VARIABLE_MAP에 `'{{ETA분}}' => :eta_minutes` (L4) | **Match** | |
| `{{승객이름}}` -> passenger_name | VARIABLE_MAP에 `'{{승객이름}}' => :passenger_name` (L5) | **Match** | |
| `{{기관명}}` -> institution_name | VARIABLE_MAP에 `'{{기관명}}' => :institution_name` (L6) | **Match** | |

**추가 구현 (계획에 없음)**:
- `resolve(setting, variables)` 메서드 (L23-28) - enabled 체크 + 렌더링을 한번에 처리

**Step 3 Score**: 4/4 + 1 추가 (100% + alpha)

---

### 2.4 Step 4: FCM Service Modification

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| guardian별 설정 조회 | `find_setting(guardian, notif_type)` private 메서드 (L178-186) | **Match** | |
| enabled=false이면 발송 스킵 | 모든 헬퍼에서 `next unless setting.enabled` (L29, L59, L89, L121) | **Match** | |
| `notify_eta_approaching`에 `context_type` 파라미터 추가 | `def self.notify_eta_approaching(trip, passenger, eta_minutes, context_type: :before_boarding)` (L114) | **Match** | |
| `:before_boarding \| :before_alighting` 분기 | `notif_type = context_type == :before_alighting ? 'eta_before_alighting' : 'eta_before_boarding'` (L116) | **Match** | |
| `notify_trip_started` 개인화 | guardian 루프 + find_setting + NotificationTemplateService.render (L17-49) | **Match** | |
| `notify_boarded` 개인화 | guardian 루프 + find_setting + render (L53-80) | **Match** | |
| `notify_alighted` 개인화 | guardian 루프 + find_setting + render (L83-110) | **Match** | |

**Step 4 Score**: 7/7 (100%)

---

### 2.5 Step 5: LocationUpdateService Modification

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| `check_in.status == 'boarded'` -> `:before_alighting` | `context_type = if check_in&.status.to_s == 'boarded' then :before_alighting else :before_boarding end` (L133-137) | **Match** | `.to_s` 추가로 nil-safe 처리 |
| 그 외 -> `:before_boarding` | else 분기로 처리 | **Match** | |
| `context_type:` 파라미터를 FCM에 전달 | `FcmNotificationService.notify_eta_approaching(trip, passenger, eta_min.to_i, context_type: context_type)` (L139-141) | **Match** | |

**Step 5 Score**: 3/3 (100%)

---

### 2.6 Step 6: Rails API Controller

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| `GET /api/v1/institutions/passengers/:id/notification_settings` | `def show` (L10-15) | **Match** | |
| `PATCH /api/v1/institutions/passengers/:id/notification_settings` | `def update` (L18-47) | **Match** | |
| `before_action :authenticate_request!` | 존재 (L5) | **Match** | |
| `before_action :require_institution_admin!` | 존재 (L6) | **Match** | |
| set_passenger (current_institution scope) | `@passenger = current_institution.passengers.find(params[:passenger_id])` (L52) | **Match** | |
| 응답 형식 `{ success: true, data: [...] }` | `render json: { success: true, data: settings.map { \|s\| serialize_setting(s) } }` (L12-14) | **Match** | |

**추가 구현 (계획에 없음)**:
- `find_or_default_guardian` 메서드 (L57-65) - guardian_id 명시 또는 첫번째 보호자 자동 선택
- `serialize_setting` (L67-75) - `default_template` 필드 추가 반환 (UI 미리보기용)
- 트랜잭션 처리 `ActiveRecord::Base.transaction` (L22)
- 에러 핸들링 `rescue => e` (L45-47)

**Step 6 Score**: 6/6 + 4 추가 (100% + alpha)

---

### 2.7 Step 7: Routes

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| passengers member에 `notification_settings` GET | `get :notification_settings, to: 'notification_settings#show'` (L59) | **Match** | |
| passengers member에 `notification_settings` PATCH | `patch :notification_settings, to: 'notification_settings#update'` (L60) | **Match** | |

**Step 7 Score**: 2/2 (100%)

---

### 2.8 Step 8: Admin Portal Settings UI

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| `frontend/app/institutions/[id]/settings/page.tsx` 알림 설정 카드 | `NotificationSettingsCard` 컴포넌트 (L55-232) | **Match** | |
| 승객별 선택 | `<select>` + `passengers` state (L131-156) | **Match** | |
| 알림 유형별 토글 (Switch) | `<Switch checked={setting.enabled} ...>` (L173-176) | **Match** | |
| 템플릿 입력 | `<Textarea placeholder={setting.default_template} ...>` (L186-195) | **Match** | |
| 미리보기 | `renderPreview()` 함수 (L46-52) + 미리보기 영역 (L198-201) | **Match** | |
| 저장 기능 | `handleSave` -> `railsClient.patch(...)` (L95-114) | **Match** | |
| 5개 알림 유형 라벨 | `NOTIF_TYPE_LABELS` 객체 (L31-37) | **Match** | |

**Step 8 Score**: 7/7 (100%)

---

### 2.9 Step 9: Companion Check-in UI

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| `frontend/app/institutions/[id]/trips/[tripId]/companion-checkin/page.tsx` | 파일 존재 (241줄) | **Match** | |
| 탑승 버튼 | `handleBoard` (L76-89) + 녹색 탑승 버튼 (L164-179) | **Match** | |
| 하차 버튼 | `handleAlight` (L92-105) + 파란색 하차 버튼 (L181-196) | **Match** | |
| 3단계 상태 뱃지 (pending -> boarded -> alighted) | `StatusBadge` 컴포넌트 (L22-35) | **Match** | `absent` 상태 추가 포함 |
| 상태에 따른 조건부 버튼 렌더링 | pending: 탑승, boarded: 하차, alighted: 완료 표시 (L163-204) | **Match** | |
| boarding_order 정렬 | `.sort((a, b) => ...)` (L62) | **Match** | |

**추가 구현 (계획에 없음)**:
- `absent` 4번째 상태 지원 (L10, L27)
- 통계 요약 (대기/탑승중/하차완료 카운트) (L211-226)
- 토스트 알림 시스템 (L49-51, L229-237)
- 뒤로가기 네비게이션 (L121-126)

**Step 9 Score**: 6/6 + 4 추가 (100% + alpha)

---

## 3. Overall Score

### 3.1 Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 100%                    |
+---------------------------------------------+
|  Match:              49/49 items (100%)      |
|  Missing (Plan O, Impl X):  0 items (0%)    |
|  Added (Plan X, Impl O):   11 items          |
+---------------------------------------------+
```

### 3.2 Category Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Step 1: DB Migration | 100% | PASS |
| Step 2: Rails Model | 100% | PASS |
| Step 3: Template Service | 100% | PASS |
| Step 4: FCM Service | 100% | PASS |
| Step 5: LocationUpdateService | 100% | PASS |
| Step 6: API Controller | 100% | PASS |
| Step 7: Routes | 100% | PASS |
| Step 8: Settings UI | 100% | PASS |
| Step 9: Companion Checkin UI | 100% | PASS |
| **Overall** | **100%** | **PASS** |

---

## 4. Added Features (Plan X, Implementation O)

계획에 없었지만 구현에 추가된 항목들 (모두 긍정적 강화):

| # | Item | Location | Description |
|---|------|----------|-------------|
| 1 | `defaults_for_passenger` 메서드 | `guardian_notification_setting.rb:33-38` | Admin Portal에서 승객 기준으로 보호자 알림 설정 조회 |
| 2 | guardian_id uniqueness 모델 검증 | `guardian_notification_setting.rb:15` | DB 인덱스와 이중 보호 |
| 3 | `resolve` 메서드 | `notification_template_service.rb:23-28` | enabled 체크 + 렌더링 원스탑 |
| 4 | `find_or_default_guardian` | `notification_settings_controller.rb:57-65` | guardian_id 미전달시 첫번째 보호자 자동 선택 |
| 5 | `serialize_setting` + `default_template` | `notification_settings_controller.rb:67-75` | UI 미리보기를 위한 기본 템플릿 반환 |
| 6 | Transaction 처리 | `notification_settings_controller.rb:22` | 일괄 저장 원자성 보장 |
| 7 | 에러 핸들링 (rescue) | `notification_settings_controller.rb:45-47` | 422 응답 처리 |
| 8 | `absent` 상태 지원 | `companion-checkin/page.tsx:10,27` | 결석 상태 추가 |
| 9 | 통계 요약 카드 | `companion-checkin/page.tsx:211-226` | 대기/탑승/하차 카운트 |
| 10 | 토스트 알림 | `companion-checkin/page.tsx:49-51,229-237` | 사용자 피드백 |
| 11 | `dependent: :destroy` | `guardian.rb:5` | 보호자 삭제시 설정 연쇄 삭제 |

---

## 5. Code Quality Notes

### 5.1 Positive Observations

- **nil-safe 처리**: LocationUpdateService에서 `check_in&.status.to_s`로 nil 방지
- **FcmNotificationService**: N+1 방지를 위해 `includes(passenger: :guardians)` 사용
- **프론트엔드 UX**: 로딩 스피너, 저장 피드백, 미리보기 등 UX 완성도가 높음
- **라우트 설계**: RESTful한 member 라우트로 passengers 하위 notification_settings 배치

### 5.2 Minor Suggestions

| # | Type | Location | Description | Severity |
|---|------|----------|-------------|----------|
| 1 | Performance | `fcm_notification_service.rb:20-25` | `notify_trip_started`에서 `includes`가 check_ins -> passenger -> guardians로 깊은데, guardian별 notification_settings까지 eager load하면 N+1 추가 방지 가능 | Low |
| 2 | Type Safety | `companion-checkin/page.tsx:84` | `catch (e: any)` 대신 `catch (e: unknown)` 사용 권장 | Low |

---

## 6. Recommended Actions

### Match Rate >= 90%: "설계와 구현이 잘 일치합니다."

계획에 명시된 모든 49개 항목이 구현에 100% 반영되었으며, 11개의 추가 구현은 모두 코드 품질과 UX를 향상시키는 긍정적 강화입니다.

### Documentation Update Needed

- [x] 추가 구현된 11개 항목을 설계 문서에 반영 (선택사항)
- [x] `absent` 상태 지원을 계획 문서에 명시 (선택사항)

---

## 7. Files Analyzed

| File | Path |
|------|------|
| Migration | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/pickup_rails/db/migrate/20260228120000_add_notification_settings_to_guardians.rb` |
| Model (Setting) | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/pickup_rails/app/models/guardian_notification_setting.rb` |
| Model (Guardian) | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/pickup_rails/app/models/guardian.rb` |
| Model (Passenger) | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/pickup_rails/app/models/passenger.rb` |
| Template Service | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/pickup_rails/app/services/notification_template_service.rb` |
| FCM Service | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/pickup_rails/app/services/fcm_notification_service.rb` |
| Location Service | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/pickup_rails/app/services/location_update_service.rb` |
| API Controller | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/pickup_rails/app/controllers/api/v1/institutions/notification_settings_controller.rb` |
| Routes | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/pickup_rails/config/routes.rb` |
| Schema | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/pickup_rails/db/schema.rb` |
| Settings UI | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/frontend/app/institutions/[id]/settings/page.tsx` |
| Companion UI | `/Volumes/E_SSD/02_GitHub.nosync/0007_pickup/frontend/app/institutions/[id]/trips/[tripId]/companion-checkin/page.tsx` |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-28 | Initial gap analysis | bkit-gap-detector |
