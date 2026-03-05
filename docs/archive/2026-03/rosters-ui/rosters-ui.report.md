# [Report] rosters-ui — 운행 계획 UI 전면 개편

**작성일**: 2026-03-05
**Match Rate**: 98%
**Phase**: Do → Check → Report ✅
**커밋**: `59ac0b8`, `d32a0af`

---

## 1. Executive Summary

기존 "탑승 그룹" + "경로 최적화" 두 메뉴를 **"운행 계획"** 하나로 통합하고, 운행 시나리오를 직관적인 타임라인 플로우로 시각화하였습니다. 빌드 0 에러, 타입 0 에러로 완전한 품질 기준을 달성하였습니다.

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
| 최적화 완료 수 표시 | `optimized = rosters.filter(r => r.last_optimized_at).length` |
| 카드 미니 플로우 | `[출발지] → [N명 탑승] → [기관 도착]` ArrowRight 연결 |
| 등원/하원 컬러 바 | `h-1 rounded-t-xl` — morning=파란, evening=주황 |
| 운행계획 추가 폼 | `createMutation` (POST /institutions/rosters) |
| 빈 상태 CTA | "첫 운행 계획 추가하기" 링크 버튼 |

### 2.3 운행 계획 상세 (`rosters/[rosterId]/optimize/page.tsx`)

| 기능 | 구현 방법 |
|------|-----------|
| 탑승 시나리오 타임라인 | `FlowNode` (출발지/도착지) + `PassengerNode` (승객별) |
| AI 최적화 후 순서 즉시 반영 | `optimizedResult` state → `displayPassengers` 분기 |
| ETA 뱃지 | `+N분` — 최적화 전(회색)/후(파란) 색상 구분 |
| 절감 효과 배너 | 거리단축 km + 연료비 절감 원 + 최적화율 % |
| 출발 정보 편집 | 인라인 편집 + `saveDepartureMutation` (PATCH) |
| 초기화 버튼 | `setOptimizedResult(null)` |

---

## 3. 핵심 UX 패턴

### 탑승 시나리오 타임라인

```
● [출발지 — 서울시 마포구 햇살 어린이집]  ← MapPin 파란 원
│   07:30 출발
│
○ 1  김아이 — 서울시 마포구 성산동 123   +5분  ← 회색 번호 원
│
○ 2  이아이 — 서울시 마포구 망원동 456   +12분
│
○ 3  박아이 — 서울시 마포구 합정동 789   +18분
│
○ 4  최아이 — 서울시 마포구 동교동 012   +24분
│
● [기관 도착]  ← Flag 초록 원
    총 8.4 km · 28분 소요
```

AI 최적화 실행 시 번호 원이 파란색으로 변경되며 새 순서와 ETA가 즉시 반영됩니다.

---

## 4. 테스트 결과

| 항목 | 결과 |
|------|------|
| `tsc --noEmit` | ✅ 0 errors |
| `next build` | ✅ 0 errors, 모든 페이지 빌드 성공 |
| API 연동 (`GET /institutions/rosters`) | ✅ 정상 (Roster#11 — 4명) |
| Gap 분석 | ✅ 98% (1개 minor gap 즉시 수정) |

---

## 5. 잔여 항목 (2% Gap)

- `passenger-groups` 라우트 페이지 (`page.tsx`) 파일 자체는 미삭제 상태 (기능적으로 무해, 빌드에 영향 없음)
- AI 최적화 결과 비교 "Before / After" 나란히 보기 패널 미포함 (상세 페이지에서 타임라인 단일 뷰로 대체)

---

## 6. 커밋 이력

| 커밋 | 메시지 |
|------|--------|
| `59ac0b8` | feat: 탑승그룹 → 운행계획 UI 전면 개편 |
| `d32a0af` | chore: rosters-ui Gap 분석 완료 (Match Rate 98%) |

---

## 7. 결론

운행 계획 UI 개편이 **Match Rate 98%** 로 성공적으로 완료되었습니다. 탑승 시나리오 타임라인 플로우가 직관적으로 구현되어 관제 담당자가 등·하원 운행 순서를 한눈에 파악하고 AI 최적화를 바로 적용할 수 있습니다.
