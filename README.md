# Pickup MaaS - 송영 서비스 관리 플랫폼

B2B 송영 서비스를 위한 차량 및 승객 관리 SaaS 플랫폼

## 📋 프로젝트 개요

Pickup MaaS는 재가장기요양기관, 주간보호센터 등의 기관을 위한 송영 서비스 관리 플랫폼입니다. 5-15인승 차량을 이용한 오전/오후 정기 셔틀과 임시 셔틀 서비스를 통합 관리합니다.

### 핵심 기능

- **🏢 회원사 관리**: 기관 가입 승인, 상태 관리(활성/정지/비활성)
- **👥 사용자 인증**: JWT 기반 인증, Role 기반 권한 관리(SUPER_ADMIN, INSTITUTION_ADMIN, DRIVER)
- **💳 구독 관리**: 요금제 기반 구독 시스템(스타터/프로/엔터프라이즈)
- **📊 Admin Portal**: 회원사 승인, 통계, 사용 현황 모니터링
- **🚗 차량 관리**: 차량번호 뒤 4자리 기반 식별, 승객 그룹 연결
- **👤 승객 관리**: 승객 명단, 스케줄, 8시간 케어 시간 검증(주간보호)
- **📈 통계 대시보드**: KPI 카드, 회원사 현황, 매출 통계

## 🏗️ 시스템 아키텍처

### Tech Stack

**Backend**
- NestJS 10 (TypeScript)
- PostgreSQL 15+ (Prisma ORM)
- JWT Authentication
- Passport.js (Guards & Strategies)
- Vitest (Unit/Integration/E2E Tests)

**Frontend**
- Next.js 14 (App Router)
- React 18 (TypeScript)
- Tailwind CSS
- shadcn/ui Components
- React Context (State Management)

**Database**
- PostgreSQL 15+
- Prisma Schema with DDD approach
- Multi-tenancy support (Institution-scoped data)

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x LTS
- PostgreSQL 15+
- npm or yarn

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/pickup-maas.git
cd pickup-maas
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
DATABASE_URL="postgresql://username:password@localhost:5432/pickup_maas"
JWT_ACCESS_SECRET="your-secret-key-here"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="7d"

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed initial data (Plans, SUPER_ADMIN, Test Institutions)
npm run db:seed

# Start backend server
npm run dev
```

Backend will run on `http://localhost:3012`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local
NEXT_PUBLIC_API_URL=http://localhost:3012/backend/api/v1

# Start frontend dev server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Access Admin Portal

1. Navigate to `http://localhost:3000/admin/login`
2. Login with default SUPER_ADMIN account:
   - Email: `admin@pickup.com`
   - Password: `admin123!@#`

## 📁 Project Structure

```
pickup-maas/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── seed.ts                # Seed data script
│   │   └── migrations/            # Database migrations
│   ├── src/
│   │   ├── user/                  # User context (Auth, RBAC)
│   │   ├── institution/           # Institution context
│   │   ├── subscription/          # Subscription & Plan management
│   │   ├── roster/                # Passenger & Vehicle management
│   │   ├── route/                 # Route optimization (Q1)
│   │   ├── notification/          # Push notifications (Q1)
│   │   └── common/                # Shared utilities
│   └── test/
│       └── e2e/                   # E2E tests
│
├── frontend/
│   ├── app/
│   │   ├── (admin)/               # Admin portal routes
│   │   │   └── admin/
│   │   │       ├── dashboard/     # Dashboard home
│   │   │       ├── institutions/  # Institution management
│   │   │       ├── users/         # User management
│   │   │       ├── plans/         # Plan management
│   │   │       └── stats/         # Statistics
│   │   ├── (auth)/                # Auth routes (login, register)
│   │   └── (marketing)/           # Landing page (future)
│   ├── components/
│   │   ├── admin/                 # Admin portal components
│   │   ├── auth/                  # Auth components
│   │   └── ui/                    # shadcn/ui components
│   ├── contexts/                  # React contexts
│   │   └── auth-context.tsx      # Authentication state
│   ├── hooks/                     # Custom React hooks
│   └── lib/                       # Utilities & API client
│
└── docs/
    ├── TESTING_GUIDE.md           # Testing guide
    └── API.md                     # API documentation
```

## 🗄️ Database Schema

### Core Entities

- **User**: 시스템 사용자 (SUPER_ADMIN, INSTITUTION_ADMIN, DRIVER)
- **Institution**: 회원사 (재가장기요양기관, 주간보호센터 등)
- **InstitutionType**: 기관 유형 (주간보호, 일반)
- **Plan**: 요금제 (스타터, 프로, 엔터프라이즈)
- **Subscription**: 구독 정보 (회원사별 요금제 할당)
- **Vehicle**: 차량 (5-15인승)
- **Passenger**: 승객
- **PassengerGroup**: 승객 그룹 (차량 배정 단위)
- **PassengerSchedule**: 승객 스케줄 (8시간 케어 검증)
- **Route**: 최적화된 경로 (Q1 - OR-Tools VRP)
- **Notification**: 푸시 알림 (Q1 - FCM)

### Entity Relationships

```
User ──────────┐
               │
Institution ───┼─── Subscription ─── Plan
    │          │
    ├──────────┘
    │
    ├─── Vehicle ─── PassengerGroup ─── Passenger ─── PassengerSchedule
    │
    ├─── Route (Q1)
    └─── DeviceToken (Q1)
```

## 🔐 Authentication & Authorization

### Roles

- **SUPER_ADMIN**: 시스템 관리자 (모든 회원사 관리, 요금제 관리)
- **INSTITUTION_ADMIN**: 회원사 관리자 (자사 데이터 관리)
- **DRIVER**: 운전기사 (운행 정보 조회, 승객 체크인)

### Authentication Flow

1. User logs in with email/password
2. Backend validates credentials (bcrypt)
3. Backend generates JWT access token (15min) and refresh token (7days)
4. Frontend stores tokens in localStorage
5. Frontend sends access token in Authorization header for protected requests
6. Backend validates token using JwtAuthGuard and RolesGuard

## 📡 API Documentation

### Base URL

```
http://localhost:3012/backend/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/login` | 로그인 | No |
| POST | `/auth/register` | 회원가입 (Institution 동시 생성) | No |
| GET | `/auth/me` | 현재 사용자 정보 | Yes |
| POST | `/auth/refresh` | 토큰 갱신 | Yes |
| POST | `/auth/logout` | 로그아웃 | Yes |

### Admin Endpoints (SUPER_ADMIN only)

**Institution Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/institutions` | 전체 회원사 목록 |
| GET | `/admin/institutions/pending` | 승인 대기 회원사 |
| GET | `/admin/institutions/:id` | 회원사 상세 |
| POST | `/admin/institutions/:id/approve` | 회원사 승인 |
| POST | `/admin/institutions/:id/reject` | 회원사 거부 |
| POST | `/admin/institutions/:id/suspend` | 회원사 정지 |
| POST | `/admin/institutions/:id/reactivate` | 회원사 재활성화 |
| PATCH | `/admin/institutions/:id` | 회원사 정보 수정 |

**Statistics**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats/overview` | 전체 통계 (회원사, 차량, 승객) |
| GET | `/admin/stats/institutions` | 회원사별 사용 현황 |
| GET | `/admin/stats/revenue` | 매출 통계 (구독 기반) |
| GET | `/admin/stats/institutions/:id` | 특정 회원사 통계 |

**User Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | 전체 사용자 목록 |
| POST | `/admin/users` | 사용자 생성 |
| PATCH | `/admin/users/:id` | 사용자 수정 |
| DELETE | `/admin/users/:id` | 사용자 삭제 |

**Plan Management**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/plans` | 요금제 목록 (비활성 포함) |
| POST | `/admin/plans` | 요금제 생성 |
| PATCH | `/admin/plans/:id` | 요금제 수정 |
| DELETE | `/admin/plans/:id` | 요금제 삭제 (Soft Delete) |

### Institution Self-Service (INSTITUTION_ADMIN)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/institutions/me` | 내 회원사 정보 |
| PATCH | `/institutions/me` | 내 회원사 정보 수정 |
| GET | `/institutions/me/users` | 내 회원사 사용자 목록 |
| POST | `/institutions/me/users` | 사용자 초대 |
| GET | `/institutions/me/stats` | 내 회원사 통계 |

For detailed API documentation, see [API.md](./API.md)

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e
```

**Test Coverage:**
- Unit Tests: AuthService, InstitutionService, SubscriptionService
- Integration Tests: AdminController, API endpoints
- E2E Tests: Institution approval flow, Authentication flow

### Frontend Tests

```bash
cd frontend

# Run component tests (when implemented)
npm test

# Run E2E tests with Playwright (when implemented)
npm run test:e2e
```

### Manual Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing checklist

## 📦 Deployment

### Environment Variables

**Backend (.env)**
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
PORT=3012

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_ACCESS_SECRET="your-access-secret-key-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="http://localhost:3000,https://yourdomain.com"
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3012/backend/api/v1
```

### Production Deployment

1. **Database Migration**
```bash
npx prisma migrate deploy
```

2. **Build Backend**
```bash
npm run build
npm run start:prod
```

3. **Build Frontend**
```bash
npm run build
npm start
```

4. **Docker Deployment** (future)
```bash
docker-compose up -d
```

## 📊 Current Implementation Status

### Phase 11: SaaS Admin & 회원사 관리 시스템 ✅

**Backend (100%)**
- ✅ User Authentication & Authorization
- ✅ Institution Status Management
- ✅ Subscription & Plan Management
- ✅ Admin APIs (Institution, User, Plan, Statistics)
- ✅ Institution Self-Service APIs
- ✅ Database Schema & Migrations
- ✅ Seed Data Script
- ✅ Unit/Integration/E2E Tests

**Frontend (40%)**
- ✅ Authentication System (Context, Hooks, Protected Routes)
- ✅ Admin Layout (Sidebar, Topbar, Responsive)
- ✅ Dashboard Home (KPI Cards, Quick Actions)
- ✅ Institution Approval Management (Pending, Approve, Reject)
- ✅ Institution List & Detail (Filter, Search, Suspend, Reactivate)
- ⏸️ User Management UI (not implemented)
- ⏸️ Plan Management UI (not implemented)
- ⏸️ Statistics Charts (not implemented)
- ⏸️ Marketing Landing Page (not implemented)

### Future Phases

- **Phase 12**: Driver Mobile App
- **Phase 13**: Passenger/Guardian App
- **Q1 2025**: AI Route Optimization (OR-Tools VRP)
- **Q1 2025**: Real-time Notifications (FCM)
- **Q1 2025**: IoT Telematics Integration

## 🤝 Contributing

This is a private project. For any questions or issues, please contact the project owner.

## 📄 License

Proprietary - All Rights Reserved

## 👥 Team

- **Product Owner**: [Name]
- **Backend Developer**: Claude Code AI Assistant
- **Frontend Developer**: Claude Code AI Assistant
- **DevOps**: [Name]

## 📞 Support

For technical support or questions:
- Email: support@pickup-maas.com
- Documentation: [Wiki Link]
- Issue Tracker: [GitHub Issues]

---

**Last Updated**: 2025-11-25
**Version**: 1.0.0-phase11
**Status**: MVP Ready for Testing
