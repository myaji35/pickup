# [Check] rosters-ui Gap 분석 (v3 — 승객 추가/삭제 포함)

**분석일**: 2026-03-05
**Match Rate**: 100%
**빌드 상태**: TypeScript 0 에러
**기준**: 이전 v2 분석(수동 순서 편집) + 신규 요구사항(승객 추가/삭제)

---

## 요구사항 대비 구현 체크

| # | 요구사항 | 파일 | 상태 |
|---|---------|------|------|
| 1 | 탑승자 삭제 (hover X 버튼) | `PassengerNode` `onRemove` prop + `removePassengerMutation` | ✅ |
| 2 | 삭제 중 로딩 스피너 표시 | `isRemoving` prop → `Loader2 animate-spin` | ✅ |
| 3 | 삭제 API (DELETE /rosters/:id/remove_passenger/:id) | `railsClient.delete(...)` | ✅ |
| 4 | 삭제 후 roster 재조회 (캐시 무효화) | `qc.invalidateQueries route-preview + rosters` | ✅ |
| 5 | 탑승자 추가 패널 토글 | `showAddPanel` state + `setShowAddPanel` | ✅ |
| 6 | 기관 전체 승객 목록 (추가 패널용, lazy fetch) | `allPassengers` query `enabled: showAddPanel` | ✅ |
| 7 | 미배정 승객 필터 (이미 탑승자 제외) | `allPassengers?.filter(p => !currentIds.has(p.id))` | ✅ |
| 8 | 승객 검색 | `addSearch` state + `toLowerCase().includes` | ✅ |
| 9 | 승객 추가 버튼 → API 호출 | `addPassengerMutation.mutate(p.id)` | ✅ |
| 10 | 추가 API (POST /rosters/:id/add_passenger) | `railsClient.post(...)` | ✅ |
| 11 | 추가 후 roster 재조회 | `qc.invalidateQueries route-preview + rosters` | ✅ |
| 12 | AI 최적화 중 추가/삭제 버튼 숨김 | `!optimizedResult && !isEditingOrder` 조건 | ✅ |
| 13 | Rails: add_passenger 중복 체크 | `roster_passengers.exists?(passenger_id: ...)` | ✅ |
| 14 | Rails: remove_passenger 존재 확인 | `find_by(passenger_id: ...) unless rp` | ✅ |

---

## API 검증

| Endpoint | 구현 | 비고 |
|----------|------|------|
| POST /institutions/rosters/:id/add_passenger | ✅ | `passenger_id` body 파라미터 |
| DELETE /institutions/rosters/:id/remove_passenger/:passenger_id | ✅ | URL 파라미터 |
| PATCH /institutions/rosters/:id/reorder_passengers | ✅ | v2에서 검증 완료 |

---

## Gap 목록

Gap 없음 — 모든 신규 요구사항 구현 완료.

---

## 결론

Match Rate **100%** — 승객 추가/삭제 기능 추가로 탑승 시나리오 관리 완전 구현.
`/pdca report rosters-ui` 로 완료 보고서 작성 가능.
