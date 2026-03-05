# [Report] rosters-ui — 운행 계획 UI + 수동 순서 편집

**작성일**: 2026-03-05
**Match Rate**: 100%
**Phase**: Plan → Design → Do → Check → Report ✅
**커밋**: `59ac0b8`, `d32a0af`, `434b2e9`

---

## 1. Executive Summary

기존 "탑승 그룹" + "경로 최적화" 두 메뉴를 **"운행 계획"** 하나로 통합하고, 운행 시나리오를 직관적인 타임라인 플로우로 시각화하였습니다. 이후 관리자가 탑승 순서를 **드래그&드롭으로 수동 변경**하는 기능을 추가하여 완전한 운행 계획 관리 시스템을 완성하였습니다.

빌드 0 에러, 타입 0 에러, API 4개 엔드포인트 모두 200 OK.

---

## 2. 구현 완료 항목

### 2.1 사이드바 통합 (`layout.tsx`)

```
변경 전:
  - 탑승 그룹 → /passenger-groups
  - 경로 최적화 → /rosters

변경 후:
  - 운행 계획 → /rosters (통합)
```

### 2.2 운행 계획 목록 (`rosters/page.tsx`)

| 기능 | 구현 방법 |
|------|-----------|
| 주차별 그룹핑 | `grouped = rosters.reduce(...)` + `sortedWeeks` |
| 접기/펼치기 | `WeekGroup` 컴포넌트 + `useState(open)` |
| 최적화 완료 수 표시 | `rosters.filter(r => r.last_optimized_at).length` |
| 카드 미니 플로우 | `[출발지] → [N명 탑승] → [기관 도착]` ArrowRight |
| 등원/하원 컬러 바 | `h-1 rounded-t-xl` — morning=파란, evening=주황 |
| 운행계획 추가 폼 | `createMutation` (POST /institutions/rosters) |

### 2.3 운행 계획 상세 (`rosters/[rosterId]/optimize/page.tsx`)

| 기능 | 구현 방법 |
|------|-----------|
| 탑승 시나리오 타임라인 | `FlowNode` (출발지/도착지) + `PassengerNode` (승객별) |
| AI 최적화 후 순서 즉시 반영 | `optimizedResult` state → `displayPassengers` 분기 |
| ETA 뱃지 | `+N분` — 최적화 전(회색)/후(파란) 색상 구분 |
| 절감 효과 배너 | 거리단축 km + 연료비 절감 원 + 최적화율 % |
| 출발 정보 편집 | 인라인 편집 + `saveDepartureMutation` (PATCH) |
| **수동 순서 편집** | `SortablePassengerNode` — @dnd-kit 드래그&드롭 |
| **순서 저장** | `reorderMutation` (PATCH /rosters/:id/reorder_passengers) |
| AI 최적화 중 편집 버튼 숨김 | `!optimizedResult` 조건 분기 |

### 2.4 Rails API (`rosters_controller.rb`)

| 엔드포인트 | 추가/수정 |
|-----------|---------|
| `PATCH /rosters/:id/reorder_passengers` | 신규 — passenger_ids 배열 순서대로 boarding_order 갱신 |
| `roster_detail_json` | boarding_order ASC 정렬 (`Arel.sql`) 추가 |
| `roster_json` | `last_optimized_at`, `optimized_distance_m` 필드 추가 |

---

## 3. 핵심 UX 패턴

### 탑승 시나리오 타임라인 (일반 모드)

```
● [출발지 — 서울시 마포구 햇살 어린이집]  ← MapPin 파란 원
│   07:30 출발
│
○ 1  김아이 — 서울시 마포구 성산동 123   +5분
│
○ 2  이아이 — 서울시 마포구 망원동 456   +12분
│
● [기관 도착]  ← Flag 초록 원
    총 8.4 km · 28분 소요
```

### 수동 순서 편집 모드

```
탑승 시나리오 — 순서 편집 중          [취소] [저장]

● [출발지]
│
⊙ 1  최다은(d) — 서교동 D지점      ⠿  ← 드래그 핸들
│
⊙ 2  박채린(c) — 합정동 C지점      ⠿
│
⊙ 3  이병훈(b) — 망원동 B지점      ⠿
│
⊙ 4  김아영(a) — 상암동 A지점      ⠿
│
● [기관 도착]
```

- 호박색 번호 원으로 편집 모드 구분
- 드래그 중 opacity 0.5로 이동 중임을 표시
- 저장 시 boarding_order DB 갱신 + 캐시 무효화

---

## 4. 테스트 결과

| 항목 | 결과 |
|------|------|
| `tsc --noEmit` | ✅ 0 errors |
| `next build` | ✅ 0 errors |
| GET /institutions/rosters | ✅ 200 OK |
| GET /institutions/rosters/:id | ✅ boarding_order ASC 정렬 확인 |
| PATCH /reorder_passengers | ✅ 200 OK, 순서 일치 |
| Gap 분석 (v2) | ✅ 100% (Gap 0개) |

---

## 5. 커밋 이력

| 커밋 | 메시지 |
|------|--------|
| `59ac0b8` | feat: 탑승그룹 → 운행계획 UI 전면 개편 |
| `d32a0af` | chore: rosters-ui Gap 분석 완료 (Match Rate 98%) |
| `434b2e9` | feat: 탑승 시나리오 수동 순서 편집 (드래그&드롭) 구현 |

---

## 6. 결론

운행 계획 UI가 **Match Rate 100%** 로 완전히 완성되었습니다.

- AI 경로 최적화 → 자동 최단 순서 계산
- 수동 순서 편집 → 드래그&드롭으로 관리자 직접 조정
- 두 방식이 자연스럽게 공존하며 실제 현장 운영 요구를 모두 충족합니다.
