# [Report] rosters-ui 완료 보고서 (v3)

**완료일**: 2026-03-05
**Match Rate**: 100%
**총 반복 횟수**: 0 (첫 구현 완료)

---

## 1. 기능 요약

탑승 그룹(Roster) 관리 UI의 탑승 시나리오 페이지에 승객 추가/삭제 및 수동 순서 편집 기능을 구현했습니다.

### 구현 범위

| 기능 | 설명 |
|------|------|
| 탑승자 추가 | 기관 전체 승객 중 미배정 활성 승객 검색 후 추가 |
| 탑승자 삭제 | hover X 버튼으로 개별 삭제 |
| 수동 순서 편집 | @dnd-kit 드래그&드롭으로 boarding_order 재정렬 |
| 출발 정보 편집 | departure_address / departure_time 인라인 편집 |
| AI 경로 최적화 | VRP 최적화 + 결과 미리보기 + 확정 적용 |

---

## 2. 구현 파일

| 파일 | 변경 내용 |
|------|---------|
| `frontend/app/institutions/[id]/rosters/[rosterId]/optimize/page.tsx` | 전체 구현 (추가/삭제/순서편집/최적화) |
| `pickup_rails/app/controllers/api/v1/institutions/rosters_controller.rb` | reorder_passengers 액션, boarding_order 정렬 |
| `pickup_rails/config/routes.rb` | PATCH reorder_passengers 라우트 추가 |

---

## 3. API 엔드포인트

| Method | Endpoint | 용도 |
|--------|---------|------|
| GET | /institutions/rosters/:id | roster 상세 + 탑승자 목록 |
| PATCH | /institutions/rosters/:id | 출발 정보 수정 |
| POST | /institutions/rosters/:id/add_passenger | 탑승자 추가 |
| DELETE | /institutions/rosters/:id/remove_passenger/:id | 탑승자 삭제 |
| PATCH | /institutions/rosters/:id/reorder_passengers | 탑승 순서 저장 |
| GET | /institutions/rosters/:id/route_preview | 현재 경로 미리보기 |
| POST | /institutions/rosters/:id/optimize | AI VRP 최적화 |
| POST | /institutions/rosters/:id/apply_optimization | 최적화 결과 확정 |

---

## 4. 주요 기술 결정

- **@dnd-kit**: React 18 호환 드래그&드롭 라이브러리 선택 (react-beautiful-dnd 대신)
- **Arel.sql()**: Rails raw SQL 보안 검사 우회를 위한 `boarding_order ASC NULLS LAST` 정렬
- **lazy fetch**: 승객 추가 패널이 열릴 때만 전체 승객 목록 조회 (`enabled: showAddPanel`)
- **상태 보호**: AI 최적화 진행 중 또는 순서 편집 중 추가/삭제 버튼 숨김으로 충돌 방지

---

## 5. Gap 분석 결과

- v2 분석 (수동 순서 편집): Match Rate 100%
- v3 분석 (승객 추가/삭제): Match Rate 100%
- 총 Gap 항목: 0

---

## 6. 커밋

```
3c84e8a feat: 탑승 시나리오 승객 추가/삭제/순서편집 기능 구현
```

---

## 결론

`rosters-ui` 기능 완전 구현 완료. `/pdca archive rosters-ui` 로 아카이브 가능.
