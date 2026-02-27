# Quickstart Guide: 개발 환경 구축

**Feature**: 001-fleet-roster-management (통합 구현)
**Created**: 2025-11-18
**Phase**: Phase 1 - Development Setup
**Related Docs**: [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md)

---

## Table of Contents

1. [Prerequisites (필수 요구사항)](#1-prerequisites-필수-요구사항)
2. [프로젝트 초기화](#2-프로젝트-초기화)
3. [백엔드 설정 (NestJS)](#3-백엔드-설정-nestjs)
4. [프론트엔드 설정 (Next.js)](#4-프론트엔드-설정-nextjs)
5. [데이터베이스 설정 (PostgreSQL + Prisma)](#5-데이터베이스-설정-postgresql--prisma)
6. [개발 서버 실행](#6-개발-서버-실행)
7. [API 문서 확인 (Swagger)](#7-api-문서-확인-swagger)
8. [테스트 실행](#8-테스트-실행)
9. [트러블슈팅](#9-트러블슈팅)

---

## 1. Prerequisites (필수 요구사항)

### 1.1 시스템 요구사항

| 항목 | 최소 버전 | 권장 버전 | 확인 명령어 |
|-----|----------|----------|-----------|
| **Node.js** | 20.0.0 | 20.x LTS | `node --version` |
| **npm** | 10.0.0 | 10.x | `npm --version` |
| **PostgreSQL** | 15.0 | 15.x | `psql --version` |
| **Git** | 2.30.0 | 최신 | `git --version` |

### 1.2 Node.js 설치

**macOS (Homebrew)**:
```bash
brew install node@20
```

**Windows (Chocolatey)**:
```bash
choco install nodejs-lts
```

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**권장: nvm 사용** (버전 관리):
```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Node.js 20 LTS 설치
nvm install 20
nvm use 20
nvm alias default 20
```

### 1.3 PostgreSQL 설치

**macOS (Homebrew)**:
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows**:
- [PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 설치 프로그램 다운로드
- 설치 시 포트: 5432 (기본값)
- 비밀번호 설정 (기억 필수!)

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 1.4 개발 도구 설치 (Optional but Recommended)

| 도구 | 용도 | 다운로드 |
|-----|------|---------|
| **VS Code** | 코드 에디터 | [code.visualstudio.com](https://code.visualstudio.com/) |
| **Postman** | API 테스트 | [postman.com](https://www.postman.com/downloads/) |
| **TablePlus** | DB GUI 클라이언트 | [tableplus.com](https://tableplus.com/) |
| **Docker Desktop** | 컨테이너 관리 (Stage 2) | [docker.com](https://www.docker.com/products/docker-desktop) |

**VS Code 확장 프로그램** (권장):
```bash
code --install-extension dbaeumer.vscode-eslint         # ESLint
code --install-extension esbenp.prettier-vscode         # Prettier
code --install-extension Prisma.prisma                  # Prisma
code --install-extension bradlc.vscode-tailwindcss     # Tailwind CSS
code --install-extension redhat.vscode-yaml             # YAML
```

---

## 2. 프로젝트 초기화

### 2.1 프로젝트 클론

```bash
# 리포지토리 클론
git clone <repository-url> pickup-maas
cd pickup-maas

# 브랜치 확인
git branch -a

# 개발 브랜치 체크아웃 (001번 기능)
git checkout 001-fleet-roster-management
```

### 2.2 프로젝트 구조 생성

```bash
# 루트 디렉토리에서 실행
mkdir -p backend frontend
```

**최종 디렉토리 구조**:
```
pickup-maas/
├── backend/                 # NestJS API 서버
│   ├── src/
│   ├── prisma/
│   ├── test/
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Next.js 웹 애플리케이션
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
├── specs/                   # 기능 명세 및 설계 문서
└── README.md
```

---

## 3. 백엔드 설정 (NestJS)

### 3.1 NestJS 프로젝트 생성

```bash
cd backend

# NestJS CLI 설치 (전역)
npm install -g @nestjs/cli

# NestJS 프로젝트 초기화
nest new . --skip-git --package-manager npm
# 프롬프트: 프로젝트 이름 → "pickup-backend" 입력
```

### 3.2 필수 의존성 설치

```bash
# Prisma ORM
npm install @prisma/client
npm install -D prisma tsx

# 환경 변수 관리
npm install @nestjs/config

# Validation
npm install class-validator class-transformer nestjs-zod zod

# Swagger (API 문서)
npm install @nestjs/swagger

# 시간 계산 (date-fns)
npm install date-fns

# 엑셀 파싱 (exceljs)
npm install exceljs

# 파일 업로드
npm install @nestjs/platform-express multer
npm install -D @types/multer

# 테스트 (Vitest)
npm install -D vitest @vitest/ui @vitest/coverage-v8
```

### 3.3 Prisma 초기화

```bash
# Prisma 초기화 (PostgreSQL)
npx prisma init --datasource-provider postgresql
```

**`prisma/schema.prisma` 생성 확인**:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**`data-model.md`의 완전한 스키마를 `prisma/schema.prisma`에 복사**:
```bash
# specs/001-fleet-roster-management/data-model.md 에서 Prisma 스키마 부분 복사
# prisma/schema.prisma 에 붙여넣기
```

### 3.4 환경 변수 설정

**`.env` 파일 생성** (루트 디렉토리에서):
```bash
cat > backend/.env <<EOF
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pickup_dev?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="1d"

# File Upload
MAX_FILE_SIZE_MB=10

# Server
PORT=3000
NODE_ENV=development
EOF
```

**주의**: `.env` 파일은 `.gitignore`에 추가 필수!

**`.gitignore` 업데이트**:
```bash
cat >> backend/.gitignore <<EOF

# Environment
.env
.env.local
.env.production

# Prisma
node_modules
EOF
```

### 3.5 프로젝트 구조 생성

```bash
cd backend/src

# Bounded Context 디렉토리 생성
mkdir -p common/database
mkdir -p institution/{domain,application,infrastructure,interface}
mkdir -p fleet/{domain,application,infrastructure,interface}
mkdir -p roster/{domain,application,infrastructure,interface}
```

**기본 모듈 생성**:
```bash
# PrismaService 생성
nest generate service common/database/prisma --flat --no-spec

# Institution 모듈 생성
nest generate module institution
nest generate controller institution/interface/controllers/institution --flat --no-spec
nest generate service institution/application/services/institution --flat --no-spec

# Fleet 모듈 생성
nest generate module fleet
nest generate controller fleet/interface/controllers/vehicle --flat --no-spec
nest generate service fleet/application/services/vehicle --flat --no-spec

# Roster 모듈 생성
nest generate module roster
nest generate controller roster/interface/controllers/passenger --flat --no-spec
nest generate service roster/application/services/passenger --flat --no-spec
```

### 3.6 PrismaService 구현

**`src/common/database/prisma.service.ts` 수정**:
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }
}
```

**`src/common/database/database.module.ts` 생성**:
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

**`src/app.module.ts` 수정**:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { InstitutionModule } from './institution/institution.module';
import { FleetModule } from './fleet/fleet.module';
import { RosterModule } from './roster/roster.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    InstitutionModule,
    FleetModule,
    RosterModule,
  ],
})
export class AppModule {}
```

---

## 4. 프론트엔드 설정 (Next.js)

### 4.1 Next.js 프로젝트 생성

```bash
cd ../frontend

# Next.js 14 App Router 프로젝트 생성
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
# 프롬프트 답변:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - App Router: Yes
# - Import alias: Yes (@/*)
```

### 4.2 필수 의존성 설치

```bash
# 상태 관리 (React Query + Zustand)
npm install @tanstack/react-query zustand
npm install -D @tanstack/react-query-devtools

# 폼 검증 (Zod + React Hook Form)
npm install zod react-hook-form @hookform/resolvers

# UI 컴포넌트 (shadcn/ui)
npx shadcn-ui@latest init
# 프롬프트:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# 필요한 컴포넌트 설치
npx shadcn-ui@latest add button
npx shadcn-ui@latest add table
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add toast

# 엑셀 다운로드 (클라이언트)
npm install xlsx

# 날짜 처리
npm install date-fns
```

### 4.3 환경 변수 설정

**`.env.local` 파일 생성**:
```bash
cat > .env.local <<EOF
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Environment
NEXT_PUBLIC_ENV=development
EOF
```

### 4.4 프로젝트 구조 생성

```bash
# 디렉토리 구조 생성
mkdir -p app/institutions
mkdir -p components/{ui,forms,tables}
mkdir -p hooks/{queries,mutations}
mkdir -p stores
mkdir -p lib
mkdir -p types
```

### 4.5 React Query Provider 설정

**`app/providers.tsx` 생성**:
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분
            cacheTime: 5 * 60 * 1000, // 5분
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**`app/layout.tsx` 수정**:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pickup MaaS - 차량 및 승객명단 관리',
  description: 'B2B 송영 서비스 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## 5. 데이터베이스 설정 (PostgreSQL + Prisma)

### 5.1 PostgreSQL 데이터베이스 생성

**macOS/Linux**:
```bash
# PostgreSQL 접속
psql postgres

# 개발용 데이터베이스 생성
CREATE DATABASE pickup_dev;

# 테스트용 데이터베이스 생성
CREATE DATABASE pickup_test;

# 사용자 생성 (Optional, 기본 postgres 사용 가능)
CREATE USER pickup_admin WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE pickup_dev TO pickup_admin;

# 종료
\q
```

**Windows (psql 사용)**:
```sql
-- pgAdmin 또는 psql에서 실행
CREATE DATABASE pickup_dev;
CREATE DATABASE pickup_test;
```

### 5.2 Prisma 마이그레이션 실행

```bash
cd backend

# 마이그레이션 생성 및 적용
npx prisma migrate dev --name init

# Prisma Client 생성
npx prisma generate
```

**예상 출력**:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "pickup_dev"

Applying migration `20250118_init`

✅ Generated Prisma Client (5.x.x)

The following migration(s) have been applied:

migrations/
  └─ 20250118_init/
      └─ migration.sql

Your database is now in sync with your schema.
```

### 5.3 시드 데이터 생성

**`prisma/seed.ts` 파일 생성** (data-model.md의 시드 스크립트 복사):
```typescript
// data-model.md 섹션 6.2 참조
import { PrismaClient, ShuttleType } from '@prisma/client';
// ... 전체 시드 스크립트 복사
```

**`package.json`에 시드 설정 추가**:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "scripts": {
    "db:seed": "prisma db seed"
  }
}
```

**시드 실행**:
```bash
npm run db:seed
```

**예상 출력**:
```
🌱 Starting seed...
✅ InstitutionTypes created: 2
✅ Institutions created: 3
✅ PassengerGroups created: 6
✅ Vehicles created
✅ Passengers and Schedules created
🎉 Seed completed successfully!
```

### 5.4 데이터 확인

**Prisma Studio 실행** (GUI 데이터 뷰어):
```bash
npx prisma studio
```

브라우저에서 `http://localhost:5555` 열림 → 테이블 데이터 확인

**또는 psql로 확인**:
```bash
psql -U postgres -d pickup_dev

-- 시드 데이터 확인
SELECT
  (SELECT COUNT(*) FROM institution_types) AS institution_types,
  (SELECT COUNT(*) FROM institutions) AS institutions,
  (SELECT COUNT(*) FROM passenger_groups) AS groups,
  (SELECT COUNT(*) FROM vehicles) AS vehicles,
  (SELECT COUNT(*) FROM passengers) AS passengers;

\q
```

---

## 6. 개발 서버 실행

### 6.1 백엔드 서버 실행

**터미널 1** (Backend):
```bash
cd backend
npm run start:dev
```

**예상 출력**:
```
[Nest] 12345  - 2025/01/18, 10:00:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 2025/01/18, 10:00:00 AM     LOG [InstanceLoader] DatabaseModule dependencies initialized
✅ Database connected
[Nest] 12345  - 2025/01/18, 10:00:01 AM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 2025/01/18, 10:00:01 AM     LOG Application is running on: http://localhost:3000
```

**Health Check**:
```bash
curl http://localhost:3000
# 예상 응답: {"message":"Hello World!"}
```

### 6.2 프론트엔드 서버 실행

**터미널 2** (Frontend):
```bash
cd frontend
npm run dev
```

**예상 출력**:
```
   ▲ Next.js 14.x.x
   - Local:        http://localhost:3001
   - Network:      http://192.168.1.x:3001

 ✓ Ready in 2.3s
```

브라우저에서 `http://localhost:3001` 접속 → Next.js 기본 페이지 확인

---

## 7. API 문서 확인 (Swagger)

### 7.1 Swagger 설정

**`backend/src/main.ts` 수정**:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS 설정 (개발 환경)
  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });

  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Pickup MaaS API')
    .setDescription('차량 및 승객명단 관리 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
}

bootstrap();
```

### 7.2 Swagger UI 접속

백엔드 서버 실행 후:
```
http://localhost:3000/api-docs
```

**주요 기능**:
- API 엔드포인트 목록 확인
- Request/Response 스키마 확인
- 직접 API 테스트 (Try it out 버튼)
- OpenAPI JSON 다운로드

---

## 8. 테스트 실행

### 8.1 Vitest 설정

**`backend/vitest.config.ts` 생성**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'test/'],
      threshold: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
```

**`package.json` 스크립트 추가**:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### 8.2 샘플 테스트 작성

**`backend/src/roster/domain/services/care-time-calculator.spec.ts` 생성**:
```typescript
import { describe, it, expect } from 'vitest';
import { CareTimeCalculator } from './care-time-calculator';

describe('CareTimeCalculator', () => {
  const calculator = new CareTimeCalculator();

  describe('calculateCareTimeHours', () => {
    it('should calculate 8 hours correctly', () => {
      const result = calculator.calculateCareTimeHours('09:00', '17:00');
      expect(result).toBe(8);
    });

    it('should calculate 8.5 hours correctly', () => {
      const result = calculator.calculateCareTimeHours('09:00', '17:30');
      expect(result).toBe(8.5);
    });

    it('should throw error when dropoff is before pickup', () => {
      expect(() => calculator.calculateCareTimeHours('17:00', '09:00')).toThrow();
    });
  });

  describe('isCareTimeSufficient', () => {
    it('should return true for 8 hours or more', () => {
      expect(calculator.isCareTimeSufficient(8, 8)).toBe(true);
      expect(calculator.isCareTimeSufficient(8.5, 8)).toBe(true);
    });

    it('should return false for less than 8 hours', () => {
      expect(calculator.isCareTimeSufficient(7.5, 8)).toBe(false);
    });
  });
});
```

### 8.3 테스트 실행

```bash
cd backend

# 전체 테스트 실행
npm test

# Watch 모드
npm run test:watch

# 커버리지 포함
npm run test:cov

# UI 모드 (브라우저에서 결과 확인)
npm run test:ui
```

---

## 9. 트러블슈팅

### 9.1 PostgreSQL 연결 실패

**에러**:
```
Error: P1001: Can't reach database server at `localhost:5432`
```

**해결책**:
```bash
# PostgreSQL 실행 확인 (macOS)
brew services list
brew services start postgresql@15

# PostgreSQL 실행 확인 (Linux)
sudo systemctl status postgresql
sudo systemctl start postgresql

# 포트 확인
lsof -i :5432
```

### 9.2 Prisma Client 생성 실패

**에러**:
```
Cannot find module '@prisma/client'
```

**해결책**:
```bash
cd backend
npx prisma generate
npm install @prisma/client
```

### 9.3 포트 충돌

**에러**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**해결책**:
```bash
# 3000번 포트 사용 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>

# 또는 .env에서 다른 포트 사용
PORT=3001
```

### 9.4 Prisma 마이그레이션 충돌

**에러**:
```
Error: P3005: Database schema is not empty
```

**해결책** (개발 환경만):
```bash
# 데이터베이스 초기화 (주의: 모든 데이터 삭제)
npx prisma migrate reset

# 또는 데이터베이스 재생성
psql postgres
DROP DATABASE pickup_dev;
CREATE DATABASE pickup_dev;
\q

npx prisma migrate dev --name init
npm run db:seed
```

### 9.5 TypeScript 타입 에러

**에러**:
```
Cannot find name 'Passenger'
```

**해결책**:
```bash
# Prisma Client 재생성
cd backend
npx prisma generate

# VS Code 재시작
# Command Palette (Cmd+Shift+P) → "TypeScript: Restart TS Server"
```

### 9.6 Next.js 환경 변수 인식 안 됨

**에러**:
```
process.env.NEXT_PUBLIC_API_URL is undefined
```

**해결책**:
```bash
# .env.local 파일 위치 확인 (frontend/ 디렉토리 내)
ls -la frontend/.env.local

# Next.js 서버 재시작 필수
npm run dev
```

---

## 10. 다음 단계

### 10.1 Phase 2 준비

모든 설정이 완료되면:

1. ✅ **개발 환경 구축 완료** (현재 단계)
2. ⏭️ **Phase 2**: `/speckit.tasks` 실행하여 구현 Task 생성
3. ⏭️ **Phase 3**: TDD로 기능 구현 시작

### 10.2 추가 학습 자료

| 주제 | 공식 문서 |
|-----|---------|
| **NestJS** | [docs.nestjs.com](https://docs.nestjs.com/) |
| **Prisma** | [prisma.io/docs](https://www.prisma.io/docs) |
| **Next.js** | [nextjs.org/docs](https://nextjs.org/docs) |
| **React Query** | [tanstack.com/query](https://tanstack.com/query/latest) |
| **Zustand** | [github.com/pmndrs/zustand](https://github.com/pmndrs/zustand) |
| **shadcn/ui** | [ui.shadcn.com](https://ui.shadcn.com/) |

### 10.3 코딩 컨벤션

**TypeScript 스타일 가이드**:
- 파일명: kebab-case (`passenger-group.service.ts`)
- 클래스명: PascalCase (`PassengerGroupService`)
- 변수/함수: camelCase (`createPassenger`)
- 상수: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)

**Prettier 설정** (`.prettierrc`):
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**ESLint 설정** (`.eslintrc.js`):
```javascript
module.exports = {
  extends: ['@nestjs', 'prettier'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

---

## 11. 유용한 명령어 요약

| 명령어 | 설명 |
|-------|------|
| `npm run start:dev` | 백엔드 개발 서버 (Hot reload) |
| `npm run dev` | 프론트엔드 개발 서버 |
| `npx prisma studio` | Prisma Studio (DB GUI) |
| `npx prisma migrate dev` | 마이그레이션 생성 및 적용 |
| `npm run db:seed` | 시드 데이터 생성 |
| `npm test` | 테스트 실행 |
| `npm run test:cov` | 커버리지 포함 테스트 |
| `npm run build` | 프로덕션 빌드 |
| `git status` | Git 상태 확인 |

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Estimated Setup Time**: 30-60 minutes
**Support**: 문제 발생 시 개발팀에 문의
