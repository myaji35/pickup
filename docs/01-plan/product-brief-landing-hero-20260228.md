# Product Brief: Pickup MaaS 랜딩페이지 히어로 애니메이션

**Date:** 2026-02-28
**Author:** 강승식 (대표님)
**Context:** B2B SaaS 마케팅 랜딩페이지 — 히어로 섹션 시각화

---

## Executive Summary

Pickup MaaS의 랜딩페이지 히어로 영역에 **"도심 속 항공 관제실"** 메타포를 기반으로 한 인터랙티브 Canvas 애니메이션을 구현한다. 다크 관제실 배경 위에서 복수의 차량이 실시간으로 이동하고, 탑승 완료 시 소나 펄스 효과가 발생하는 3장면 루프 시퀀스로 구성된다. 방문자는 마우스 인터랙션을 통해 관제탑 시점을 직접 체험하며, B2B 기관 담당자에게 서비스의 전문성과 신뢰감을 0.5초 안에 전달한다.

---

## Core Vision

### Problem Statement

기존 B2B SaaS 랜딩페이지는 스크린샷이나 정적 일러스트로 서비스를 설명하여, 방문자가 실제 서비스 가치를 직관적으로 파악하기 어렵다. Pickup MaaS의 핵심 차별점인 **실시간 다차량 관제**와 **AI 경로 최적화**는 텍스트로 설명하기보다 **직접 보여주는 것**이 훨씬 효과적이다.

### Problem Impact

- 기관 담당자(의사결정권자)는 랜딩페이지 체류 시간이 짧음 (평균 15~30초)
- 복잡한 기능 설명 텍스트는 이탈률 증가
- 경쟁사와 차별화되지 않는 일반적인 SaaS 히어로는 기억에 남지 않음

### Why Existing Solutions Fall Short

| 기존 방식 | 한계점 |
|-----------|--------|
| 정적 스크린샷 | 서비스 동작 방식 전달 불가 |
| 설명 텍스트 위주 | 의사결정권자의 시선을 붙잡지 못함 |
| 일반적 지도 UI | 경쟁사(Kakao, Naver) 대비 차별화 부재 |
| 동영상 배경 | 로딩 느림, 모바일 배터리 소모, 조작 불가 |

### Proposed Solution

**"도심 속 항공 관제실"** — Canvas API 기반 인터랙티브 애니메이션 히어로

```
핵심 구성:
1. 다크 네이비/블랙 배경 + 추상화된 도시 격자 지도
2. 네온 시안/그린 색상의 차량 블립 + 경로선
3. 3장면 자동 루프 시퀀스 (전체뷰 → 이동중 → 탑승완료)
4. 접속 시 레이더 파워온 연출
5. 마우스 → 차량 반응 인터랙션
6. B2B 신뢰 헤드라인 + KPI 카운터
```

### Key Differentiators

1. **인터랙티브**: 방문자가 직접 관제탑 시점 체험 (경쟁사 없음)
2. **항공 관제 메타포**: 전문성·정밀함·신뢰감을 시각적으로 즉시 전달
3. **절제된 임팩트**: Uber Freight 스타일 — 복잡하지 않고 핵심만
4. **확장성**: 향후 실 데이터 연동 구조로 설계

---

## Target Users

### Primary Users

**기관 담당자 (B2B 의사결정권자)**
- 어린이집/유치원 원장, 학교 행정실장, 기업 복지 담당자
- 핵심 니즈: "우리 아이들/직원들이 안전하게 이동하는가?"
- 랜딩페이지 방문 목적: 서비스 신뢰도 확인 → 무료 시작 or 문의
- 기술 친숙도: 중간 (스마트폰/PC 일반 사용자)

### Secondary Users

**운수/운영 담당자**
- 실무 차원에서 서비스 도입을 검토하는 실무자
- 핵심 니즈: "기존 방식보다 효율적인가? 배우기 쉬운가?"

### User Journey

```
랜딩페이지 접속
    ↓
히어로 애니메이션 0.5초 → "이게 뭐지?" 호기심
    ↓
마우스 인터랙션 → "내가 조작할 수 있구나" 체험
    ↓
헤드라인 읽기 → "기관 셔틀 관리 서비스구나" 이해
    ↓
KPI 카운터 확인 → "이미 많이 쓰고 있구나" 신뢰
    ↓
CTA 클릭 → "무료로 시작해보자"
```

---

## Success Metrics

### Business Objectives

1. 랜딩페이지 → 회원가입 전환율 향상
2. 페이지 평균 체류 시간 증가 (목표: 60초 이상)
3. 히어로 섹션 이탈률 감소
4. 브랜드 인지도 및 전문성 인식 향상

### Key Performance Indicators

| KPI | 현재 | 목표 |
|-----|------|------|
| 히어로 → CTA 클릭률 | 측정 전 | 8%+ |
| 평균 체류 시간 | 측정 전 | 60초+ |
| 히어로 구간 스크롤 깊이 | 측정 전 | 80%+ |
| 모바일 로딩 3초 이내 | - | 100% |

---

## MVP Scope

### Core Features

**Phase 1 — 즉시 구현 (1~2주)**

1. **다크 관제실 Canvas 애니메이션**
   - 추상화된 도시 격자 지도 (실제 지도 아님)
   - 차량 3~5대 네온 시안 블립 + 경로선
   - 탑승완료 소나 펄스 ping 효과

2. **접속 시 파워온 연출**
   - 검은 화면 → 그리드 라인 확산 → 차량 등장 → 경로 그려짐

3. **3장면 자동 루프**
   - 전체 관제뷰(줌아웃) → 실시간 이동 → 탑승완료 → 반복

4. **B2B 신뢰 헤드라인 + 서브카피**
   ```
   헤드라인: 기관의 이동을 완벽하게 관리합니다
   서브카피: 실시간 경로 최적화부터 탑승 확인까지,
             하나의 관제 화면으로.
   ```

5. **KPI 카운터 (더미 데이터)**
   - 운행 기관 230+ / 누적 탑승 12만+ / 정시율 99.2%
   - countUp.js 스타일 숫자 올라가는 효과

6. **CTA 버튼 단일화**
   - "무료로 시작하기" 버튼 1개

**Phase 2 — 후속 구현 (1주 추가)**

7. **마우스 인터랙션**
   - 커서 근처 차량 반응
   - 정류장 호버 시 툴팁 팝업

### Out of Scope for MVP

- 실시간 라이브 데이터 연동 (향후 Rails API 연동)
- 실제 지도 (Kakao/Google Maps) 사용
- 영상 배경
- 다국어 지원

### MVP Success Criteria

- [ ] 데스크탑/모바일 반응형 동작
- [ ] 모바일에서 Canvas 대신 정적 이미지 fallback
- [ ] 로딩 3초 이내 (LCP 기준)
- [ ] 파워온 연출 2초 이내 완료
- [ ] 루프 시퀀스 자연스러운 전환

### Future Vision

1. **KPI 실 데이터 연동** — Rails API `/api/v1/stats/public` 엔드포인트 개발
2. **방문자 위치 기반 지도** — 방문자 도시를 배경 격자에 반영
3. **인터랙티브 데모 모드** — 히어로에서 가상 경로 최적화 직접 체험
4. **실시간 라이브 관제 히어로** — 익명화된 실제 운행 데이터 표시

---

## Market Context

**레퍼런스 분석:**

| 서비스 | 히어로 스타일 | Pickup 벤치마킹 포인트 |
|--------|--------------|----------------------|
| Uber Freight | 지도 기반, 심플, 임팩트 | 전체 스타일 방향 |
| Palantir | 다크 데이터 시각화, 전문적 | 색상 팔레트, 전문성 톤 |
| Linear | 제품 자체가 히어로 | 실제 UI 느낌 전달 |
| Stripe | 신뢰 + 기술력 동시 표현 | B2B 카피 톤 |

**국내 경쟁사 현황:**
- 대부분 정적 스크린샷 또는 일반 동영상 배경
- 인터랙티브 히어로 애니메이션 사례 없음 → 차별화 기회

---

## Technical Preferences

**구현 기술 스택:**

```
프레임워크: Next.js 14 (App Router)
애니메이션: Canvas API (또는 Three.js — 성능 비교 후 결정)
카운터: countUp.js 또는 커스텀 구현
인터랙션: requestAnimationFrame + mousemove 이벤트
모바일 fallback: 정적 PNG 이미지
```

**성능 요구사항:**
- LCP (Largest Contentful Paint): 3초 이내
- Canvas 애니메이션 60fps (데스크탑)
- 모바일: reduced-motion 미디어 쿼리 대응
- 번들 크기: Canvas 라이브러리 포함 50KB 이하

**파일 위치:**
```
frontend/app/page.tsx            ← 랜딩페이지 메인
frontend/components/landing/
  ├── HeroSection.tsx            ← 히어로 섹션 컨테이너
  ├── ControlCanvas.tsx          ← Canvas 애니메이션 핵심
  ├── KpiCounter.tsx             ← KPI 카운터
  └── HeroCta.tsx                ← 헤드라인 + CTA
```

---

## Risks and Assumptions

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 모바일 Canvas 성능 저하 | 높음 | 정적 이미지 fallback 필수 |
| 파워온 연출 로딩 지연 | 중간 | skeleton → 애니메이션 순차 로드 |
| 마우스 인터랙션 복잡도 | 중간 | Phase 2로 분리, MVP에서 선택적 |
| KPI 더미 데이터 신뢰성 | 낮음 | 실제 데이터와 유사한 수치 사용 |

---

## Timeline

```
Week 1:
  - Canvas 기본 구조 + 차량 이동 애니메이션
  - 접속 파워온 연출
  - 3장면 루프 시퀀스

Week 2:
  - 헤드라인 + KPI 카운터 + CTA
  - 반응형 처리 + 모바일 fallback
  - 성능 최적화

Week 3 (선택):
  - 마우스 인터랙션 구현
  - 랜딩페이지 나머지 섹션 구현
```

---

## Supporting Materials

- **브레인스토밍 세션 결과:** `docs/brainstorming-session-landing-hero-20260228.md`
- **프로젝트 아키텍처:** `docs/architecture.md`
- **Rails API 스펙:** `docs/api-spec.md`

---

_This Product Brief captures the vision and requirements for Pickup MaaS 랜딩페이지 히어로 애니메이션._

_It was created through collaborative discovery and reflects the unique needs of this B2B SaaS 마케팅 랜딩페이지 project._

_Next: 히어로 Canvas 애니메이션 구현 (frontend/app/page.tsx)_
