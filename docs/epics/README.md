# PickUp MVP - Epic 개요

**프로젝트**: PickUp
**Stage**: MVP (3개월)
**목표**: 5개 파일럿 기관 확보

---

## 📊 Epic 전체 구조

PickUp MVP는 6개의 핵심 Epic으로 구성되며, 총 **34개의 사용자 스토리**를 포함합니다.

```
PickUp MVP
├── Epic 1: 기관 및 계약 관리 (5 stories)
├── Epic 2: 차량 및 기사 관리 (6 stories)
├── Epic 3: 승객 명단 관리 (6 stories)
├── Epic 4: 실시간 차량 추적 (6 stories)
├── Epic 5: 기사 모바일 앱 (8 stories)
└── Epic 6: 승객/보호자 모바일 앱 (8 stories)
```

---

## 🗺️ Epic 로드맵

### Month 1: 기반 인프라 & 관리자 포털

| 주차 | Epic | 핵심 기능 | 상태 |
|------|------|-----------|------|
| Week 1-2 | **Epic 1** | 기관 CRUD, 관리자 초대, 사업자등록번호 검증 | 🟢 P0 |
| Week 2-3 | **Epic 2** | 차량/기사 CRUD, 1:1 매칭, Clerk 연동 | 🟢 P0 |
| Week 3-4 | **Epic 3** | 승객 등록, 엑셀 업로드, 주간 명단 관리 | 🟢 P0 |

**Milestone 1 (Month 1 완료)**:
- ✅ 기관 관리자가 차량/기사/승객을 웹 포털에서 관리 가능
- ✅ 주간 명단 생성 및 복사 기능 동작
- ✅ Prisma + PostgreSQL 기본 데이터 모델 완성

---

### Month 2: 실시간 추적 & 모바일 앱 개발

| 주차 | Epic | 핵심 기능 | 상태 |
|------|------|-----------|------|
| Week 1-2 | **Epic 4** | GPS 수집, Redis 캐싱, 관리자 지도 표시 | 🟢 P0 |
| Week 2-3 | **Epic 5** | 기사 앱 (운행 시작/종료, 승객 체크인, 내비 연동) | 🟢 P0 |
| Week 3-4 | **Epic 6** | 승객 앱 (실시간 지도, ETA, 푸시 알림) | 🟢 P0 |

**Milestone 2 (Month 2 완료)**:
- ✅ 기사 앱에서 운행 시작 시 GPS 자동 수집
- ✅ 관리자 포털에서 실시간 차량 위치 지도 표시
- ✅ 승객 앱에서 셔틀 위치 및 ETA 확인 가능
- ✅ FCM 푸시 알림 (운행 시작, 승하차)

---

### Month 3: 통합 테스트 & 파일럿

| 주차 | 활동 | 목표 |
|------|------|------|
| Week 1 | End-to-End 테스트 | 전체 플로우 검증 (기관 등록 → 운행 → 승하차 알림) |
| Week 2 | 파일럿 기관 온보딩 (2-3개) | 실제 데이터로 테스트, 피드백 수집 |
| Week 3 | 버그 수정 & 개선 | 파일럿 피드백 반영 |
| Week 4 | 정식 런칭 준비 | 추가 2-3개 기관 확보, 문서화 |

**Milestone 3 (Month 3 완료)**:
- ✅ 5개 파일럿 기관 확보
- ✅ 정시 도착률 90% 이상
- ✅ NPS > 50

---

## 📋 Epic 상세 목록

### Epic 1: 기관 및 계약 관리
**담당 Context**: Institution Context
**우선순위**: P0
**예상 공수**: 1.5주

| Story ID | 제목 | 설명 |
|----------|------|------|
| 1.1 | 기관 등록 | 사업자등록번호 기반 기관 등록 |
| 1.2 | 기관 관리자 초대 | 이메일 초대 및 임시 비밀번호 발송 |
| 1.3 | 기관 정보 수정 | 주소/연락처 업데이트 |
| 1.4 | 기관 목록 조회 및 검색 | 검색, 필터링, 페이지네이션 |
| 1.5 | 기관 상태 관리 | 활성/비활성 토글 |

[📄 상세 문서: `epic-01-institution-management.md`](./epic-01-institution-management.md)

---

### Epic 2: 차량 및 기사 관리
**담당 Context**: Fleet Context
**우선순위**: P0
**예상 공수**: 1주

| Story ID | 제목 | 설명 |
|----------|------|------|
| 2.1 | 차량 등록 | 차량번호, 차종, 정원 입력 및 뒤 4자리 추출 |
| 2.2 | 기사 등록 | 운전면허번호, Clerk 계정 자동 생성 |
| 2.3 | 차량-기사 배정 | 1:1 매칭 |
| 2.4 | 차량 목록 조회 | 테이블 표시, 검색 |
| 2.5 | 차량 상태 변경 | 운행 가능/정비 중/폐차 |
| 2.6 | 기사 정보 수정 | 연락처 업데이트 |

[📄 상세 문서: `epic-02-fleet-management.md`](./epic-02-fleet-management.md)

---

### Epic 3: 승객 명단 관리
**담당 Context**: Roster Context
**우선순위**: P0
**예상 공수**: 1.5주

| Story ID | 제목 | 설명 |
|----------|------|------|
| 3.1 | 승객 등록 (수동) | 이름, 연락처, 픽업/하차 주소 입력 |
| 3.2 | 엑셀 업로드 | 대량 승객 등록 (xlsx 파싱) |
| 3.3 | 주간 명단 생성 | 특정 주, 차량, 셔틀 타입 선택 |
| 3.4 | 명단 복사 | 이전 주 → 다음 주 자동 복사 |
| 3.5 | 명단 조회 및 수정 | 필터링, 승객 추가/제거 |
| 3.6 | 명단 삭제 | 확인 다이얼로그, 로그 기록 |

[📄 상세 문서: `epic-03-roster-management.md`](./epic-03-roster-management.md)

---

### Epic 4: 실시간 차량 추적
**담당 Context**: Fleet Context + Route Context (일부)
**우선순위**: P0
**예상 공수**: 1.5주

| Story ID | 제목 | 설명 |
|----------|------|------|
| 4.1 | 운행 시작 (Trip Start) | Trip 생성, GPS 수집 시작, 푸시 알림 |
| 4.2 | GPS 위치 수집 및 저장 | 10초 간격, Redis + PostgreSQL |
| 4.3 | 관리자 포털 - 전체 차량 지도 | Kakao/Naver Map, 실시간 마커 |
| 4.4 | 승객 앱 - 내 셔틀 위치 | React Native Maps, polling |
| 4.5 | 운행 종료 (Trip End) | Trip 완료, GPS 중단 |
| 4.6 | 기본 ETA 계산 | 직선거리 기반 (30km/h 가정) |

[📄 상세 문서: `epic-04-realtime-tracking.md`](./epic-04-realtime-tracking.md)

---

### Epic 5: 기사 모바일 앱
**플랫폼**: React Native (Expo)
**우선순위**: P0
**예상 공수**: 2주

| Story ID | 제목 | 설명 |
|----------|------|------|
| 5.1 | 기사 로그인 | Clerk Phone Auth |
| 5.2 | 당일 운행 명단 조회 | 오전/저녁 탭, 승객 리스트 |
| 5.3 | 운행 시작 | 버튼 클릭, GPS 추적 시작 |
| 5.4 | 승객 수동 체크인 (탑승) | 체크박스 클릭, 탑승 시각 기록 |
| 5.5 | 승객 수동 체크인 (하차) | 체크박스 클릭, 하차 시각 기록 |
| 5.6 | 운행 종료 | GPS 중단, 운행 요약 |
| 5.7 | 내비게이션 연동 | Tmap/카카오내비 외부 앱 실행 |
| 5.8 | 홈 대시보드 | 오늘 운행 현황, 캘린더 |

[📄 상세 문서: `epic-05-driver-mobile-app.md`](./epic-05-driver-mobile-app.md)

---

### Epic 6: 승객/보호자 모바일 앱
**플랫폼**: React Native (Expo)
**우선순위**: P0
**예상 공수**: 2주

| Story ID | 제목 | 설명 |
|----------|------|------|
| 6.1 | 보호자 계정 생성 및 승객 연결 | 초대 코드 입력 |
| 6.2 | 이번 주 운행 일정 조회 | 주간 캘린더 |
| 6.3 | 실시간 셔틀 위치 확인 | React Native Maps, 3초 polling |
| 6.4 | 간단한 ETA 표시 | 직선거리 기반 |
| 6.5 | 운행 시작 푸시 알림 | FCM, 앱 딥링크 |
| 6.6 | 승하차 확인 푸시 알림 | 탑승/하차 알림 |
| 6.7 | 당일 운행 취소 요청 | 결석 시 셔틀 취소 |
| 6.8 | 프로필 및 설정 | 알림 on/off, 로그아웃 |

[📄 상세 문서: `epic-06-passenger-mobile-app.md`](./epic-06-passenger-mobile-app.md)

---

## 🔧 기술 스택 요약

### 프론트엔드
- **웹 (관리자 포털)**: Next.js 16+, TypeScript, Tailwind CSS, shadcn/ui
- **모바일 (기사/승객 앱)**: React Native (Expo), NativeWind

### 백엔드
- **인증**: Clerk
- **ORM**: Prisma
- **DB**: SQLite (dev), PostgreSQL (prod)
- **캐시**: Redis (실시간 위치)
- **푸시 알림**: FCM (Firebase Cloud Messaging)

### 인프라
- **배포**: Vercel (웹), EAS Build (모바일)
- **맵**: Kakao Map / Naver Map (웹), React Native Maps (모바일)
- **내비 연동**: Tmap, Kakao Navi URL Schemes

---

## 📊 Epic 의존성 그래프

```
Epic 1 (기관 관리)
  ↓
Epic 2 (차량/기사 관리)
  ↓
Epic 3 (승객 명단)
  ↓
Epic 4 (실시간 추적) ──→ Epic 5 (기사 앱)
  ↓                          ↓
Epic 6 (승객 앱) ←──────────┘
```

**선행 관계**:
- Epic 2는 Epic 1 완료 후 시작 (기관 ID 필요)
- Epic 3는 Epic 2 완료 후 시작 (차량 ID 필요)
- Epic 4는 Epic 3 완료 후 시작 (Roster ID 필요)
- Epic 5와 6는 Epic 4와 병렬 진행 가능 (API 먼저 구현)

---

## ✅ MVP 완료 조건 (Definition of Done)

### 기능 완료
- [ ] 6개 Epic의 모든 사용자 스토리 구현 완료
- [ ] Prisma 마이그레이션 완료 (모든 모델)
- [ ] 관리자 포털 UI 완성 (shadcn/ui)
- [ ] 기사 앱 빌드 및 배포 (TestFlight/Internal Testing)
- [ ] 승객 앱 빌드 및 배포

### 테스트
- [ ] 단위 테스트 커버리지 > 70%
- [ ] End-to-End 테스트 (기관 등록 → 운행 → 알림)
- [ ] 실기기 테스트 (iOS/Android)
- [ ] 성능 테스트 (API 응답 < 500ms, 지도 로딩 < 3초)

### 파일럿
- [ ] 5개 파일럿 기관 확보
- [ ] 정시 도착률 90% 이상
- [ ] NPS > 50

---

## 🚀 다음 단계 (Stage 2 Preview)

MVP 완료 후 Stage 2에서 추가될 핵심 기능:

1. **AI VRP 엔진**: Google OR-Tools 기반 자동 승차 순서 최적화
2. **정확한 ETA**: AI 경로 최적화 기반 도착 시간 예측
3. **QR/NFC 체크인**: 승객 자동 탑승 확인
4. **GPS Snap-to-Roads**: 도로 보정으로 정확한 주행거리
5. **기본 BI 대시보드**: 정시 도착률, 평균 운행 시간

---

**작성자**: John (Product Manager)
**최종 수정**: 2025-11-09
**문서 버전**: 1.0
