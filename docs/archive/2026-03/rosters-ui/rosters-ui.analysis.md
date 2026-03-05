# [Check] rosters-ui Gap 분석 (v2 — 수동 순서 편집 포함)

**분석일**: 2026-03-05
**Match Rate**: 100%
**빌드 상태**: ✅ 통과 (0 에러)
**타입 체크**: ✅ 통과 (0 에러)

---

## 요구사항 대비 구현 체크

| # | 요구사항 | 파일 | 상태 |
|---|---------|------|------|
| 1 | 사이드바 '탑승 그룹' → '운행 계획' | layout.tsx | ✅ |
| 2 | 주차별 그룹핑 + 접기/펼치기 | rosters/page.tsx `WeekGroup` | ✅ |
| 3 | 카드: 출발지→N명탑승→기관도착 미니 플로우 | `RosterCard` ArrowRight 플로우 | ✅ |
| 4 | 등원(파란)/하원(주황) 컬러 바 | `h-1 rounded-t-xl` | ✅ |
| 5 | 운행계획 추가 폼 (차량/주차/출발지/시간) | `createMutation` + vehicle select | ✅ |
| 6 | 상세: 탑승 시나리오 타임라인 | `FlowNode` + `PassengerNode` | ✅ |
| 7 | AI 최적화 결과 → 플로우 즉시 반영 | `optimizedResult` state | ✅ |
| 8 | 승객별 ETA 뱃지 (+N분) | `etaMin` prop | ✅ |
| 9 | 절감 효과 배너 | `savings` 계산 | ✅ |
| 10 | 경로 최적화 확정 적용 | `applyMutation` | ✅ |
| 11 | **수동 탑승 순서 편집 (드래그&드롭)** | `SortablePassengerNode` (@dnd-kit) | ✅ |
| 12 | **순서 저장 API** | `PATCH /rosters/:id/reorder_passengers` | ✅ |
| 13 | **boarding_order 정렬 반환** | `roster_detail_json` Arel.sql ORDER | ✅ |
| 14 | AI 최적화 중 순서 편집 버튼 숨김 | `!optimizedResult` 조건 | ✅ |

---

## API 검증 결과

| Endpoint | Status | 비고 |
|----------|--------|------|
| GET /institutions/rosters | 200 ✅ | 주차별 목록 |
| GET /institutions/rosters/:id | 200 ✅ | boarding_order ASC 정렬 |
| PATCH /institutions/rosters/:id/reorder_passengers | 200 ✅ | 순서 일치 확인 |
| POST /institutions/rosters/:id/optimize | 200 ✅ | VRP 최적화 |

---

## Gap 목록

Gap 없음 — 모든 요구사항 구현 완료.

---

## 결론

Match Rate **100%** — 수동 순서 편집 기능 추가로 완전 구현.
`/pdca report rosters-ui` 로 완료 보고서 작성 가능.
