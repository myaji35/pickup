# Epic 1: 기관 및 계약 관리

**Epic ID**: EPIC-001
**우선순위**: P0 (Critical)
**Stage**: MVP (Month 1)
**담당 Context**: Institution Context

---

## 📋 Epic 개요

### 목표
PickUp 플랫폼에서 B2B 고객(학원, 요양원, 데이케어센터)을 등록하고 구독 계약을 관리할 수 있는 기반 시스템 구축

### 비즈니스 가치
- 기관 온보딩 프로세스 자동화
- 사업자등록번호 기반 신원 확인
- 계약 및 빌링 기초 데이터 구축
- 기관 관리자 권한 관리

### 성공 지표
- 기관 등록 완료 시간 < 5분
- 사업자등록번호 중복 체크 100% 검증
- 관리자 초대 이메일 발송 성공률 > 95%

---

## 👥 사용자 페르소나

### 1차 사용자: PickUp 운영팀
- **역할**: 플랫폼 관리자
- **니즈**: 파일럿 기관을 빠르게 온보딩하고 계약 정보를 관리
- **페인 포인트**: 수동 데이터 입력, 중복 등록 위험

### 2차 사용자: 기관 관리자
- **역할**: 학원원장, 요양원 관리자, 데이케어센터 책임자
- **니즈**: 자사 정보 확인 및 수정, 담당자 초대
- **페인 포인트**: 복잡한 관리 콘솔

---

## 🎯 범위 (Scope)

### In Scope (MVP 포함)
✅ 기관 기본 정보 CRUD (이름, 사업자등록번호, 주소, 연락처)
✅ 사업자등록번호 중복 검증
✅ 기관 관리자 계정 생성 및 초대
✅ 기관 상태 관리 (활성/비활성)
✅ 기관 목록 조회 및 검색 (관리자 포털)

### Out of Scope (Stage 2 이후)
❌ 구독 플랜 관리 (요금제 선택)
❌ 월간 자동 빌링
❌ 계약서 전자 서명
❌ 사업자등록증 OCR 자동 입력

---

## 📖 사용자 스토리

### Story 1.1: 기관 등록
**As a** PickUp 운영팀
**I want to** 신규 기관을 시스템에 등록
**So that** 파일럿 고객을 빠르게 온보딩할 수 있다

**인수 조건**:
- 기관명, 사업자등록번호(10자리), 주소, 대표 전화번호 입력
- 사업자등록번호 중복 시 에러 메시지 표시
- 등록 완료 시 고유 기관 ID 자동 생성

---

### Story 1.2: 기관 관리자 초대
**As a** PickUp 운영팀
**I want to** 등록된 기관의 관리자를 초대
**So that** 기관 측에서 자체적으로 차량/명단을 관리할 수 있다

**인수 조건**:
- 관리자 이름, 이메일, 휴대폰 번호 입력
- 초대 이메일 자동 발송 (임시 비밀번호 포함)
- 기관당 최소 1명, 최대 5명 관리자 등록 가능

---

### Story 1.3: 기관 정보 수정
**As a** 기관 관리자
**I want to** 우리 기관의 정보를 수정
**So that** 주소 변경이나 연락처 업데이트를 반영할 수 있다

**인수 조건**:
- 기관명, 주소, 전화번호 수정 가능
- 사업자등록번호는 수정 불가 (고객센터 문의 안내)
- 수정 이력 로그 기록

---

### Story 1.4: 기관 목록 조회 및 검색
**As a** PickUp 운영팀
**I want to** 등록된 모든 기관을 조회하고 검색
**So that** 특정 기관의 정보를 빠르게 찾을 수 있다

**인수 조건**:
- 기관명, 사업자등록번호로 검색
- 상태별 필터링 (활성/비활성)
- 페이지네이션 (페이지당 20개)

---

### Story 1.5: 기관 상태 관리
**As a** PickUp 운영팀
**I want to** 기관을 비활성화
**So that** 계약 종료 시 해당 기관의 서비스를 중지할 수 있다

**인수 조건**:
- 활성/비활성 토글
- 비활성화 시 해당 기관의 모든 운행 스케줄 중지 경고 표시
- 비활성화된 기관의 관리자는 로그인 불가

---

## 🔧 기술 고려사항 (High-level)

### 데이터 모델
```
Institution (기관)
- id: UUID
- business_registration_number: String (10자리, unique)
- name: String
- address: String
- phone: String
- status: Enum (active, inactive)
- created_at, updated_at

InstitutionAdmin (기관 관리자)
- id: UUID
- institution_id: FK
- name: String
- email: String (unique)
- phone: String
- role: Enum (owner, manager)
- created_at
```

### API 엔드포인트 (예상)
- `POST /api/institutions` - 기관 등록
- `GET /api/institutions` - 기관 목록 조회
- `GET /api/institutions/:id` - 기관 상세 조회
- `PUT /api/institutions/:id` - 기관 정보 수정
- `POST /api/institutions/:id/admins` - 관리자 초대
- `PATCH /api/institutions/:id/status` - 상태 변경

### 의존성
- 이메일 발송 서비스 (AWS SES, SendGrid 등)
- 사업자등록번호 검증 로직

---

## ✅ 완료 조건 (Definition of Done)

- [ ] 모든 사용자 스토리 개발 완료
- [ ] 관리자 포털 UI에서 CRUD 동작 검증
- [ ] API 단위 테스트 커버리지 > 80%
- [ ] 중복 사업자등록번호 입력 시 에러 처리 확인
- [ ] 관리자 초대 이메일 발송 성공 확인

---

## 📅 일정
- **시작일**: Month 1, Week 1
- **완료일**: Month 1, Week 2
- **예상 공수**: 1.5주 (소규모 팀 기준)

---

## 🔗 관련 문서
- `CLAUDE.md` - 전체 프로젝트 개요
- `docs/architecture.md` - MSA 도메인 설계 (예정)
- `docs/api-spec.md` - API 명세서 (예정)
