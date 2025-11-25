# Phase 11 Testing Guide

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x LTS
- PostgreSQL 15+
- npm or yarn

### 1. Database Setup

```bash
# Start PostgreSQL
# Create database
createdb pickup_maas

# Set environment variable
export DATABASE_URL="postgresql://gangseungsig@localhost:5432/pickup_maas"
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed test data
npm run db:seed

# Start backend server
npm run dev
```

**Expected Output:**
```
✅ InstitutionTypes created: 2
✅ Plans created
✅ SUPER_ADMIN created: admin@pickup.com
✅ Institutions created: 2
✅ Subscriptions created
✅ Institution admin users created

🎉 Seed completed successfully!
==========================================
SUPER_ADMIN: admin@pickup.com / admin123!@#
INSTITUTION_ADMIN: admin@seoul.com / test1234
Plans: STARTER (50,000원), PRO (150,000원), ENTERPRISE (500,000원)
==========================================
```

**Backend should be running on:** `http://localhost:3012`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start frontend dev server
npm run dev
```

**Frontend should be running on:** `http://localhost:3000`

---

## ✅ Test Checklist

### 1. Authentication Flow

**Test Case 1.1: SUPER_ADMIN Login**
- [ ] Navigate to `http://localhost:3000/admin/login`
- [ ] Enter email: `admin@pickup.com`
- [ ] Enter password: `admin123!@#`
- [ ] Click "로그인" button
- [ ] ✅ Should redirect to `/admin/dashboard`
- [ ] ✅ Should see user name in topbar: "시스템 관리자"

**Test Case 1.2: Invalid Login**
- [ ] Navigate to `http://localhost:3000/admin/login`
- [ ] Enter email: `wrong@email.com`
- [ ] Enter password: `wrongpassword`
- [ ] Click "로그인" button
- [ ] ✅ Should show error message
- [ ] ✅ Should stay on login page

**Test Case 1.3: Protected Route**
- [ ] Logout (if logged in)
- [ ] Try to access `http://localhost:3000/admin/dashboard` directly
- [ ] ✅ Should redirect to `/admin/login`

---

### 2. Dashboard Home

**Test Case 2.1: KPI Cards Display**
- [ ] Login as SUPER_ADMIN
- [ ] Navigate to Dashboard (`/admin/dashboard`)
- [ ] ✅ Should see 6 KPI cards:
  - 전체 회원사: 2
  - 승인 대기: 1 (부산 재가요양센터)
  - 이번 달 신규 가입: 2
  - 총 차량 수: 6
  - 총 승객 수: 120
  - 이번 달 매출: 50,000원

**Test Case 2.2: Quick Actions**
- [ ] Click "승인 대기 관리" button
- [ ] ✅ Should navigate to `/admin/institutions/pending`

**Test Case 2.3: Status Distribution**
- [ ] Check "회원사 상태 분포" card
- [ ] ✅ Should show:
  - 활성 (ACTIVE): 1
  - 승인 대기 (PENDING): 1
  - 정지 (SUSPENDED): 0
  - 비활성 (INACTIVE): 0

---

### 3. Institution Approval Management

**Test Case 3.1: View Pending Institutions**
- [ ] Navigate to `/admin/institutions/pending`
- [ ] ✅ Should see table with 1 row: "부산 재가요양센터"
- [ ] ✅ Status badge should be yellow "대기중"

**Test Case 3.2: Approve Institution**
- [ ] Click "승인" button for "부산 재가요양센터"
- [ ] ✅ Should open approval dialog
- [ ] ✅ Dialog should show:
  - 회원사명: 부산 재가요양센터
  - 사업자등록번호: 2345678901
- [ ] Click "승인" button in dialog
- [ ] ✅ Should show success toast: "승인 완료"
- [ ] ✅ Institution should disappear from pending list
- [ ] ✅ Pending count should update to 0

**Test Case 3.3: Reject Institution** (Optional - requires resetting DB)
- [ ] Click "거부" button
- [ ] ✅ Should open reject dialog
- [ ] Enter rejection reason: "서류 불충분"
- [ ] Click "거부" button
- [ ] ✅ Should show success toast
- [ ] ✅ Institution should disappear from list

---

### 4. Institution List Management

**Test Case 4.1: View All Institutions**
- [ ] Navigate to `/admin/institutions`
- [ ] ✅ Should see table with 2 institutions:
  1. 서울 주간보호센터 (ACTIVE)
  2. 부산 재가요양센터 (ACTIVE after approval)

**Test Case 4.2: Filter by Status**
- [ ] Select "활성" from status filter dropdown
- [ ] ✅ Should show only ACTIVE institutions
- [ ] Select "전체" from dropdown
- [ ] ✅ Should show all institutions

**Test Case 4.3: Search Functionality**
- [ ] Enter "서울" in search box
- [ ] ✅ Should show only "서울 주간보호센터"
- [ ] Enter "1234567890" in search box
- [ ] ✅ Should show only institution with that business no.
- [ ] Clear search box
- [ ] ✅ Should show all institutions

**Test Case 4.4: Navigate to Detail**
- [ ] Click "상세" button for any institution
- [ ] ✅ Should navigate to `/admin/institutions/:id`

---

### 5. Institution Detail & Status Management

**Test Case 5.1: View Institution Details**
- [ ] Navigate to institution detail page
- [ ] ✅ Should display:
  - 회원사명
  - 사업자등록번호
  - 상태 badge
  - 가입일
  - 승인일 (if approved)
  - 승인자 (if approved)

**Test Case 5.2: Suspend Active Institution**
- [ ] On detail page for ACTIVE institution
- [ ] ✅ Should see "회원사 정지" button
- [ ] Click "회원사 정지" button
- [ ] ✅ Should open suspend dialog
- [ ] Enter suspension reason: "요금 미납"
- [ ] Click "정지" button
- [ ] ✅ Should show success toast: "정지 완료"
- [ ] ✅ Page should reload
- [ ] ✅ Status badge should change to "정지" (red)
- [ ] ✅ Should display:
  - 정지일: (today's date)
  - 정지 사유: 요금 미납
- [ ] ✅ Button should change to "재활성화"

**Test Case 5.3: Reactivate Suspended Institution**
- [ ] On detail page for SUSPENDED institution
- [ ] Click "재활성화" button
- [ ] ✅ Should show success toast: "재활성화 완료"
- [ ] ✅ Page should reload
- [ ] ✅ Status badge should change back to "활성" (green)
- [ ] ✅ Suspension info should be cleared
- [ ] ✅ Button should change back to "회원사 정지"

---

### 6. Navigation & Layout

**Test Case 6.1: Sidebar Navigation**
- [ ] ✅ Sidebar should display:
  - Pickup Admin logo
  - 대시보드
  - 회원사 관리
  - 승인 대기 (with badge showing pending count)
  - 사용자 관리
  - 요금제 관리
  - 통계
- [ ] Click each menu item
- [ ] ✅ Active menu should be highlighted in blue

**Test Case 6.2: Topbar**
- [ ] ✅ Should display user info:
  - Name: 시스템 관리자
  - Role: SUPER_ADMIN
- [ ] Click user dropdown
- [ ] ✅ Should show:
  - 프로필
  - 로그아웃
- [ ] Click "로그아웃"
- [ ] ✅ Should redirect to `/admin/login`

**Test Case 6.3: Responsive Design** (Optional)
- [ ] Resize browser window to mobile size
- [ ] ✅ Sidebar should collapse
- [ ] ✅ Content should be readable on mobile

---

## 🔧 API Endpoint Tests (Optional - using cURL)

### 1. Authentication

```bash
# Login
curl -X POST http://localhost:3012/backend/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pickup.com","password":"admin123!@#"}'

# Expected: 201 with access_token and user info

# Get current user (use token from login response)
curl http://localhost:3012/backend/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 with user details
```

### 2. Admin Stats

```bash
# Get overview stats
curl http://localhost:3012/backend/api/v1/admin/stats/overview \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 with institution counts, vehicles, passengers, etc.
```

### 3. Institution Management

```bash
# Get pending institutions
curl http://localhost:3012/backend/api/v1/admin/institutions/pending \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 with array of pending institutions

# Get all institutions
curl http://localhost:3012/backend/api/v1/admin/institutions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 with array of all institutions
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to database"
**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Check DATABASE_URL environment variable
echo $DATABASE_URL

# Restart PostgreSQL if needed
brew services restart postgresql@15
```

### Issue 2: "Prisma Client did not initialize"
**Solution:**
```bash
cd backend
npx prisma generate
```

### Issue 3: "Port 3012 already in use"
**Solution:**
```bash
# Find process using port 3012
lsof -ti:3012

# Kill the process
kill -9 <PID>

# Or change port in backend/.env
PORT=3013
```

### Issue 4: "Frontend shows 404 for API calls"
**Solution:**
- Check `frontend/.env.local` has correct API URL:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3012/backend/api/v1
  ```
- Restart frontend dev server

### Issue 5: "Invalid token" after login
**Solution:**
- Check browser localStorage has `accessToken`
- Try clearing localStorage and logging in again:
  ```javascript
  // In browser console
  localStorage.clear()
  ```

---

## ✨ Test Results Summary

**Total Test Cases:** 18

**Passed:** _____ / 18
**Failed:** _____ / 18
**Skipped:** _____ / 18

**Critical Issues Found:**
- [ ] None
- [ ] Issue 1: _____________
- [ ] Issue 2: _____________

**Notes:**
_______________________________________
_______________________________________
_______________________________________

---

## 📸 Screenshots (Optional)

Take screenshots for documentation:
- [ ] Login page
- [ ] Dashboard home
- [ ] Pending institutions list
- [ ] Approval dialog
- [ ] Institution detail page
- [ ] Suspend dialog

---

**Last Updated:** 2025-11-25
**Tested By:** _____________
**Environment:** Development
