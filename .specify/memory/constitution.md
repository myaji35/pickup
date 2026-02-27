<!--
Sync Impact Report:
- Version: 1.0.0 → 1.1.0
- Modified Principles: N/A
- Added Sections:
  - "VI. 단계별 가치 전달 우선순위 (Incremental Value Delivery)" - 새로운 원칙 추가
  - "Post-MVP Roadmap (Stage 2-3)" - 상세 로드맵 추가
- Removed Sections: N/A
- Templates Requiring Updates:
  - ✅ plan-template.md - Stage 2/3 계획 반영 필요
  - ✅ spec-template.md - 새로운 원칙 VI 반영 확인
  - ✅ tasks-template.md - 단계별 태스크 분류 반영
- Follow-up TODOs:
  - Plan.md에 Stage 2 상세 계획 추가
  - Tasks.md에 Phase 12-15 태스크 분해
-->

# Pickup MaaS 플랫폼 헌장 (Constitution)

## 핵심 원칙 (Core Principles)

### I. 마이크로서비스 우선 (Microservices-First)

모든 기능은 명확한 경계를 가진 독립적인 마이크로서비스로 설계되어야 한다.

- **필수 요구사항**:
  - Domain-Driven Design(DDD)의 Bounded Context를 준수
  - 각 서비스는 독립적으로 배포 및 확장 가능해야 함
  - 서비스 간 통신은 이벤트 기반 아키텍처(Kafka/RabbitMQ) 또는 API Gateway를 통해서만 수행
  - 데이터베이스는 서비스별로 분리 (Database per Service)

- **근거**: B2B 서비스의 확장성과 유지보수성을 보장하며, 초기부터 모놀리스 기술 부채를 방지한다.

### II. AI 기반 최적화 중심 (AI-Driven Optimization)

승객 탑승 순서는 고정 경로가 아닌 AI 최적화 엔진(VRP-PDTW)에 의해 동적으로 생성되어야 한다.

- **필수 요구사항**:
  - Google OR-Tools를 활용한 VRP 솔버 구현
  - 차량 용량 제약(5-15인승), 시간 창(Time Window), 픽업-드롭오프 제약을 모두 고려
  - 실시간 경로 재계산 및 ETA 갱신 지원
  - 최적화 결과는 승객 명단(Roster)에 탑승 순서로 반영

- **근거**: 이 기능이 프로젝트의 핵심 차별화 요소이며, 가장 복잡한 기술적 도전 과제다.

### III. 테스트 우선 개발 (Test-First Development) - 타협 불가

모든 기능은 테스트 작성 → 사용자 승인 → 실패 확인 → 구현 순서로 개발되어야 한다.

- **필수 요구사항**:
  - TDD(Test-Driven Development) 강제: Red-Green-Refactor 사이클 준수
  - 단위 테스트는 독립적이고 빠르게 실행 가능해야 함
  - 통합 테스트는 서비스 간 계약, API 엔드포인트, 이벤트 스트림을 검증
  - 최소 테스트 커버리지: 핵심 비즈니스 로직 90% 이상

- **근거**: B2B 서비스의 신뢰성과 안전성은 타협할 수 없으며, 테스트는 리팩토링과 확장의 안전망이다.

### IV. 실시간 데이터 파이프라인 신뢰성 (Real-time Data Pipeline Reliability)

GPS 트래킹, 차량 텔레메트리, 승객 알림은 실시간으로 처리되어야 한다.

- **필수 요구사항**:
  - MQTT 프로토콜을 통한 차량 IoT 데이터 수집
  - Kafka 스트리밍을 통한 이벤트 처리 (차량 위치, 탑승/하차 이벤트)
  - Redis 캐시를 통한 실시간 대시보드 데이터 제공
  - 지오펜싱(Geofencing) 기반 승객 도착 알림

- **근거**: 실시간 위치 추적과 알림은 서비스 품질의 핵심이며, 보호자의 안심과 직결된다.

### V. 관측 가능성 및 투명성 (Observability & Transparency)

모든 서비스는 구조화된 로그, 메트릭, 트레이스를 제공하여 운영 투명성을 보장해야 한다.

- **필수 요구사항**:
  - 구조화된 로깅 (JSON 포맷)
  - 분산 트레이싱 (OpenTelemetry 또는 Jaeger)
  - 핵심 메트릭 수집: 정시 도착률, 연료 효율, 운전자 안전 점수, 차량 고장 예측
  - BI 대시보드를 통한 B2B 고객 투명성 제공

- **근거**: B2B 고객은 비용 투명성, 안전성, 규정 준수를 중시하며, 데이터 기반 의사결정을 요구한다.

### VI. 단계별 가치 전달 우선순위 (Incremental Value Delivery)

각 개발 단계는 독립적으로 배포 가능한 비즈니스 가치를 제공해야 하며, 이전 단계의 안정성을 전제로 진행한다.

- **필수 요구사항**:
  - MVP 완료 후 Stage 2 진행: AI VRP 엔진 구현 전 인증/인가 시스템 완성 필수
  - 각 Stage는 최소 1개의 완전한 사용자 여정(User Journey)을 제공
  - 새로운 Stage 시작 전 이전 Stage의 테스트 커버리지 90% 이상 달성
  - 기술 부채(Technical Debt) 정리 후 다음 Stage 진행

- **근거**: 초기 품질 확보 없이 복잡도를 추가하면 기술 부채가 누적되어 전체 프로젝트가 위험해진다.

## 아키텍처 제약사항 (Architecture Constraints)

### 기술 스택 표준

- **컨테이너화**: Docker + Kubernetes
- **API Gateway**: Apigee 또는 AWS API Gateway
- **메시지 브로커**: Kafka (또는 RabbitMQ)
- **데이터베이스**:
  - 관계형: PostgreSQL (트랜잭션 데이터)
  - NoSQL: DynamoDB 또는 MongoDB (실시간 차량 상태)
  - 캐시: Redis (대시보드, 세션)
- **클라우드 제공자**: GCP, AWS, 또는 Azure 관리형 서비스 우선
- **AI/ML**: Google OR-Tools (VRP), Python 기반 머신러닝 파이프라인
- **모바일**: React Native 또는 Flutter (크로스 플랫폼)
- **OCR**: NAVER CLOVA OCR 또는 Kakao i OCR (영수증 처리)

### Bounded Contexts (DDD)

1. **Institution Context**: 기관 관리, 계약, 구독, 월별 청구
2. **Fleet Context**: 차량 관리, 텔레메트리, 차량 상태
3. **Roster Context**: 주간 승객 명단, 탑승 순서, 탑승/하차 상태
4. **Route Context**: VRP 엔진, 경로 최적화, ETA 계산
5. **User Context**: 인증/인가 (기관 관리자, 운전자, 승객/보호자)

### 보안 및 규정 준수

- 개인정보 보호: GDPR 및 한국 개인정보보호법 준수
- 데이터 암호화: 전송 중(TLS 1.3), 저장 시(AES-256)
- 인증: OAuth 2.0 + JWT, 역할 기반 접근 제어(RBAC)
- 감사 로그: 모든 중요 작업(계약 변경, 차량 배정, 경로 수정)에 대한 감사 추적

## 개발 워크플로우 (Development Workflow)

### 단계별 출시 전략 (Phased Rollout)

**MVP (Phase 1-11) - 완료됨**:
- ✅ Fleet Management: Vehicle CRUD, PassengerGroup 관리, Vehicle-Group 연결
- ✅ Roster Management: Passenger CRUD, CSV 업로드, 템플릿 다운로드
- ✅ Care Time Validation: 8시간 케어 시간 자동 계산 및 검증
- ✅ Institution Type Management: 기관 유형별 규칙 설정
- 🚧 User Authentication: JWT 기반 인증 (진행중 - Phase 11)

**Stage 2 (확장 및 최적화) - 다음 목표**:

*Phase 12: SaaS Admin Portal 완성*
- Admin 대시보드 UI (회원사 승인/관리)
- 회원사 상태 관리 (PENDING → ACTIVE → SUSPENDED)
- 요금제 및 구독 관리
- 시스템 사용자 관리 (SUPER_ADMIN 전용)

*Phase 13: Institution Self-Service*
- 회원사 가입 신청 페이지
- 회원사별 통계 대시보드
- 회원사 설정 페이지 (자사 정보 수정)

*Phase 14: 운전자 모바일 앱 MVP*
- 운행 시작/종료 기능
- 일일 승객 명단 조회
- 수동 승객 체크인/체크아웃
- 네비게이션 연동 (Tmap, Kakao Navi)

*Phase 15: 승객/보호자 모바일 앱 MVP*
- 스케줄 및 ETA 조회
- 실시간 셔틀 위치 추적 (지도)
- Push 알림 (운행 시작, 접근 중, 탑승/하차 확인)

*Phase 16: AI VRP 엔진 통합*
- Google OR-Tools VRP 솔버 구현
- Roster → Route 자동 변환
- 탑승 순서 최적화 알고리즘
- 관리자 포털 "최적화" 버튼 추가
- 최적화 결과 시각화 (지도 + 순서)

*Phase 17: 기본 BI 대시보드*
- 정시 도착률 분석
- 차량별 운행 통계
- 연료 비용 집계
- 운전자 안전 점수 (기본 GPS 데이터 기반)

**Stage 3 (고급 MaaS - 차별화)**:

*Phase 18: OBD-II/CAN Bus 통합*
- 텔레메트리 디바이스 연동 (MQTT)
- 실시간 차량 상태 수집 (연료, RPM, 속도, 오도미터)
- 운전 행동 분석 (급가속/급제동, 과속, 공회전)
- 예측 정비 알림

*Phase 19: 고급 BI 대시보드*
- 연료 효율 분석
- 운전자 안전 점수 (상세 CAN Bus 데이터)
- 차량 고장 예측 모델
- 비용 투명성 리포트 (B2B 고객용)

*Phase 20: QR/NFC 승객 체크인*
- QR 코드 생성 및 스캔 (운전자 앱)
- NFC 태그 인식 (선택 사항)
- 자동 탑승/하차 기록

*Phase 21: BLE 비콘 자동 체크인*
- BLE 비콘 + LTE 단말기 통합
- 지오펜스 기반 자동 탑승/하차 감지
- 보호자 안전 알림 (어린이/노인 대상)

*Phase 22: 수요 응답형 임시 셔틀*
- 임시 셔틀 요청 UI (승객 앱)
- 동적 경로 재계산 (VRP 재실행)
- 운전자 요청 수락/거부 (운전자 앱)

*Phase 23: OCR 영수증 처리*
- 운전자 앱 영수증 업로드 (연료, 정비)
- NAVER CLOVA OCR 또는 Kakao i OCR 통합
- 자동 비용 기록 및 청구

### 코드 리뷰 및 품질 게이트

- 모든 PR은 최소 1명의 승인 필수
- 자동화된 테스트 통과 (CI/CD 파이프라인)
- Constitution 원칙 준수 확인 (체크리스트 활용)
- 복잡도 증가는 명확한 근거와 함께 문서화

### 우선순위 결정 기준

1. **사용자 인증/인가 완성 (Phase 11 완료)**: SaaS 플랫폼의 기반이므로 최우선
2. **Admin Portal & Self-Service (Phase 12-13)**: 회원사 관리 워크플로우 완성
3. **모바일 앱 MVP (Phase 14-15)**: 운전자/승객 핵심 여정 구현
4. **AI VRP 엔진 (Phase 16)**: 가장 복잡한 기술 과제, 조기 검증 필수
5. **BI 대시보드 (Phase 17)**: B2B 가치 제공 (비용 투명성)
6. **텔레메트리 & 고급 기능 (Phase 18-23)**: 차별화 요소, 단계별 추가

## 거버넌스 (Governance)

### 헌장 우선 원칙

이 헌장은 모든 개발 관행과 의사결정에 우선한다. 충돌 시 헌장이 최우선이며, 예외는 명시적으로 문서화되고 승인되어야 한다.

### 수정 절차

- 헌장 수정은 핵심 팀원 과반수 승인 필요
- 수정 사유, 영향 범위, 마이그레이션 계획을 포함한 문서 작성
- 버전 관리:
  - **MAJOR**: 원칙 삭제 또는 근본적 재정의 (하위 호환성 없음)
  - **MINOR**: 새로운 원칙 추가 또는 섹션 확장
  - **PATCH**: 명확화, 문구 수정, 오타 수정

### 준수 검토

- 모든 PR/리뷰는 헌장 준수 여부를 검증해야 함
- 주간 회고에서 헌장 위반 사례 논의 및 개선
- 분기별 헌장 업데이트 검토 (필요시)

### 복잡도 정당화

- 새로운 기술 스택 도입은 명확한 비즈니스 가치와 함께 제안
- "단순성 우선" 원칙: YAGNI (You Aren't Gonna Need It) 적용
- 과도한 엔지니어링(Over-engineering)은 명시적으로 거부

**Version**: 1.1.0 | **Ratified**: 2025-11-18 | **Last Amended**: 2025-11-19
