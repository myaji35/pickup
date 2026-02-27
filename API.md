# Pickup MaaS API Documentation

Phase 11 - Admin Portal & Multi-tenant Foundation
Phase 12 - Driver Mobile App

Base URL: `http://localhost:3012/backend/api/v1`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Admin - Institution Management](#admin---institution-management)
3. [Admin - User Management](#admin---user-management)
4. [Admin - Plan Management](#admin---plan-management)
5. [Admin - Statistics](#admin---statistics)
6. [Institution Self-Service](#institution-self-service)
7. [Driver APIs (Phase 12)](#driver-apis-phase-12)
8. [Common Response Format](#common-response-format)
9. [Error Codes](#error-codes)

---

## Authentication

### POST /auth/login

로그인하여 JWT 액세스 토큰 및 리프레시 토큰을 받습니다.

**Request Body:**
```json
{
  "email": "admin@pickup.com",
  "password": "admin123!@#"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "admin@pickup.com",
      "name": "시스템 관리자",
      "role": "SUPER_ADMIN",
      "institutionId": null,
      "isActive": true,
      "createdAt": "2025-11-25T00:00:00.000Z"
    }
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

### POST /auth/register

회원가입 및 회원사 동시 생성 (INSTITUTION_ADMIN 자동 할당)

**Request Body:**
```json
{
  "email": "admin@newcenter.com",
  "password": "securePassword123!",
  "name": "홍길동",
  "institutionName": "새로운 요양센터",
  "businessRegistrationNo": "1234567890"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "admin@newcenter.com",
      "name": "홍길동",
      "role": "INSTITUTION_ADMIN",
      "institutionId": "institution-uuid",
      "isActive": true,
      "createdAt": "2025-11-25T10:00:00.000Z"
    },
    "institution": {
      "id": "institution-uuid",
      "name": "새로운 요양센터",
      "businessRegistrationNo": "1234567890",
      "status": "PENDING"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Institution with this business registration number already exists",
  "error": "Bad Request"
}
```

---

### GET /auth/me

현재 로그인한 사용자 정보 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "admin@pickup.com",
    "name": "시스템 관리자",
    "role": "SUPER_ADMIN",
    "institutionId": null,
    "isActive": true,
    "createdAt": "2025-11-25T00:00:00.000Z",
    "institution": null
  }
}
```

---

### POST /auth/refresh

리프레시 토큰으로 새로운 액세스 토큰 발급

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /auth/logout

로그아웃 (클라이언트에서 토큰 삭제)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Admin - Institution Management

**Note:** 모든 엔드포인트는 SUPER_ADMIN 권한 필요

### GET /admin/institutions

전체 회원사 목록 조회 (페이지네이션, 필터링, 검색)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 항목 수 (default: 20)
- `status` (optional): 상태 필터 (PENDING, ACTIVE, SUSPENDED, INACTIVE)
- `search` (optional): 회원사명 또는 사업자등록번호 검색

**Example Request:**
```
GET /admin/institutions?page=1&limit=10&status=ACTIVE&search=서울
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "inst-uuid-1",
      "name": "서울 주간보호센터",
      "businessRegistrationNo": "1234567890",
      "status": "ACTIVE",
      "approvedAt": "2025-11-20T00:00:00.000Z",
      "approvedBy": "admin-uuid",
      "suspendedAt": null,
      "suspensionReason": null,
      "createdAt": "2025-11-15T00:00:00.000Z",
      "updatedAt": "2025-11-20T00:00:00.000Z"
    },
    {
      "id": "inst-uuid-2",
      "name": "서울시립 요양센터",
      "businessRegistrationNo": "9876543210",
      "status": "ACTIVE",
      "approvedAt": "2025-11-22T00:00:00.000Z",
      "approvedBy": "admin-uuid",
      "suspendedAt": null,
      "suspensionReason": null,
      "createdAt": "2025-11-18T00:00:00.000Z",
      "updatedAt": "2025-11-22T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### GET /admin/institutions/pending

승인 대기 중인 회원사 목록

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "inst-uuid-3",
      "name": "부산 재가요양센터",
      "businessRegistrationNo": "2345678901",
      "status": "PENDING",
      "approvedAt": null,
      "approvedBy": null,
      "createdAt": "2025-11-24T00:00:00.000Z",
      "updatedAt": "2025-11-24T00:00:00.000Z"
    }
  ]
}
```

---

### GET /admin/institutions/:id

특정 회원사 상세 정보 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "inst-uuid-1",
    "name": "서울 주간보호센터",
    "businessRegistrationNo": "1234567890",
    "status": "ACTIVE",
    "approvedAt": "2025-11-20T00:00:00.000Z",
    "approvedBy": "admin-uuid",
    "rejectionReason": null,
    "suspendedAt": null,
    "suspensionReason": null,
    "createdAt": "2025-11-15T00:00:00.000Z",
    "updatedAt": "2025-11-20T00:00:00.000Z",
    "institutionType": {
      "id": "type-uuid",
      "name": "DAYCARE",
      "displayName": "주간보호"
    },
    "subscription": {
      "id": "sub-uuid",
      "status": "ACTIVE",
      "startDate": "2025-11-20T00:00:00.000Z",
      "endDate": null,
      "plan": {
        "id": "plan-uuid",
        "name": "스타터",
        "priceMonthly": 50000,
        "maxVehicles": 3,
        "maxDrivers": 5
      }
    },
    "users": [
      {
        "id": "user-uuid",
        "email": "admin@seoul.com",
        "name": "김관리자",
        "role": "INSTITUTION_ADMIN"
      }
    ]
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Institution not found",
  "error": "Not Found"
}
```

---

### POST /admin/institutions/:id/approve

회원사 승인

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "inst-uuid-3",
    "name": "부산 재가요양센터",
    "businessRegistrationNo": "2345678901",
    "status": "ACTIVE",
    "approvedAt": "2025-11-25T10:00:00.000Z",
    "approvedBy": "admin-uuid",
    "createdAt": "2025-11-24T00:00:00.000Z",
    "updatedAt": "2025-11-25T10:00:00.000Z"
  },
  "message": "Institution approved successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Institution is not in PENDING status",
  "error": "Bad Request"
}
```

---

### POST /admin/institutions/:id/reject

회원사 거부

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "rejectionReason": "서류 불충분: 사업자등록증 사본 필요"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "inst-uuid-3",
    "name": "부산 재가요양센터",
    "businessRegistrationNo": "2345678901",
    "status": "INACTIVE",
    "rejectionReason": "서류 불충분: 사업자등록증 사본 필요",
    "createdAt": "2025-11-24T00:00:00.000Z",
    "updatedAt": "2025-11-25T10:00:00.000Z"
  },
  "message": "Institution rejected successfully"
}
```

---

### POST /admin/institutions/:id/suspend

회원사 정지

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "suspensionReason": "요금 미납 (2개월)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "inst-uuid-1",
    "name": "서울 주간보호센터",
    "businessRegistrationNo": "1234567890",
    "status": "SUSPENDED",
    "suspendedAt": "2025-11-25T10:00:00.000Z",
    "suspensionReason": "요금 미납 (2개월)",
    "createdAt": "2025-11-15T00:00:00.000Z",
    "updatedAt": "2025-11-25T10:00:00.000Z"
  },
  "message": "Institution suspended successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Institution is not in ACTIVE status",
  "error": "Bad Request"
}
```

---

### POST /admin/institutions/:id/reactivate

회원사 재활성화 (정지 해제)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "inst-uuid-1",
    "name": "서울 주간보호센터",
    "businessRegistrationNo": "1234567890",
    "status": "ACTIVE",
    "suspendedAt": null,
    "suspensionReason": null,
    "createdAt": "2025-11-15T00:00:00.000Z",
    "updatedAt": "2025-11-25T10:30:00.000Z"
  },
  "message": "Institution reactivated successfully"
}
```

---

### PATCH /admin/institutions/:id

회원사 정보 수정

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "서울 주간보호센터 (강남점)",
  "institutionTypeId": "type-uuid"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "inst-uuid-1",
    "name": "서울 주간보호센터 (강남점)",
    "businessRegistrationNo": "1234567890",
    "status": "ACTIVE",
    "institutionTypeId": "type-uuid",
    "createdAt": "2025-11-15T00:00:00.000Z",
    "updatedAt": "2025-11-25T10:45:00.000Z"
  },
  "message": "Institution updated successfully"
}
```

---

## Admin - User Management

**Note:** 모든 엔드포인트는 SUPER_ADMIN 권한 필요

### GET /admin/users

전체 사용자 목록 조회 (페이지네이션, 필터링)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 항목 수 (default: 20)
- `role` (optional): 역할 필터 (SUPER_ADMIN, INSTITUTION_ADMIN, DRIVER)
- `institutionId` (optional): 특정 회원사의 사용자만 조회
- `isActive` (optional): 활성 상태 필터 (true/false)

**Example Request:**
```
GET /admin/users?page=1&limit=10&role=INSTITUTION_ADMIN&isActive=true
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid-1",
      "email": "admin@seoul.com",
      "name": "김관리자",
      "role": "INSTITUTION_ADMIN",
      "institutionId": "inst-uuid-1",
      "isActive": true,
      "createdAt": "2025-11-15T00:00:00.000Z",
      "institution": {
        "id": "inst-uuid-1",
        "name": "서울 주간보호센터",
        "status": "ACTIVE"
      }
    },
    {
      "id": "user-uuid-2",
      "email": "admin@busan.com",
      "name": "이관리자",
      "role": "INSTITUTION_ADMIN",
      "institutionId": "inst-uuid-2",
      "isActive": true,
      "createdAt": "2025-11-18T00:00:00.000Z",
      "institution": {
        "id": "inst-uuid-2",
        "name": "부산 재가요양센터",
        "status": "PENDING"
      }
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### POST /admin/users

새 사용자 생성

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123!",
  "name": "박신규",
  "role": "INSTITUTION_ADMIN",
  "institutionId": "inst-uuid-1"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid-new",
    "email": "newuser@example.com",
    "name": "박신규",
    "role": "INSTITUTION_ADMIN",
    "institutionId": "inst-uuid-1",
    "isActive": true,
    "createdAt": "2025-11-25T11:00:00.000Z"
  },
  "message": "User created successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "User with this email already exists",
  "error": "Bad Request"
}
```

---

### PATCH /admin/users/:id

사용자 정보 수정

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "박신규 (수정)",
  "isActive": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid-new",
    "email": "newuser@example.com",
    "name": "박신규 (수정)",
    "role": "INSTITUTION_ADMIN",
    "institutionId": "inst-uuid-1",
    "isActive": false,
    "createdAt": "2025-11-25T11:00:00.000Z",
    "updatedAt": "2025-11-25T11:15:00.000Z"
  },
  "message": "User updated successfully"
}
```

---

### DELETE /admin/users/:id

사용자 삭제 (Soft Delete)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Cannot delete SUPER_ADMIN users",
  "error": "Bad Request"
}
```

---

## Admin - Plan Management

**Note:** 모든 엔드포인트는 SUPER_ADMIN 권한 필요

### GET /admin/plans

전체 요금제 목록 조회 (비활성 포함)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `includeInactive` (optional): 비활성 요금제 포함 여부 (default: false)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "plan-uuid-1",
      "name": "스타터",
      "description": "소규모 기관을 위한 기본 플랜",
      "priceMonthly": 50000,
      "maxVehicles": 3,
      "maxDrivers": 5,
      "maxPassengers": 50,
      "features": ["기본 송영 관리", "실시간 위치 추적", "승객 명단 관리"],
      "isActive": true,
      "createdAt": "2025-11-01T00:00:00.000Z"
    },
    {
      "id": "plan-uuid-2",
      "name": "프로",
      "description": "중규모 기관을 위한 고급 기능",
      "priceMonthly": 150000,
      "maxVehicles": 10,
      "maxDrivers": 15,
      "maxPassengers": 200,
      "features": ["AI 경로 최적화", "고급 분석", "우선 고객 지원"],
      "isActive": true,
      "createdAt": "2025-11-01T00:00:00.000Z"
    },
    {
      "id": "plan-uuid-3",
      "name": "엔터프라이즈",
      "description": "대규모 기관을 위한 맞춤형 솔루션",
      "priceMonthly": 500000,
      "maxVehicles": null,
      "maxDrivers": null,
      "maxPassengers": null,
      "features": ["무제한 차량/기사", "전담 계정 매니저", "맞춤형 개발"],
      "isActive": true,
      "createdAt": "2025-11-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST /admin/plans

새 요금제 생성

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "베이직",
  "description": "최소 기능을 갖춘 저렴한 플랜",
  "priceMonthly": 30000,
  "maxVehicles": 1,
  "maxDrivers": 2,
  "maxPassengers": 20,
  "features": ["기본 송영 관리", "승객 명단 관리"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "plan-uuid-new",
    "name": "베이직",
    "description": "최소 기능을 갖춘 저렴한 플랜",
    "priceMonthly": 30000,
    "maxVehicles": 1,
    "maxDrivers": 2,
    "maxPassengers": 20,
    "features": ["기본 송영 관리", "승객 명단 관리"],
    "isActive": true,
    "createdAt": "2025-11-25T11:30:00.000Z"
  },
  "message": "Plan created successfully"
}
```

---

### PATCH /admin/plans/:id

요금제 수정

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "스타터 플러스",
  "priceMonthly": 60000,
  "maxVehicles": 5
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "plan-uuid-1",
    "name": "스타터 플러스",
    "description": "소규모 기관을 위한 기본 플랜",
    "priceMonthly": 60000,
    "maxVehicles": 5,
    "maxDrivers": 5,
    "maxPassengers": 50,
    "features": ["기본 송영 관리", "실시간 위치 추적", "승객 명단 관리"],
    "isActive": true,
    "createdAt": "2025-11-01T00:00:00.000Z",
    "updatedAt": "2025-11-25T11:45:00.000Z"
  },
  "message": "Plan updated successfully"
}
```

---

### DELETE /admin/plans/:id

요금제 삭제 (Soft Delete - isActive: false)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plan deleted successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Cannot delete plan with active subscriptions",
  "error": "Bad Request"
}
```

---

## Admin - Statistics

**Note:** 모든 엔드포인트는 SUPER_ADMIN 권한 필요

### GET /admin/stats/overview

전체 시스템 통계 개요

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "institutions": {
      "total": 25,
      "pending": 3,
      "active": 20,
      "suspended": 1,
      "inactive": 1,
      "newThisMonth": 5
    },
    "users": {
      "total": 78,
      "superAdmins": 2,
      "institutionAdmins": 25,
      "drivers": 51
    },
    "vehicles": {
      "total": 48,
      "active": 45,
      "maintenance": 3
    },
    "passengers": {
      "total": 856,
      "active": 820,
      "inactive": 36
    },
    "subscriptions": {
      "active": 20,
      "byPlan": {
        "스타터": 12,
        "프로": 6,
        "엔터프라이즈": 2
      }
    }
  }
}
```

---

### GET /admin/stats/institutions

회원사별 사용 현황

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `page` (optional): 페이지 번호 (default: 1)
- `limit` (optional): 페이지당 항목 수 (default: 20)
- `sortBy` (optional): 정렬 기준 (vehicles, passengers, routes)
- `order` (optional): 정렬 순서 (asc, desc)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "institutionId": "inst-uuid-1",
      "institutionName": "서울 주간보호센터",
      "status": "ACTIVE",
      "plan": "스타터",
      "vehicleCount": 3,
      "driverCount": 4,
      "passengerCount": 45,
      "activeRoutes": 6,
      "lastActivityAt": "2025-11-25T09:30:00.000Z"
    },
    {
      "institutionId": "inst-uuid-2",
      "institutionName": "부산 재가요양센터",
      "status": "ACTIVE",
      "plan": "프로",
      "vehicleCount": 8,
      "driverCount": 12,
      "passengerCount": 156,
      "activeRoutes": 16,
      "lastActivityAt": "2025-11-25T10:15:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### GET /admin/stats/revenue

매출 통계

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `period` (optional): 기간 (month, year) (default: month)
- `year` (optional): 연도 (default: 현재 연도)
- `month` (optional): 월 (1-12, period=month일 때만)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "year": 2025,
    "month": 11,
    "totalRevenue": 2450000,
    "byPlan": {
      "스타터": {
        "subscriptions": 12,
        "revenue": 600000
      },
      "프로": {
        "subscriptions": 6,
        "revenue": 900000
      },
      "엔터프라이즈": {
        "subscriptions": 2,
        "revenue": 1000000
      }
    },
    "projectedMonthly": 2450000,
    "projectedYearly": 29400000
  }
}
```

---

### GET /admin/stats/institutions/:id

특정 회원사 상세 통계

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "institution": {
      "id": "inst-uuid-1",
      "name": "서울 주간보호센터",
      "status": "ACTIVE"
    },
    "subscription": {
      "plan": "스타터",
      "startDate": "2025-11-20T00:00:00.000Z",
      "monthlyFee": 50000
    },
    "usage": {
      "vehicles": {
        "current": 3,
        "limit": 3
      },
      "drivers": {
        "current": 4,
        "limit": 5
      },
      "passengers": {
        "current": 45,
        "limit": 50
      }
    },
    "activity": {
      "totalRoutes": 124,
      "totalTrips": 856,
      "lastActivityAt": "2025-11-25T09:30:00.000Z"
    }
  }
}
```

---

## Institution Self-Service

**Note:** 모든 엔드포인트는 INSTITUTION_ADMIN 권한 필요

### GET /institutions/me

내 회원사 정보 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "inst-uuid-1",
    "name": "서울 주간보호센터",
    "businessRegistrationNo": "1234567890",
    "status": "ACTIVE",
    "institutionType": {
      "id": "type-uuid",
      "name": "DAYCARE",
      "displayName": "주간보호"
    },
    "subscription": {
      "id": "sub-uuid",
      "status": "ACTIVE",
      "startDate": "2025-11-20T00:00:00.000Z",
      "plan": {
        "name": "스타터",
        "priceMonthly": 50000,
        "maxVehicles": 3,
        "maxDrivers": 5,
        "maxPassengers": 50
      }
    },
    "usage": {
      "vehicles": 3,
      "drivers": 4,
      "passengers": 45
    },
    "createdAt": "2025-11-15T00:00:00.000Z"
  }
}
```

---

### PATCH /institutions/me

내 회원사 정보 수정

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "name": "서울 주간보호센터 (강남점)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "inst-uuid-1",
    "name": "서울 주간보호센터 (강남점)",
    "businessRegistrationNo": "1234567890",
    "status": "ACTIVE",
    "updatedAt": "2025-11-25T12:00:00.000Z"
  },
  "message": "Institution updated successfully"
}
```

---

### GET /institutions/me/users

내 회원사 소속 사용자 목록

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid-1",
      "email": "admin@seoul.com",
      "name": "김관리자",
      "role": "INSTITUTION_ADMIN",
      "isActive": true,
      "createdAt": "2025-11-15T00:00:00.000Z"
    },
    {
      "id": "user-uuid-2",
      "email": "driver1@seoul.com",
      "name": "박기사",
      "role": "DRIVER",
      "isActive": true,
      "createdAt": "2025-11-16T00:00:00.000Z"
    },
    {
      "id": "user-uuid-3",
      "email": "driver2@seoul.com",
      "name": "이기사",
      "role": "DRIVER",
      "isActive": true,
      "createdAt": "2025-11-17T00:00:00.000Z"
    }
  ]
}
```

---

### POST /institutions/me/users

내 회원사에 사용자 초대

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "email": "newdriver@seoul.com",
  "name": "최기사",
  "role": "DRIVER",
  "password": "temporaryPassword123!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid-new",
    "email": "newdriver@seoul.com",
    "name": "최기사",
    "role": "DRIVER",
    "institutionId": "inst-uuid-1",
    "isActive": true,
    "createdAt": "2025-11-25T12:15:00.000Z"
  },
  "message": "User invited successfully"
}
```

---

### GET /institutions/me/stats

내 회원사 통계

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "usage": {
      "vehicles": {
        "current": 3,
        "limit": 3
      },
      "drivers": {
        "current": 4,
        "limit": 5
      },
      "passengers": {
        "current": 45,
        "limit": 50
      }
    },
    "activity": {
      "totalRoutesThisMonth": 24,
      "totalTripsThisMonth": 168,
      "activePassengers": 45,
      "upcomingTripsToday": 6
    },
    "subscription": {
      "plan": "스타터",
      "monthlyFee": 50000,
      "nextBillingDate": "2025-12-20T00:00:00.000Z"
    }
  }
}
```

---

## Driver APIs (Phase 12)

**Note:** 모든 엔드포인트는 DRIVER 권한 필요

### POST /driver/trips/:id/start

운행 시작

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `id`: Trip ID (UUID)

**Request Body:**
```json
{
  "startLocation": {
    "lat": 37.123456,
    "lng": 127.123456
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid",
    "status": "IN_PROGRESS",
    "actualStart": "2025-11-25T07:00:00.000Z",
    "startLocation": {
      "lat": 37.123456,
      "lng": 127.123456
    }
  },
  "message": "Trip started successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Cannot start trip in IN_PROGRESS status. Trip must be SCHEDULED.",
  "error": "Bad Request"
}
```

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "You are not authorized to start this trip",
  "error": "Forbidden"
}
```

---

### POST /driver/trips/:id/end

운행 종료

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `id`: Trip ID (UUID)

**Request Body:**
```json
{
  "endLocation": {
    "lat": 37.234567,
    "lng": 127.234567
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid",
    "status": "COMPLETED",
    "actualEnd": "2025-11-25T08:30:00.000Z",
    "endLocation": {
      "lat": 37.234567,
      "lng": 127.234567
    },
    "durationMinutes": 90
  },
  "message": "Trip ended successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Cannot end trip in SCHEDULED status. Trip must be IN_PROGRESS.",
  "error": "Bad Request"
}
```

---

### GET /driver/trips/today

오늘의 운행 목록 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "trip-uuid-1",
      "type": "MORNING",
      "status": "COMPLETED",
      "scheduledStart": "2025-11-25T07:00:00.000Z",
      "actualStart": "2025-11-25T07:00:00.000Z",
      "actualEnd": "2025-11-25T08:30:00.000Z",
      "vehicleId": "vehicle-uuid",
      "routeId": "route-uuid"
    },
    {
      "id": "trip-uuid-2",
      "type": "EVENING",
      "status": "SCHEDULED",
      "scheduledStart": "2025-11-25T17:00:00.000Z",
      "actualStart": null,
      "actualEnd": null,
      "vehicleId": "vehicle-uuid",
      "routeId": "route-uuid"
    }
  ]
}
```

---

### GET /driver/trips/:id

운행 상세 조회 (체크인 정보 포함)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `id`: Trip ID (UUID)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "trip": {
      "id": "trip-uuid",
      "type": "MORNING",
      "status": "IN_PROGRESS",
      "scheduledStart": "2025-11-25T07:00:00.000Z",
      "actualStart": "2025-11-25T07:00:00.000Z",
      "actualEnd": null,
      "startLocation": {
        "lat": 37.123456,
        "lng": 127.123456
      },
      "endLocation": null,
      "vehicleId": "vehicle-uuid",
      "routeId": "route-uuid",
      "durationMinutes": null
    },
    "checkIns": [
      {
        "id": "checkin-uuid-1",
        "passengerId": "passenger-uuid-1",
        "type": "BOARDING",
        "timestamp": "2025-11-25T07:10:00.000Z",
        "location": {
          "lat": 37.123456,
          "lng": 127.123456
        }
      },
      {
        "id": "checkin-uuid-2",
        "passengerId": "passenger-uuid-2",
        "type": "BOARDING",
        "timestamp": "2025-11-25T07:20:00.000Z",
        "location": {
          "lat": 37.124567,
          "lng": 127.124567
        }
      }
    ],
    "stats": {
      "totalCheckIns": 2,
      "boardingCount": 2,
      "alightingCount": 0
    }
  }
}
```

---

### POST /driver/checkin

체크인 생성 (탑승/하차)

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "tripId": "trip-uuid",
  "passengerId": "passenger-uuid",
  "type": "BOARDING",
  "timestamp": "2025-11-25T07:10:00.000Z",
  "location": {
    "lat": 37.123456,
    "lng": 127.123456
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "checkin-uuid",
    "tripId": "trip-uuid",
    "passengerId": "passenger-uuid",
    "type": "BOARDING",
    "timestamp": "2025-11-25T07:10:00.000Z",
    "location": {
      "lat": 37.123456,
      "lng": 127.123456
    }
  },
  "message": "Passenger checked in successfully (BOARDING)"
}
```

**Error Response (400 Bad Request - 중복 체크인):**
```json
{
  "success": false,
  "message": "Passenger has already checked in as BOARDING for this trip",
  "error": "Bad Request"
}
```

**Error Response (400 Bad Request - 운행 상태 오류):**
```json
{
  "success": false,
  "message": "Cannot check in passengers. Trip status is SCHEDULED. Trip must be IN_PROGRESS.",
  "error": "Bad Request"
}
```

**CheckIn Type Values:**
- `BOARDING`: 탑승
- `ALIGHTING`: 하차

---

### GET /driver/trips/:id/checkins

운행의 체크인 목록 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Path Parameters:**
- `id`: Trip ID (UUID)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "checkIns": [
      {
        "id": "checkin-uuid-1",
        "passengerId": "passenger-uuid-1",
        "type": "BOARDING",
        "timestamp": "2025-11-25T07:10:00.000Z",
        "location": {
          "lat": 37.123456,
          "lng": 127.123456
        }
      },
      {
        "id": "checkin-uuid-2",
        "passengerId": "passenger-uuid-2",
        "type": "BOARDING",
        "timestamp": "2025-11-25T07:20:00.000Z",
        "location": {
          "lat": 37.124567,
          "lng": 127.124567
        }
      }
    ],
    "stats": {
      "totalCheckIns": 2,
      "boardingCount": 2,
      "alightingCount": 0
    }
  }
}
```

---

### GET /driver/trips/in-progress

현재 진행 중인 운행 조회

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK - 진행 중인 운행 있음):**
```json
{
  "success": true,
  "data": {
    "trip": {
      "id": "trip-uuid",
      "type": "MORNING",
      "status": "IN_PROGRESS",
      "scheduledStart": "2025-11-25T07:00:00.000Z",
      "actualStart": "2025-11-25T07:00:00.000Z",
      "startLocation": {
        "lat": 37.123456,
        "lng": 127.123456
      },
      "vehicleId": "vehicle-uuid",
      "routeId": "route-uuid"
    },
    "checkIns": [
      {
        "id": "checkin-uuid-1",
        "passengerId": "passenger-uuid-1",
        "type": "BOARDING",
        "timestamp": "2025-11-25T07:10:00.000Z"
      }
    ],
    "stats": {
      "totalCheckIns": 1,
      "boardingCount": 1,
      "alightingCount": 0
    }
  }
}
```

**Response (200 OK - 진행 중인 운행 없음):**
```json
{
  "success": true,
  "data": null,
  "message": "No trip in progress"
}
```

---

## Common Response Format

모든 API 응답은 다음 형식을 따릅니다:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Error type",
  "statusCode": 400
}
```

---

## Error Codes

### 400 Bad Request
- 잘못된 요청 파라미터
- 필수 필드 누락
- 유효성 검증 실패
- 비즈니스 로직 위반 (예: 이미 승인된 회원사 재승인 시도)

### 401 Unauthorized
- 인증 토큰 없음
- 잘못된 인증 토큰
- 만료된 액세스 토큰

### 403 Forbidden
- 권한 부족 (예: INSTITUTION_ADMIN이 SUPER_ADMIN 전용 API 호출)
- 다른 회원사 데이터 접근 시도

### 404 Not Found
- 존재하지 않는 리소스
- 삭제된 리소스

### 409 Conflict
- 중복된 이메일
- 중복된 사업자등록번호

### 500 Internal Server Error
- 서버 내부 오류
- 데이터베이스 연결 실패

---

## Rate Limiting

현재 Phase 11에서는 Rate Limiting이 구현되지 않았습니다. 향후 추가 예정:
- Public APIs: 100 requests/minute
- Authenticated APIs: 1000 requests/minute
- Admin APIs: 5000 requests/minute

---

## Pagination

페이지네이션을 지원하는 엔드포인트:
- `GET /admin/institutions`
- `GET /admin/users`
- `GET /admin/stats/institutions`

**Query Parameters:**
- `page`: 페이지 번호 (default: 1)
- `limit`: 페이지당 항목 수 (default: 20, max: 100)

**Response Meta:**
```json
{
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## Authentication Flow

1. **로그인** (`POST /auth/login`)
   - 이메일/비밀번호로 로그인
   - 액세스 토큰 (15분) 및 리프레시 토큰 (7일) 받음

2. **API 호출** (보호된 엔드포인트)
   - `Authorization: Bearer {access_token}` 헤더 포함

3. **토큰 갱신** (`POST /auth/refresh`)
   - 액세스 토큰 만료 시 리프레시 토큰으로 새 액세스 토큰 발급

4. **로그아웃** (`POST /auth/logout`)
   - 클라이언트에서 토큰 삭제

---

## Testing with cURL

### 로그인
```bash
curl -X POST http://localhost:3012/backend/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pickup.com",
    "password": "admin123!@#"
  }'
```

### 회원사 목록 조회
```bash
curl http://localhost:3012/backend/api/v1/admin/institutions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 회원사 승인
```bash
curl -X POST http://localhost:3012/backend/api/v1/admin/institutions/INSTITUTION_ID/approve \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

### 통계 조회
```bash
curl http://localhost:3012/backend/api/v1/admin/stats/overview \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

**Last Updated:** 2025-11-25
**API Version:** v1
**Phase:** 11 - SaaS Admin Portal & Multi-tenant Foundation
