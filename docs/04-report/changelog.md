# Changelog

All notable changes to Pickup MaaS project will be documented in this file.

---

## [2026-03-01] - Landing Hero PDCA 사이클 완료 (Match Rate 95%)

### Summary
인터랙티브 Canvas 기반 히어로 애니메이션 PDCA 전체 사이클 완료. 브레인스토밍 메타포 ("도시 속 항공 관제실")를 기반으로 기획 → 설계 → 구현 → 검증을 통해 95% Match Rate 달성.

### Added
- **Canvas 애니메이션 시스템**
  - 4단계 PowerPhase 상태머신 (grid → vehicles → routes → complete)
  - 6-state ScenePhase 루프 (scene1 → scene2 → scene3 → 반복)
  - Camera Lerp 시스템 (cameraRef + targetCameraRef)
  - drawScene3Overlay() 신규 함수 (탑승완료 ping + 카운터)

- **상태머신 기반 아키텍처**
  - expandProgress 파라미터 (중앙→외곽 확산)
  - vehicleReveal[] + routeReveal[] 배열 (순차 애니메이션)
  - 실제 delta 시간 기반 타이밍 (0.016초 하드코딩 대신)

- **KPI 카운터 애니메이션**
  - HeroKpiBar + HeroKpiItem 컴포넌트 분리
  - useCounter 훅: IntersectionObserver + rAF 기반
  - 소수점 정확도 (99.2% 표시)

- **완료 보고서**
  - `docs/04-report/features/landing-hero.report.md` (95% Match Rate 기록)
  - pdca-iterator 1회 반복으로 75% → 95% 달성

### Changed
- ControlCanvas.tsx: PowerPhase + ScenePhase 상태머신 추가
- page.tsx: KPI 정적 텍스트 → countUp 애니메이션

### Features Implemented
- [x] Dark Control Room Canvas (Item 1: 100%)
- [x] Power-On Sequence (Item 2: 100%)
- [x] 3-Scene Auto Loop (Item 3: 95%)
- [x] B2B Trust Headline (Item 4: 100%)
- [x] KPI Counter (Item 5: 100%)
- [x] CTA Simplification (Item 6: 75% - 문서 모순 의존)
- [x] Mouse Interaction Phase 2 (Item 7: 75% - Phase 2 지정 항목)

### Metrics
- **Match Rate**: 95% (v2.0) — 목표 90% 초과 달성
- **PDCA 사이클**: Plan → Design → Do → Check → Act (전체 완료)
- **코드 품질**: TypeScript 100%, prefers-reduced-motion 지원
- **성능**: 60fps 안정화, 외부 라이브러리 0개, 번들 절감 ~40KB
- **구현 기간**: 1~2주 (계획대로)

### Related Documents
- Report: `docs/04-report/features/landing-hero.report.md`
- Plan: `docs/01-plan/product-brief-landing-hero-20260228.md`
- Brainstorming: `docs/brainstorming-session-landing-hero-20260228.md`
- Analysis: `docs/03-analysis/landing-hero.analysis.md`

### Known Issues & Recommendations
1. **문서 불일치**: Product Brief (CTA 단일) vs Structure (CTA 이중) → 의사결정 필요
2. **Mobile Fallback**: "Out of Scope" vs "MVP Success Criteria" 양쪽 명시 → 범위 확정 필요
3. **파일 크기**: page.tsx 819줄 → 컴포넌트 분해 권장
4. **Phase 2**: 정류장 호버 툴팁 미구현 (마우스 인터랙션 고도화 필요)

---

## [2026-02-28] - Landing Page 2026 트렌드 리디자인 + 애니메이션 시스템

### Added
- Landing Page 전면 재설계 (2026 B2B SaaS 트렌드)
  - Dark gradient hero (radial-gradient + 격자 오버레이)
  - Sticky navbar (backdrop-blur 전환)
  - Trust badges + Customer logo bar (5개 기관)
  - Bento grid features (12열 비대칭 레이아웃, 6개 카드)
  - Product mockup with animated dashboard
  - 3-tier pricing (Starter/Pro/Enterprise)
  - Gradient CTA section
  - Footer (5-column grid)

- 6가지 애니메이션 시스템 (외부 라이브러리 0개)
  1. **Floating Glow Orbs**: Parallax + float animation (8~10초)
  2. **Gradient Text Shift**: Background-position 순환 (4초)
  3. **Scroll Fade-In Stagger**: IntersectionObserver + fadeInUp (0.65초)
  4. **Number Counter**: requestAnimationFrame 기반 숫자 카운팅
  5. **Chart Bar Rise**: scaleY animation + stagger delay (0.7초)
  6. **Pro Plan Pulse Glow**: box-shadow 점진적 확대 (3초 무한)

- Custom React Hooks
  - `useScrollReveal`: IntersectionObserver 기반 스크롤 진입 감지
  - `useCounter`: 60fps 숫자 애니메이션 (requestAnimationFrame)
  - `FadeIn`: Scroll-triggered fade-in stagger 래퍼

- Keyframe 애니메이션 (globals.css)
  - fadeInUp, pulseGlow, chartRise, floatOrb, gradientShift
  - prefers-reduced-motion 완전 지원

### Changed
- `frontend/app/page.tsx`: 전체 Landing Page 재작성 (779 라인)
- `frontend/app/globals.css`: 6가지 @keyframes + utility 추가 (+102 라인)

### Performance
- 외부 라이브러리 미사용 (번들 크기 ~40KB 절감)
- Transform + opacity 애니메이션만 사용 (0 CLS, layout reflow 없음)
- Passive scroll listener로 메인 스레드 최적화
- IntersectionObserver 기반 lazy animation

### Accessibility
- prefers-reduced-motion 미디어 쿼리 완전 지원
- Semantic HTML (header, nav, section, footer)
- ARIA labels (buttons, icons)
- 모든 interactive elements 키보드 접근 가능

### Metrics
- Lines of Code: 881 라인 신규 (page.tsx 779 + globals.css 102)
- Animations: 6가지 시스템
- Components: 9개 섹션 (Hero, Logo bar, Features, Product, Stats, Pricing, CTA, Footer)
- Test Coverage: Playwright E2E 12개 테스트 모두 Pass
- Expected UX Improvement: +15~20% 전환율 기대

### Related Documents
- Report: `docs/04-report/features/landing-page.report.md`
- Implementation: `frontend/app/page.tsx`, `frontend/app/globals.css`

---

## [2026-02-28] - notification-settings 보호자 알림 개인화 설정

### Added
- 보호자 맞춤 알림 설정 기능 (Epic 14 확장)
  - `guardian_notification_settings` 테이블 생성 (5개 알림 유형)
  - NotificationTemplateService: {{변수}} 패턴 치환 (ETA분, 승객이름, 기관명)
  - Admin Portal Settings 페이지: 승객별 보호자 알림 설정 UI
  - Companion Check-in 페이지: 탑승/하차 원터치 처리 (pending→boarded→alighted)
  - GuardianNotificationSetting 모델 (기본값 생성, 효과적 템플릿 선택)
  - NotificationSettingsController API (GET/PATCH)

### Changed
- FcmNotificationService 개인화 확장
  - notify_trip_started, notify_boarded, notify_alighted에 guardian별 설정 체크
  - notify_eta_approaching에 context_type 파라미터 추가 (before_boarding/before_alighting)
- LocationUpdateService
  - check_in.status 기반 context_type 판단 로직 추가
- Guardian 모델
  - has_many :notification_settings (dependent: :destroy) 관계 추가

### Features
- **UI Components**: shadcn/ui Switch, Textarea 추가
- **API**: `GET/PATCH /api/v1/institutions/passengers/:id/notification_settings`
- **Routes**: passengers member 라우트에 notification_settings 추가
- **Value Add**: 11개 추가 구현 (defaults_for_passenger, transaction, error handling, absent 상태 등)

### Metrics
- Match Rate: 100% (49/49 항목 완벽 구현)
- Iterations: 0회 (1회 완성형 구현)
- Code Lines: ~900 LOC (Backend ~450, Frontend ~450)
- Additional Features: 11개 (계획 초과 구현)

### Related Documents
- Report: `docs/04-report/features/notification-settings.report.md`
- Analysis: `docs/03-analysis/notification-settings.analysis.md`

---

## [2026-02-28] - Epic 15 Driver Coaching & Predictive Maintenance

### Added
- Driver Coaching 시스템
  - CoachingMessage, DriverBadge, WeeklyCoachingSummary 모델
  - DriverCoachingService: 운행 완료 후 자동 코칭 메시지 생성
  - WeeklyCoachingJob: 매주 월요일 주간 요약 FCM 발송
  - Driver App CoachingScreen (메시지/배지/주간요약 3탭)

- Predictive Maintenance 시스템
  - DtcCode, MaintenancePrediction, MaintenanceRecord 모델
  - MaintenancePredictionService: OBD-II 데이터 기반 정비 예측
  - MaintenancePredictionJob: 매일 03:00 예측 실행
  - Admin Portal 정비 관리 페이지

### Changed
- RiskIndexCalculatorService 고도화
  - 4가지 요소 가중치 (안전점수 40%, 이벤트 30%, DTC 20%, 정비 10%)
  - 리스크 레벨 (LOW/MEDIUM/HIGH/CRITICAL) 문자열 반환
  - 보험료 할인율 자동 계산

### Features
- InsuranceSafetyReportService 개선 (risk_index 숫자 + risk_level 문자열)
- MonthlyRiskReportJob: 매월 1일 월간 리스크 리포트 생성
- Admin Portal: vehicles/[id]/maintenance 페이지, risk-report 페이지
- API: GET /api/v1/institutions/vehicles/:id/maintenance/predictions, /records, /api/v1/institutions/risk_reports/*

---

## [2026-02-28] - Epic 14 FCM Push Notifications

### Added
- FCM 푸시 알림 기반 인프라
  - FcmToken, NotificationLog 모델
  - FcmNotificationService: FCM HTTP v1 API 통합
  - NotificationTemplate 시스템 (기본 메시지)
  - 5가지 알림 트리거 (trip_started, boarded, alighted, eta_approaching, dtc_alert)

### Changed
- Trip, Passenger, Driver, Guardian 모델에 FCM 토큰 등록 로직 추가
- LocationUpdateService: ETA 접근 알림 (5분 이내)
- Admin Portal: Notifications 페이지 (KPI + 차트 + 이력)

### Features
- Driver App & Passenger App: 푸시 알림 수신 및 FCM 토큰 등록
- API: `POST /api/v1/auth/fcm_token`, `GET /api/v1/institutions/notifications`
- Job: Weekly recurring notification stats

---

## [2026-02-28] - Epic 13 Partnership System (Partner Garages)

### Added
- Partner Garage 관리
  - PartnerGarage, PartnerApiKey, GarageReservation 모델
  - Admin Portal에서 파트너 정비소 등록/관리
  - Driver App & Passenger App: 정비소 예약 기능

### Features
- API: `POST /api/v1/institutions/garages`, `POST /api/v1/institutions/garages/:id/reserve`
- Integration: DTC 코드와 연동된 정비소 추천

---

## [2026-02-28] - Epic 12 Payment & Subscription Management (Toss Payments)

### Added
- 토스페이먼츠 결제 시스템
  - PaymentRecord, Invoice 모델
  - TossPaymentsService: 토스페이먼츠 API 통합
  - SubscriptionBillingService: 월간 자동 청구
  - SubscriptionRenewalJob: 매월 1일 자동 갱신

### Changed
- Plan 모델 (Starter 50K, Pro 150K, Enterprise 500K)
- Subscription 모델: 구독 기간, 상태 추적

### Features
- Admin Portal: 구독 관리 대시보드
- API: `POST /api/v1/institutions/billing/register_card`, `GET /api/v1/institutions/billing/status`
- Admin API: `PATCH /api/v1/admin/subscriptions/:id/plan`

---

## [2026-02-28] - Epic 10 BI Dashboard

### Added
- BI 분석 대시보드 (Admin Portal)
  - AnalyticsQueryService: 데이터 집계 (시간별, 일별, 월별)
  - Recharts 기반 시각화 (LineChart, BarChart, PieChart)
  - KPI 카드 (온시간도, 평균 연료, 안전점수)

### Features
- API: `GET /api/v1/institutions/analytics/trips`, `/vehicles`, `/drivers`
- Dashboard pages: analytics, billing, risk-report

---

## [2026-02-28] - Epic 9 AI Route Optimization (VRP)

### Added
- Google OR-Tools 기반 차량 경로 최적화
  - VRP 마이크로서비스 (`vrp_service/` Python FastAPI)
  - VrpClientService: Rails에서 VRP API 호출
  - Roster 최적화 트리거 (관리자 "최적화" 버튼)
  - boarding_order 자동 생성

### Changed
- RosterPassenger: estimated_arrival_sec 필드 추가
- LocationUpdateService: 실시간 ETA 브로드캐스트

### Features
- API: `POST /api/v1/institutions/rosters/:id/optimize`
- Admin Portal: 탑승 그룹 최적화 페이지

---

## [2026-02-28] - Epic 8 Passenger & Guardian App (React Native)

### Added
- 승객 및 보호자 모바일 앱
  - passenger-app: 시간표 조회, 실시간 위치 추적, 임시 셔틀 요청
  - Guardian context-based authentication
  - NotificationsScreen: 실시간 알림 수신

### Features
- SafetyScreen (DTC, 정비소 예약)
- Settings 화면 (알림 설정, 프로필)

---

## [2026-02-28] - Epic 7 Phase B Safety Dashboard

### Added
- Admin Portal 안전 대시보드
  - OBD-II 기반 DTC 코드 표시
  - 위험 운전 이벤트 시각화
  - DrivingSafetyScore 리더보드

### Features
- `/institutions/[id]/safety/dtc` 페이지
- DTC 상세 정보 및 정비소 연동

---

## [2026-02-28] - Epic 7 Phase A OBD-II Integration

### Added
- OBD-II 텔레메트리 데이터 수집
  - Vehicle 모델: fault_codes, obd_data JSON
  - DrivingEvent, DrivingSafetyScore 모델
  - Vehicle 상태 추적 (fuel_level, engine_rpm, mileage)

### Features
- LocationUpdateService: OBD-II 이벤트 처리
- BI 지표: 연료 효율, 급가속/급제동 감지

---

## [2026-02-28] - Phase 11 Admin Portal MVP

### Added
- SaaS Multi-tenant 기반 구축
- User Context: JWT 인증, Role-Based Access Control (SUPER_ADMIN, INSTITUTION_ADMIN, DRIVER)
- Institution Management: 가입 승인, 상태 관리, 일시 정지
- Subscription System: Plan 관리 (Starter/Pro/Enterprise)
- Admin APIs: 30+ 엔드포인트

### Changed
- Database Schema: 11개 핵심 엔티티 (User, Institution, Plan, Subscription 등)
- Frontend: Next.js 14 App Router, React Context, shadcn/ui

### Features
- Admin Dashboard: 6개 KPI 카드
- Institution Approval Workflow: 대기 목록, 승인/거절 다이얼로그
- Admin Layout: Responsive sidebar + topbar

---

**Format**: [YYYY-MM-DD] - {Title}
**Template**: Added / Changed / Fixed / Removed

---
