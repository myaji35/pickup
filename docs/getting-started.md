# PickUp - 개발 시작 가이드

**프로젝트**: PickUp MVP
**대상**: 개발자
**최종 수정**: 2025-11-09

---

## 🚀 빠른 시작

### 1단계: 레포지토리 클론

```bash
# 이미 클론되어 있음
cd /Users/gangseungsig/Documents/GitHub/pickup
```

---

### 2단계: 관리자 포털 (Next.js) 초기 설정

#### 프로젝트 생성

```bash
# Next.js 16+ 프로젝트 생성
npx create-next-app@latest admin-portal --typescript --tailwind --app --use-npm
cd admin-portal
```

생성 시 옵션:
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ App Router
- ✅ `src/` directory (선택)
- ✅ Import alias `@/*`

#### 필수 패키지 설치

```bash
# 핵심 의존성
npm install @clerk/nextjs @prisma/client prisma ioredis zod react-hook-form @hookform/resolvers

# shadcn/ui 설치
npx shadcn@latest init

# shadcn/ui 컴포넌트 추가 (필요한 것들)
npx shadcn@latest add form table button input select dialog alert card
```

#### Prisma 설정

```bash
# Prisma 초기화 (이미 schema.prisma가 있으므로 복사)
cp ../prisma/schema.prisma ./prisma/schema.prisma

# .env 파일 생성
cat > .env.local << 'EOF'
# Database (개발 시 SQLite)
DATABASE_URL="file:./dev.db"

# Clerk (https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Redis (Upstash - https://console.upstash.com)
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token

# FCM (Firebase)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
EOF

# Prisma 클라이언트 생성 및 마이그레이션
npx prisma generate
npx prisma migrate dev --name init
```

#### 디렉토리 구조 생성

```bash
mkdir -p app/{actions,api}
mkdir -p lib
mkdir -p components/{ui,forms}
```

#### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

### 3단계: Clerk 설정

#### Clerk 대시보드 (https://dashboard.clerk.com)

1. **새 애플리케이션 생성**
   - Name: "PickUp"
   - Authentication methods:
     - ✅ Email + Password
     - ✅ Phone (기사/보호자용)

2. **API Keys 복사**
   - Publishable Key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Secret Key → `CLERK_SECRET_KEY`

3. **User Metadata 설정**
   - Dashboard → Users → Metadata
   - `publicMetadata`에 다음 필드 추가:
     ```json
     {
       "role": "institution_admin",
       "institutionId": "inst_123"
     }
     ```

4. **Webhooks 설정** (선택, 기사 등록 시 계정 자동 생성용)
   - Endpoint: `https://your-domain.vercel.app/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`

#### Clerk 미들웨어 설정

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/api/webhooks/clerk"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

---

### 4단계: 기사 앱 (React Native) 초기 설정

#### Expo 프로젝트 생성

```bash
cd ..
npx create-expo-app@latest driver-app --template expo-template-blank-typescript
cd driver-app
```

#### 필수 패키지 설치

```bash
# 핵심 의존성
npx expo install @clerk/clerk-expo expo-router expo-location react-native-maps expo-notifications

# NativeWind (Tailwind for RN)
npm install nativewind tailwindcss
npx tailwindcss init

# 유틸리티
npm install date-fns
```

#### NativeWind 설정

```javascript
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

```typescript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

#### Clerk 설정 (모바일)

```typescript
// app/_layout.tsx
import { ClerkProvider } from '@clerk/clerk-expo';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      {/* ... */}
    </ClerkProvider>
  );
}
```

#### 개발 서버 실행

```bash
npx expo start
```

---

### 5단계: 승객 앱 (React Native) 초기 설정

```bash
cd ..
npx create-expo-app@latest passenger-app --template expo-template-blank-typescript
cd passenger-app

# 기사 앱과 동일한 패키지 설치
npx expo install @clerk/clerk-expo expo-router expo-location react-native-maps expo-notifications
npm install nativewind tailwindcss date-fns

# 설정 파일도 동일하게 적용 (tailwind.config.js, babel.config.js)
```

---

## 🛠️ 개발 환경 설정

### 필수 도구

| 도구 | 버전 | 용도 |
|------|------|------|
| Node.js | 20+ | 런타임 |
| npm | 10+ | 패키지 매니저 |
| PostgreSQL | 15+ | 데이터베이스 (운영) |
| Redis | 7+ | 캐시 (운영) |
| Expo Go | Latest | 모바일 앱 테스트 |

### VSCode 확장 프로그램

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "prisma.prisma",
    "expo.vscode-expo-tools"
  ]
}
```

---

## 📦 프로젝트 구조

```
pickup/
├── admin-portal/              # Next.js 관리자 포털
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── [institutionId]/
│   │   │   │   ├── vehicles/
│   │   │   │   ├── drivers/
│   │   │   │   ├── passengers/
│   │   │   │   ├── rosters/
│   │   │   │   └── fleet-monitoring/
│   │   │   └── layout.tsx
│   │   ├── actions/
│   │   │   ├── vehicles.ts
│   │   │   ├── drivers.ts
│   │   │   └── ...
│   │   └── api/
│   │       ├── institutions/
│   │       ├── trips/
│   │       └── webhooks/
│   ├── components/
│   │   ├── ui/              # shadcn/ui 컴포넌트
│   │   └── forms/
│   ├── lib/
│   │   ├── prisma.ts        # Prisma Client 싱글톤
│   │   └── redis.ts         # Redis Client
│   ├── prisma/
│   │   └── schema.prisma
│   └── .env.local
│
├── driver-app/               # React Native 기사 앱
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── sign-in.tsx
│   │   ├── (tabs)/
│   │   │   ├── index.tsx    # 홈 대시보드
│   │   │   ├── morning.tsx  # 오전 명단
│   │   │   ├── evening.tsx  # 저녁 명단
│   │   │   └── profile.tsx
│   │   └── _layout.tsx
│   ├── components/
│   ├── services/
│   │   ├── location-tracker.ts
│   │   └── api.ts
│   └── .env
│
├── passenger-app/            # React Native 승객 앱
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in.tsx
│   │   │   └── link-passenger.tsx
│   │   ├── (tabs)/
│   │   │   ├── index.tsx    # 지도 + ETA
│   │   │   ├── schedule.tsx
│   │   │   ├── notifications.tsx
│   │   │   └── profile.tsx
│   │   └── _layout.tsx
│   ├── components/
│   ├── services/
│   └── .env
│
├── docs/                     # 문서
├── prisma/                   # 공유 Prisma 스키마
└── CLAUDE.md
```

---

## 🔑 환경 변수 설정

### admin-portal/.env.local

```env
# Database
DATABASE_URL="file:./dev.db"  # 개발: SQLite
# DATABASE_URL="postgresql://user:password@localhost:5432/pickup"  # 운영: PostgreSQL

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Redis (Upstash)
REDIS_URL=https://your-redis.upstash.io
REDIS_TOKEN=your_token

# FCM (Firebase Cloud Messaging)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### driver-app/.env

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_FCM_SENDER_ID=your_fcm_sender_id
```

### passenger-app/.env

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_FCM_SENDER_ID=your_fcm_sender_id
```

---

## 🗄️ 데이터베이스 설정

### 개발 환경 (SQLite)

```bash
cd admin-portal

# Prisma 마이그레이션
npx prisma migrate dev --name init

# Prisma Studio 실행 (DB GUI)
npx prisma studio
```

### 운영 환경 (PostgreSQL)

#### Vercel Postgres 사용 시

```bash
# Vercel CLI 설치
npm i -g vercel

# Vercel 로그인
vercel login

# Postgres 데이터베이스 생성
vercel postgres create pickup-prod

# 환경 변수 자동 설정
vercel env pull .env.production
```

#### 직접 PostgreSQL 설정 시

```bash
# PostgreSQL 설치 (macOS)
brew install postgresql@15
brew services start postgresql@15

# 데이터베이스 생성
createdb pickup

# schema.prisma에서 provider 변경
# datasource db {
#   provider = "postgresql"
#   url      = env("DATABASE_URL")
# }

# DATABASE_URL 설정
# DATABASE_URL="postgresql://postgres:password@localhost:5432/pickup"

# 마이그레이션
npx prisma migrate deploy
```

---

## 🧪 첫 데이터 삽입 (시드)

### prisma/seed.ts 생성

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 기관 생성
  const institution = await prisma.institution.create({
    data: {
      businessRegistrationNumber: '1234567890',
      name: '행복학원',
      address: '서울시 강남구 테헤란로 123',
      phone: '02-1234-5678',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Institution created:', institution.id);

  // 차량 생성
  const vehicle = await prisma.vehicle.create({
    data: {
      institutionId: institution.id,
      licensePlate: '12가3456',
      licensePlateLast4: '3456',
      vehicleType: '그랜드스타렉스',
      capacity: 9,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Vehicle created:', vehicle.id);

  // 승객 생성
  const passenger = await prisma.passenger.create({
    data: {
      institutionId: institution.id,
      name: '김철수',
      phone: '010-1234-5678',
      pickupAddress: '서울시 강남구 역삼동 123',
      dropoffAddress: '서울시 강남구 테헤란로 123',
      inviteCode: 'TEST001',
    },
  });

  console.log('✅ Passenger created:', passenger.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 실행

```bash
# package.json에 추가
# "prisma": {
#   "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
# }

npm install -D ts-node

npx prisma db seed
```

---

## 🚦 개발 플로우

### 1. Epic 1 개발 시작 (기관 관리)

```bash
# 브랜치 생성
git checkout -b feat/epic-01-institution

# Server Action 작성
# app/actions/institutions.ts

# 페이지 작성
# app/(dashboard)/institutions/page.tsx

# 컴포넌트 작성
# components/forms/institution-form.tsx

# 테스트 작성
# __tests__/actions/institutions.test.ts

# 커밋
git add .
git commit -m "feat: Epic 1 - 기관 관리 CRUD 구현"
git push origin feat/epic-01-institution
```

### 2. PR 생성 및 리뷰

```bash
# GitHub에서 Pull Request 생성
# Epic 문서 링크 추가
# 스크린샷 첨부
```

### 3. 배포

```bash
# Vercel 자동 배포 (main 브랜치 머지 시)
# 또는 수동 배포
vercel --prod
```

---

## 📱 모바일 앱 빌드

### 개발 빌드 (Expo Go)

```bash
cd driver-app
npx expo start

# iOS 시뮬레이터
i

# Android 에뮬레이터
a
```

### 프로덕션 빌드 (EAS Build)

```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# 빌드 설정
eas build:configure

# iOS 빌드
eas build --platform ios

# Android 빌드
eas build --platform android

# TestFlight / Internal Testing 배포
eas submit --platform ios
eas submit --platform android
```

---

## 🧪 테스트 실행

```bash
# 단위 테스트
npm run test

# E2E 테스트 (Playwright)
npx playwright test

# 테스트 커버리지
npm run test:coverage
```

---

## 🐛 디버깅

### Next.js 디버깅

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

### React Native 디버깅

```bash
# 개발자 메뉴 열기 (iOS)
Cmd + D

# 개발자 메뉴 열기 (Android)
Cmd + M

# React Native Debugger
brew install react-native-debugger
```

---

## 📚 추가 리소스

### 공식 문서
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Clerk Docs](https://clerk.com/docs)
- [Expo Docs](https://docs.expo.dev/)
- [shadcn/ui Docs](https://ui.shadcn.com/)

### 내부 문서
- [기술 아키텍처](./architecture.md)
- [API 명세서](./api-spec.md)
- [Epic 문서](./epics/README.md)

---

## 🆘 문제 해결

### Prisma 마이그레이션 오류

```bash
# 마이그레이션 리셋 (개발 환경만!)
npx prisma migrate reset

# 스키마 동기화
npx prisma db push
```

### Clerk 인증 오류

- API Keys가 `.env.local`에 정확히 입력되었는지 확인
- `NEXT_PUBLIC_` 접두사 확인
- 개발 서버 재시작: `npm run dev`

### Redis 연결 오류

- Upstash 대시보드에서 URL/Token 재확인
- 로컬 Redis 사용 시:
  ```bash
  brew install redis
  brew services start redis
  # DATABASE_URL="redis://localhost:6379"
  ```

---

**작성자**: John (Product Manager)
**최종 수정**: 2025-11-09
**문서 버전**: 1.0
