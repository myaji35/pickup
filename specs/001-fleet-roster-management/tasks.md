---
description: "Implementation tasks for fleet roster management and 8-hour care validation"
---

# Tasks: 차량 및 승객명단 관리 + 8시간 케어 검증

**Input**: Design documents from `/specs/001-fleet-roster-management/`
**Prerequisites**: plan.md, spec.md (001 + 002), research.md, data-model.md, contracts/openapi.yaml

**Tests**: TDD approach required per constitution - tests MUST be written first and fail before implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story

**User Request**: 최대한 작은 단위로 쪼개서 진행 - Tasks are broken down into smallest possible increments

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2-001, US2-002)
- Include exact file paths in descriptions
- Task IDs are sequential (T001, T002, T003...)

## Path Conventions

- **Backend**: `backend/src/` for source code, `backend/test/` for tests, `backend/prisma/` for schema
- **Frontend**: `frontend/app/`, `frontend/components/`, `frontend/hooks/`
- Project structure: Web app with separate backend (NestJS) and frontend (Next.js) directories

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create backend directory structure (src/, test/, prisma/)
- [ ] T002 Initialize backend NestJS project with TypeScript 5.x and Node.js 20.x
- [ ] T003 [P] Install backend dependencies (NestJS, Prisma, class-validator, date-fns, exceljs)
- [ ] T004 [P] Configure TypeScript strict mode in backend/tsconfig.json
- [ ] T005 [P] Setup ESLint and Prettier for backend in backend/.eslintrc.js
- [ ] T006 [P] Configure Vitest for backend testing in backend/vitest.config.ts
- [ ] T007 Create frontend directory structure (app/, components/, hooks/, lib/)
- [ ] T008 Initialize frontend Next.js 14 project with App Router and TypeScript
- [ ] T009 [P] Install frontend dependencies (React Query, Zustand, Zod, React Hook Form, shadcn/ui)
- [ ] T010 [P] Configure Tailwind CSS in frontend/tailwind.config.ts
- [ ] T011 [P] Setup Playwright for E2E testing in frontend/playwright.config.ts
- [ ] T012 Create backend environment template file backend/.env.example
- [ ] T013 Create frontend environment template file frontend/.env.local.example
- [ ] T014 [P] Add .gitignore entries for both backend and frontend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Prisma Setup

- [ ] T015 Initialize Prisma in backend/prisma/ with PostgreSQL datasource
- [ ] T016 Copy complete Prisma schema from data-model.md to backend/prisma/schema.prisma
- [ ] T017 Create InstitutionType model in Prisma schema
- [ ] T018 [P] Create Institution model in Prisma schema
- [ ] T019 [P] Create Vehicle model in Prisma schema
- [ ] T020 [P] Create PassengerGroup model in Prisma schema
- [ ] T021 [P] Create Passenger model in Prisma schema
- [ ] T022 [P] Create PassengerSchedule model in Prisma schema
- [ ] T023 [P] Create ShuttleType enum in Prisma schema
- [ ] T024 Add all indexes to Prisma models per data-model.md
- [ ] T025 Create initial Prisma migration backend/prisma/migrations/init/
- [ ] T026 Generate Prisma Client
- [ ] T027 Create seed script backend/prisma/seed.ts for InstitutionType (DAYCARE, GENERAL)
- [ ] T028 [P] Add seed data for sample institutions in backend/prisma/seed.ts
- [ ] T029 [P] Add seed data for sample vehicles in backend/prisma/seed.ts
- [ ] T030 [P] Add seed data for sample passenger groups in backend/prisma/seed.ts
- [ ] T031 [P] Add seed data for sample passengers in backend/prisma/seed.ts
- [ ] T032 [P] Add seed data for sample schedules in backend/prisma/seed.ts
- [ ] T033 Run database migration and seed

### Core Backend Infrastructure

- [ ] T034 Create PrismaService in backend/src/common/database/prisma.service.ts
- [ ] T035 Create DatabaseModule in backend/src/common/database/database.module.ts
- [ ] T036 [P] Create global exception filter in backend/src/common/filters/http-exception.filter.ts
- [ ] T037 [P] Create validation pipe setup in backend/src/main.ts
- [ ] T038 Configure CORS for localhost:3001 in backend/src/main.ts
- [ ] T039 Setup Swagger documentation in backend/src/main.ts
- [ ] T040 Create global prefix 'api/v1' in backend/src/main.ts

### Bounded Context Modules Setup

- [ ] T041 Create Institution module structure backend/src/institution/{domain,application,infrastructure,interface}/
- [ ] T042 [P] Create Fleet module structure backend/src/fleet/{domain,application,infrastructure,interface}/
- [ ] T043 [P] Create Roster module structure backend/src/roster/{domain,application,infrastructure,interface}/
- [ ] T044 Generate InstitutionModule in backend/src/institution/institution.module.ts
- [ ] T045 [P] Generate FleetModule in backend/src/fleet/fleet.module.ts
- [ ] T046 [P] Generate RosterModule in backend/src/roster/roster.module.ts
- [ ] T047 Import DatabaseModule in AppModule backend/src/app.module.ts
- [ ] T048 [P] Import InstitutionModule in AppModule
- [ ] T049 [P] Import FleetModule in AppModule
- [ ] T050 [P] Import RosterModule in AppModule

### Frontend Foundation

- [ ] T051 Create React Query Provider in frontend/app/providers.tsx
- [ ] T052 Configure QueryClient with defaults in frontend/app/providers.tsx
- [ ] T053 Add Providers to root layout frontend/app/layout.tsx
- [ ] T054 [P] Create API client utility in frontend/lib/api-client.ts
- [ ] T055 [P] Create Zustand UI store in frontend/stores/ui-store.ts
- [ ] T056 Install shadcn/ui components (button, table, form, dialog, input, select, toast)
- [ ] T057 Create shared Zod schemas in frontend/lib/schemas/ (to be shared with backend later)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 (001) - 차량 등록 및 관리 (Priority: P1) 🎯 MVP

**Goal**: 기관 관리자가 차량을 등록하고 조회/수정/삭제할 수 있다

**Independent Test**: 관리자가 차량번호 뒤 4자리와 정원을 입력하여 차량을 등록하고, 차량 목록을 조회할 수 있다

### Tests for User Story 1 (TDD Required) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T058 [P] [US1-001] Create Vehicle domain entity test in backend/test/unit/fleet/domain/entities/vehicle.entity.spec.ts
- [ ] T059 [P] [US1-001] Create VehicleRepository interface test in backend/test/unit/fleet/domain/repositories/vehicle.repository.spec.ts
- [ ] T060 [P] [US1-001] Create VehicleService unit test in backend/test/unit/fleet/application/services/vehicle.service.spec.ts
- [ ] T061 [P] [US1-001] Create VehicleController unit test in backend/test/unit/fleet/interface/controllers/vehicle.controller.spec.ts
- [ ] T062 [P] [US1-001] Create Vehicle API integration test in backend/test/integration/fleet/vehicle.api.spec.ts
- [ ] T063 [P] [US1-001] Create E2E test for vehicle registration in frontend/e2e/vehicle-management.spec.ts

### Domain Layer for User Story 1

- [ ] T064 [P] [US1-001] Create Vehicle entity in backend/src/fleet/domain/entities/vehicle.entity.ts
- [ ] T065 [P] [US1-001] Create LicensePlateLastFour value object in backend/src/fleet/domain/value-objects/license-plate-last-four.vo.ts
- [ ] T066 [P] [US1-001] Create PassengerCapacity value object in backend/src/fleet/domain/value-objects/passenger-capacity.vo.ts
- [ ] T067 [US1-001] Add capacity validation logic (5-15 range) to Vehicle entity
- [ ] T068 [US1-001] Create IVehicleRepository interface in backend/src/fleet/domain/repositories/vehicle.repository.interface.ts

### Application Layer for User Story 1

- [ ] T069 [P] [US1-001] Create CreateVehicleCommand in backend/src/fleet/application/commands/create-vehicle.command.ts
- [ ] T070 [P] [US1-001] Create UpdateVehicleCommand in backend/src/fleet/application/commands/update-vehicle.command.ts
- [ ] T071 [P] [US1-001] Create DeleteVehicleCommand in backend/src/fleet/application/commands/delete-vehicle.command.ts
- [ ] T072 [P] [US1-001] Create GetVehiclesQuery in backend/src/fleet/application/queries/get-vehicles.query.ts
- [ ] T073 [P] [US1-001] Create GetVehicleQuery in backend/src/fleet/application/queries/get-vehicle.query.ts
- [ ] T074 [US1-001] Create VehicleService in backend/src/fleet/application/services/vehicle.service.ts
- [ ] T075 [US1-001] Implement createVehicle method in VehicleService
- [ ] T076 [US1-001] Implement getVehicles method in VehicleService
- [ ] T077 [US1-001] Implement getVehicleById method in VehicleService
- [ ] T078 [US1-001] Implement updateVehicle method in VehicleService
- [ ] T079 [US1-001] Implement deleteVehicle method in VehicleService

### Infrastructure Layer for User Story 1

- [ ] T080 [US1-001] Create VehicleRepository implementation in backend/src/fleet/infrastructure/persistence/vehicle.repository.ts
- [ ] T081 [US1-001] Implement create method in VehicleRepository
- [ ] T082 [US1-001] Implement findAll method with institution filter in VehicleRepository
- [ ] T083 [US1-001] Implement findById method in VehicleRepository
- [ ] T084 [US1-001] Implement update method in VehicleRepository
- [ ] T085 [US1-001] Implement delete method in VehicleRepository
- [ ] T086 [US1-001] Add Prisma to Domain entity mapping in VehicleRepository
- [ ] T087 [US1-001] Add Domain entity to Prisma mapping in VehicleRepository

### Interface Layer for User Story 1

- [ ] T088 [P] [US1-001] Create CreateVehicleDto in backend/src/fleet/interface/dtos/create-vehicle.dto.ts
- [ ] T089 [P] [US1-001] Create UpdateVehicleDto in backend/src/fleet/interface/dtos/update-vehicle.dto.ts
- [ ] T090 [P] [US1-001] Create VehicleResponseDto in backend/src/fleet/interface/dtos/vehicle-response.dto.ts
- [ ] T091 [US1-001] Add validation decorators to CreateVehicleDto (lastFourDigits pattern, capacity range)
- [ ] T092 [US1-001] Create VehicleController in backend/src/fleet/interface/controllers/vehicle.controller.ts
- [ ] T093 [US1-001] Implement POST /vehicles endpoint in VehicleController
- [ ] T094 [US1-001] Implement GET /vehicles endpoint in VehicleController
- [ ] T095 [US1-001] Implement GET /vehicles/:id endpoint in VehicleController
- [ ] T096 [US1-001] Implement PATCH /vehicles/:id endpoint in VehicleController
- [ ] T097 [US1-001] Implement DELETE /vehicles/:id endpoint in VehicleController
- [ ] T098 [US1-001] Add Swagger decorators to all VehicleController endpoints
- [ ] T099 [US1-001] Register VehicleController in FleetModule
- [ ] T100 [US1-001] Register VehicleService in FleetModule providers
- [ ] T101 [US1-001] Register VehicleRepository in FleetModule providers

### Frontend for User Story 1

- [ ] T102 [P] [US1-001] Create Vehicle type in frontend/types/vehicle.ts
- [ ] T103 [P] [US1-001] Create vehicle Zod schema in frontend/lib/schemas/vehicle.schema.ts
- [ ] T104 [P] [US1-001] Create useVehicles query hook in frontend/hooks/queries/use-vehicles.ts
- [ ] T105 [P] [US1-001] Create useCreateVehicle mutation hook in frontend/hooks/mutations/use-create-vehicle.ts
- [ ] T106 [P] [US1-001] Create useUpdateVehicle mutation hook in frontend/hooks/mutations/use-update-vehicle.ts
- [ ] T107 [P] [US1-001] Create useDeleteVehicle mutation hook in frontend/hooks/mutations/use-delete-vehicle.ts
- [ ] T108 [US1-001] Create VehicleTable component in frontend/components/tables/vehicle-table.tsx
- [ ] T109 [US1-001] Create VehicleForm component in frontend/components/forms/vehicle-form.tsx
- [ ] T110 [US1-001] Create VehicleDialog component in frontend/components/dialogs/vehicle-dialog.tsx
- [ ] T111 [US1-001] Create vehicles page in frontend/app/institutions/[id]/vehicles/page.tsx
- [ ] T112 [US1-001] Add vehicle registration form to page
- [ ] T113 [US1-001] Add vehicle list table to page
- [ ] T114 [US1-001] Add edit vehicle dialog
- [ ] T115 [US1-001] Add delete vehicle confirmation
- [ ] T116 [US1-001] Add validation error displays
- [ ] T117 [US1-001] Add success/error toast notifications

**Checkpoint**: User Story 1 complete - Vehicles can be managed independently

---

## Phase 4: User Story 4 (001) - 승객 그룹 생성 및 관리 (Priority: P1)

**Goal**: 기관 관리자가 승객 그룹을 생성하고 승객을 할당할 수 있다

**Independent Test**: 관리자가 그룹 코드와 이름을 입력하여 그룹을 생성하고, 승객들을 그룹에 할당할 수 있다

**Note**: US4 before US2/US3 because groups are needed for passenger assignments

### Tests for User Story 4 (TDD Required) ⚠️

- [ ] T118 [P] [US4-001] Create PassengerGroup domain entity test in backend/test/unit/roster/domain/entities/passenger-group.entity.spec.ts
- [ ] T119 [P] [US4-001] Create GroupCode value object test in backend/test/unit/roster/domain/value-objects/group-code.vo.spec.ts
- [ ] T120 [P] [US4-001] Create PassengerGroupService unit test in backend/test/unit/roster/application/services/passenger-group.service.spec.ts
- [ ] T121 [P] [US4-001] Create PassengerGroup API integration test in backend/test/integration/roster/passenger-group.api.spec.ts
- [ ] T122 [P] [US4-001] Create E2E test for group management in frontend/e2e/passenger-group.spec.ts

### Domain Layer for User Story 4

- [ ] T123 [P] [US4-001] Create PassengerGroup entity in backend/src/roster/domain/entities/passenger-group.entity.ts
- [ ] T124 [P] [US4-001] Create GroupCode value object in backend/src/roster/domain/value-objects/group-code.vo.ts
- [ ] T125 [US4-001] Add group validation logic to PassengerGroup entity
- [ ] T126 [US4-001] Add method to check passenger capacity in PassengerGroup entity
- [ ] T127 [US4-001] Create IPassengerGroupRepository interface in backend/src/roster/domain/repositories/passenger-group.repository.interface.ts

### Application Layer for User Story 4

- [ ] T128 [P] [US4-001] Create CreatePassengerGroupCommand in backend/src/roster/application/commands/create-passenger-group.command.ts
- [ ] T129 [P] [US4-001] Create UpdatePassengerGroupCommand in backend/src/roster/application/commands/update-passenger-group.command.ts
- [ ] T130 [P] [US4-001] Create DeletePassengerGroupCommand in backend/src/roster/application/commands/delete-passenger-group.command.ts
- [ ] T131 [P] [US4-001] Create GetPassengerGroupsQuery in backend/src/roster/application/queries/get-passenger-groups.query.ts
- [ ] T132 [US4-001] Create PassengerGroupService in backend/src/roster/application/services/passenger-group.service.ts
- [ ] T133 [US4-001] Implement createGroupWithPassengers method in PassengerGroupService (transaction)
- [ ] T134 [US4-001] Implement getGroups method in PassengerGroupService
- [ ] T135 [US4-001] Implement getGroupById method in PassengerGroupService
- [ ] T136 [US4-001] Implement addPassengersToGroup method in PassengerGroupService
- [ ] T137 [US4-001] Implement removePassengersFromGroup method in PassengerGroupService
- [ ] T138 [US4-001] Implement updateGroup method in PassengerGroupService
- [ ] T139 [US4-001] Implement deleteGroup method in PassengerGroupService

### Infrastructure Layer for User Story 4

- [ ] T140 [US4-001] Create PassengerGroupRepository in backend/src/roster/infrastructure/persistence/passenger-group.repository.ts
- [ ] T141 [US4-001] Implement create method in PassengerGroupRepository
- [ ] T142 [US4-001] Implement createWithPassengers method using Prisma transaction
- [ ] T143 [US4-001] Implement findAll method with institution filter
- [ ] T144 [US4-001] Implement findById with passengers included
- [ ] T145 [US4-001] Implement update method in PassengerGroupRepository
- [ ] T146 [US4-001] Implement delete method in PassengerGroupRepository
- [ ] T147 [US4-001] Implement updateTotalPassengerCount method

### Interface Layer for User Story 4

- [ ] T148 [P] [US4-001] Create CreatePassengerGroupDto in backend/src/roster/interface/dtos/create-passenger-group.dto.ts
- [ ] T149 [P] [US4-001] Create UpdatePassengerGroupDto in backend/src/roster/interface/dtos/update-passenger-group.dto.ts
- [ ] T150 [P] [US4-001] Create PassengerGroupResponseDto in backend/src/roster/interface/dtos/passenger-group-response.dto.ts
- [ ] T151 [US4-001] Add validation for groupCode uniqueness check
- [ ] T152 [US4-001] Create PassengerGroupController in backend/src/roster/interface/controllers/passenger-group.controller.ts
- [ ] T153 [US4-001] Implement POST /passenger-groups endpoint
- [ ] T154 [US4-001] Implement GET /passenger-groups endpoint
- [ ] T155 [US4-001] Implement GET /passenger-groups/:id endpoint with passengers
- [ ] T156 [US4-001] Implement PATCH /passenger-groups/:id endpoint
- [ ] T157 [US4-001] Implement DELETE /passenger-groups/:id endpoint
- [ ] T158 [US4-001] Add Swagger decorators to PassengerGroupController
- [ ] T159 [US4-001] Register PassengerGroupController in RosterModule
- [ ] T160 [US4-001] Register PassengerGroupService in RosterModule
- [ ] T161 [US4-001] Register PassengerGroupRepository in RosterModule

### Frontend for User Story 4

- [ ] T162 [P] [US4-001] Create PassengerGroup type in frontend/types/passenger-group.ts
- [ ] T163 [P] [US4-001] Create passenger group Zod schema in frontend/lib/schemas/passenger-group.schema.ts
- [ ] T164 [P] [US4-001] Create usePassengerGroups query hook in frontend/hooks/queries/use-passenger-groups.ts
- [ ] T165 [P] [US4-001] Create useCreatePassengerGroup mutation hook in frontend/hooks/mutations/use-create-passenger-group.ts
- [ ] T166 [P] [US4-001] Create useUpdatePassengerGroup mutation hook in frontend/hooks/mutations/use-update-passenger-group.ts
- [ ] T167 [P] [US4-001] Create useDeletePassengerGroup mutation hook in frontend/hooks/mutations/use-delete-passenger-group.ts
- [ ] T168 [US4-001] Create PassengerGroupTable component in frontend/components/tables/passenger-group-table.tsx
- [ ] T169 [US4-001] Create PassengerGroupForm component in frontend/components/forms/passenger-group-form.tsx
- [ ] T170 [US4-001] Create PassengerGroupDialog component in frontend/components/dialogs/passenger-group-dialog.tsx
- [ ] T171 [US4-001] Create passenger groups page in frontend/app/institutions/[id]/passenger-groups/page.tsx
- [ ] T172 [US4-001] Add group creation form
- [ ] T173 [US4-001] Add group list table
- [ ] T174 [US4-001] Add passenger selection for group assignment
- [ ] T175 [US4-001] Add edit group dialog
- [ ] T176 [US4-001] Add delete confirmation with dependency check

**Checkpoint**: User Story 4 complete - Passenger groups can be managed

---

## Phase 5: User Story 2 (001) - 승객 명단 수동 입력 관리 (Priority: P2)

**Goal**: 기관 관리자가 승객을 수동으로 추가/조회/수정/삭제할 수 있다

**Independent Test**: 관리자가 승객 정보를 입력하여 등록하고, 승객 목록을 조회할 수 있다

### Tests for User Story 2 (TDD Required) ⚠️

- [ ] T177 [P] [US2-001] Create Passenger domain entity test in backend/test/unit/roster/domain/entities/passenger.entity.spec.ts
- [ ] T178 [P] [US2-001] Create PhoneNumber value object test in backend/test/unit/roster/domain/value-objects/phone-number.vo.spec.ts
- [ ] T179 [P] [US2-001] Create Address value object test in backend/test/unit/roster/domain/value-objects/address.vo.spec.ts
- [ ] T180 [P] [US2-001] Create PassengerService unit test in backend/test/unit/roster/application/services/passenger.service.spec.ts
- [ ] T181 [P] [US2-001] Create Passenger API integration test in backend/test/integration/roster/passenger.api.spec.ts
- [ ] T182 [P] [US2-001] Create E2E test for passenger management in frontend/e2e/passenger.spec.ts

### Domain Layer for User Story 2

- [ ] T183 [P] [US2-001] Create Passenger entity in backend/src/roster/domain/entities/passenger.entity.ts
- [ ] T184 [P] [US2-001] Create PhoneNumber value object in backend/src/roster/domain/value-objects/phone-number.vo.ts
- [ ] T185 [P] [US2-001] Create Address value object in backend/src/roster/domain/value-objects/address.vo.ts
- [ ] T186 [US2-001] Add phone number validation (Korean format) to PhoneNumber VO
- [ ] T187 [US2-001] Add address validation logic to Address VO
- [ ] T188 [US2-001] Add pickup/dropoff validation to Passenger entity (must be different)
- [ ] T189 [US2-001] Create IPassengerRepository interface in backend/src/roster/domain/repositories/passenger.repository.interface.ts

### Application Layer for User Story 2

- [ ] T190 [P] [US2-001] Create CreatePassengerCommand in backend/src/roster/application/commands/create-passenger.command.ts
- [ ] T191 [P] [US2-001] Create UpdatePassengerCommand in backend/src/roster/application/commands/update-passenger.command.ts
- [ ] T192 [P] [US2-001] Create DeletePassengerCommand in backend/src/roster/application/commands/delete-passenger.command.ts
- [ ] T193 [P] [US2-001] Create GetPassengersQuery in backend/src/roster/application/queries/get-passengers.query.ts
- [ ] T194 [US2-001] Create PassengerService in backend/src/roster/application/services/passenger.service.ts
- [ ] T195 [US2-001] Implement createPassenger method in PassengerService
- [ ] T196 [US2-001] Implement getPassengers method with pagination in PassengerService
- [ ] T197 [US2-001] Implement getPassengerById method in PassengerService
- [ ] T198 [US2-001] Implement updatePassenger method in PassengerService
- [ ] T199 [US2-001] Implement deletePassenger method with cascade handling
- [ ] T200 [US2-001] Add phone number uniqueness check (per institution)

### Infrastructure Layer for User Story 2

- [ ] T201 [US2-001] Create PassengerRepository in backend/src/roster/infrastructure/persistence/passenger.repository.ts
- [ ] T202 [US2-001] Implement create method in PassengerRepository
- [ ] T203 [US2-001] Implement findAll with pagination in PassengerRepository
- [ ] T204 [US2-001] Implement findById with group and schedule relations
- [ ] T205 [US2-001] Implement update method in PassengerRepository
- [ ] T206 [US2-001] Implement delete method in PassengerRepository
- [ ] T207 [US2-001] Implement findByPhoneNumber method for uniqueness check
- [ ] T208 [US2-001] Add N+1 query prevention using Prisma include

### Interface Layer for User Story 2

- [ ] T209 [P] [US2-001] Create CreatePassengerDto in backend/src/roster/interface/dtos/create-passenger.dto.ts
- [ ] T210 [P] [US2-001] Create UpdatePassengerDto in backend/src/roster/interface/dtos/update-passenger.dto.ts
- [ ] T211 [P] [US2-001] Create PassengerResponseDto in backend/src/roster/interface/dtos/passenger-response.dto.ts
- [ ] T212 [P] [US2-001] Create PaginatedPassengersDto in backend/src/roster/interface/dtos/paginated-passengers.dto.ts
- [ ] T213 [US2-001] Add validation decorators to CreatePassengerDto (phone format, addresses)
- [ ] T214 [US2-001] Create PassengerController in backend/src/roster/interface/controllers/passenger.controller.ts
- [ ] T215 [US2-001] Implement POST /passengers endpoint
- [ ] T216 [US2-001] Implement GET /passengers endpoint with pagination
- [ ] T217 [US2-001] Implement GET /passengers/:id endpoint
- [ ] T218 [US2-001] Implement PATCH /passengers/:id endpoint
- [ ] T219 [US2-001] Implement DELETE /passengers/:id endpoint
- [ ] T220 [US2-001] Add query parameters for shuttleType filter
- [ ] T221 [US2-001] Add query parameters for search (name, phone)
- [ ] T222 [US2-001] Add Swagger decorators to PassengerController
- [ ] T223 [US2-001] Register PassengerController in RosterModule
- [ ] T224 [US2-001] Register PassengerService in RosterModule
- [ ] T225 [US2-001] Register PassengerRepository in RosterModule

### Frontend for User Story 2

- [ ] T226 [P] [US2-001] Create Passenger type in frontend/types/passenger.ts
- [ ] T227 [P] [US2-001] Create passenger Zod schema in frontend/lib/schemas/passenger.schema.ts
- [ ] T228 [P] [US2-001] Create usePassengers query hook in frontend/hooks/queries/use-passengers.ts
- [ ] T229 [P] [US2-001] Create useCreatePassenger mutation hook in frontend/hooks/mutations/use-create-passenger.ts
- [ ] T230 [P] [US2-001] Create useUpdatePassenger mutation hook in frontend/hooks/mutations/use-update-passenger.ts
- [ ] T231 [P] [US2-001] Create useDeletePassenger mutation hook in frontend/hooks/mutations/use-delete-passenger.ts
- [ ] T232 [US2-001] Create PassengerTable component in frontend/components/tables/passenger-table.tsx
- [ ] T233 [US2-001] Create PassengerForm component in frontend/components/forms/passenger-form.tsx
- [ ] T234 [US2-001] Create PassengerDialog component in frontend/components/dialogs/passenger-dialog.tsx
- [ ] T235 [US2-001] Create passengers page in frontend/app/institutions/[id]/passengers/page.tsx
- [ ] T236 [US2-001] Add passenger registration form
- [ ] T237 [US2-001] Add passenger list table with pagination
- [ ] T238 [US2-001] Add search functionality (name, phone)
- [ ] T239 [US2-001] Add shuttle type filter dropdown
- [ ] T240 [US2-001] Add edit passenger dialog
- [ ] T241 [US2-001] Add delete confirmation
- [ ] T242 [US2-001] Add group assignment selector in form

**Checkpoint**: User Story 2 complete - Passengers can be managed manually

---

## Phase 6: User Story 5 (001) - 차량-그룹 연결 및 차량 교체 (Priority: P2)

**Goal**: 기관 관리자가 차량을 그룹에 연결하고, 차량 교체 시 그룹을 재연결할 수 있다

**Independent Test**: 차량을 그룹에 연결하고, 차량 삭제 후 신규 차량에 그룹을 재연결하여 승객이 자동 배정되는지 확인

### Tests for User Story 5 (TDD Required) ⚠️

- [ ] T243 [P] [US5-001] Create vehicle-group connection test in backend/test/integration/fleet/vehicle-group.api.spec.ts
- [ ] T244 [P] [US5-001] Create vehicle replacement scenario test in backend/test/integration/fleet/vehicle-replacement.spec.ts
- [ ] T245 [P] [US5-001] Create E2E test for vehicle replacement in frontend/e2e/vehicle-replacement.spec.ts

### Application Layer for User Story 5

- [ ] T246 [US5-001] Add ConnectVehicleToGroupCommand in backend/src/fleet/application/commands/connect-vehicle-to-group.command.ts
- [ ] T247 [US5-001] Add DisconnectVehicleFromGroupCommand in backend/src/fleet/application/commands/disconnect-vehicle-from-group.command.ts
- [ ] T248 [US5-001] Implement connectToGroup method in VehicleService
- [ ] T249 [US5-001] Add capacity validation before connecting (group size vs vehicle capacity)
- [ ] T250 [US5-001] Implement disconnectFromGroup method in VehicleService
- [ ] T251 [US5-001] Update deleteVehicle to set currentGroupId to null (not cascade delete)

### Infrastructure Layer for User Story 5

- [ ] T252 [US5-001] Add connectToGroup method in VehicleRepository
- [ ] T253 [US5-001] Add disconnectFromGroup method in VehicleRepository
- [ ] T254 [US5-001] Add findByGroupId method for validation

### Interface Layer for User Story 5

- [ ] T255 [US5-001] Create ConnectVehicleToGroupDto in backend/src/fleet/interface/dtos/connect-vehicle-to-group.dto.ts
- [ ] T256 [US5-001] Implement POST /vehicles/:id/connect-group endpoint in VehicleController
- [ ] T257 [US5-001] Implement POST /vehicles/:id/disconnect-group endpoint in VehicleController
- [ ] T258 [US5-001] Add capacity validation error response handling

### Frontend for User Story 5

- [ ] T259 [P] [US5-001] Create useConnectVehicleToGroup mutation hook in frontend/hooks/mutations/use-connect-vehicle-to-group.ts
- [ ] T260 [P] [US5-001] Create useDisconnectVehicleFromGroup mutation hook in frontend/hooks/mutations/use-disconnect-vehicle-from-group.ts
- [ ] T261 [US5-001] Add group selection dropdown to VehicleForm
- [ ] T262 [US5-001] Add capacity warning when selecting group
- [ ] T263 [US5-001] Add disconnect group button to vehicle detail view
- [ ] T264 [US5-001] Add vehicle replacement wizard component in frontend/components/wizards/vehicle-replacement-wizard.tsx
- [ ] T265 [US5-001] Add step 1: Select old vehicle to delete
- [ ] T266 [US5-001] Add step 2: Confirm group to preserve
- [ ] T267 [US5-001] Add step 3: Register new vehicle and connect to group
- [ ] T268 [US5-001] Add success confirmation showing passengers reassigned

**Checkpoint**: User Story 5 complete - Vehicle-group connections work with replacement flow

---

## Phase 7: User Story 3 (001) - 승객 명단 엑셀 일괄 업로드 (Priority: P3)

**Goal**: 기관 관리자가 엑셀 파일로 승객을 일괄 등록할 수 있다

**Independent Test**: 엑셀 템플릿을 다운로드하고, 승객 정보를 입력한 후 업로드하여 일괄 등록

### Tests for User Story 3 (TDD Required) ⚠️

- [ ] T269 [P] [US3-001] Create ExcelParserService unit test in backend/test/unit/roster/application/services/excel-parser.service.spec.ts
- [ ] T270 [P] [US3-001] Create bulk upload API test in backend/test/integration/roster/bulk-upload.api.spec.ts
- [ ] T271 [P] [US3-001] Create E2E test for Excel upload in frontend/e2e/excel-upload.spec.ts

### Application Layer for User Story 3

- [ ] T272 [US3-001] Create ExcelParserService in backend/src/roster/application/services/excel-parser.service.ts
- [ ] T273 [US3-001] Install and configure exceljs library
- [ ] T274 [US3-001] Implement parsePassengerFile method using exceljs streaming
- [ ] T275 [US3-001] Add row validation logic (required fields, format checks)
- [ ] T276 [US3-001] Add duplicate phone number detection
- [ ] T277 [US3-001] Implement generateTemplate method for Excel template download
- [ ] T278 [US3-001] Create BulkCreatePassengersCommand in backend/src/roster/application/commands/bulk-create-passengers.command.ts
- [ ] T279 [US3-001] Implement bulkCreatePassengers method in PassengerService
- [ ] T280 [US3-001] Add transaction wrapper for bulk create (all or nothing vs partial)
- [ ] T281 [US3-001] Implement error aggregation for row-by-row errors

### Infrastructure Layer for User Story 3

- [ ] T282 [US3-001] Add createMany method in PassengerRepository using Prisma.createMany
- [ ] T283 [US3-001] Add skipDuplicates option handling

### Interface Layer for User Story 3

- [ ] T284 [P] [US3-001] Create BulkUploadPassengersDto in backend/src/roster/interface/dtos/bulk-upload-passengers.dto.ts
- [ ] T285 [P] [US3-001] Create BulkUploadResultDto in backend/src/roster/interface/dtos/bulk-upload-result.dto.ts
- [ ] T286 [P] [US3-001] Create BulkUploadRowErrorDto in backend/src/roster/interface/dtos/bulk-upload-row-error.dto.ts
- [ ] T287 [US3-001] Configure Multer for file upload in PassengerController
- [ ] T288 [US3-001] Implement POST /passengers/bulk-upload endpoint with @UseInterceptors(FileInterceptor)
- [ ] T289 [US3-001] Implement GET /passengers/template endpoint for template download
- [ ] T290 [US3-001] Add file size validation (5MB max)
- [ ] T291 [US3-001] Add file type validation (.xlsx only)
- [ ] T292 [US3-001] Add max rows validation (1000 rows)

### Frontend for User Story 3

- [ ] T293 [P] [US3-001] Create useBulkUploadPassengers mutation hook in frontend/hooks/mutations/use-bulk-upload-passengers.ts
- [ ] T294 [P] [US3-001] Create useDownloadTemplate query hook in frontend/hooks/queries/use-download-template.ts
- [ ] T295 [US3-001] Create ExcelUploadDialog component in frontend/components/dialogs/excel-upload-dialog.tsx
- [ ] T296 [US3-001] Add file input with drag-and-drop
- [ ] T297 [US3-001] Add template download button
- [ ] T298 [US3-001] Add upload progress indicator
- [ ] T299 [US3-001] Create BulkUploadResultDisplay component showing success/failure counts
- [ ] T300 [US3-001] Add error table showing row-by-row errors
- [ ] T301 [US3-001] Add duplicate handling options UI (skip vs overwrite)
- [ ] T302 [US3-001] Add "Download errors as Excel" button for corrections
- [ ] T303 [US3-001] Integrate ExcelUploadDialog into passengers page

**Checkpoint**: User Story 3 complete - Bulk Excel upload works

---

## Phase 8: User Story 6 (001) - 승객 및 차량 통합 검색/필터링 (Priority: P3)

**Goal**: 기관 관리자가 승객/차량을 검색하고 필터링할 수 있다

**Independent Test**: 이름으로 검색, 셔틀 유형으로 필터링, 그룹으로 필터링이 모두 작동

### Tests for User Story 6 (TDD Required) ⚠️

- [ ] T304 [P] [US6-001] Create search functionality test in backend/test/integration/roster/passenger-search.spec.ts
- [ ] T305 [P] [US6-001] Create filter functionality test in backend/test/integration/roster/passenger-filter.spec.ts

### Infrastructure Layer for User Story 6

- [ ] T306 [US6-001] Add search method with ILIKE query in PassengerRepository
- [ ] T307 [US6-001] Add filter by shuttleType in PassengerRepository
- [ ] T308 [US6-001] Add filter by groupId in PassengerRepository
- [ ] T309 [US6-001] Add filter by assignment status (assigned/unassigned) in PassengerRepository
- [ ] T310 [US6-001] Add combined search and filter method with proper indexing
- [ ] T311 [US6-001] Add search by lastFourDigits in VehicleRepository

### Interface Layer for User Story 6

- [ ] T312 [US6-001] Update GET /passengers endpoint to accept search query parameter
- [ ] T313 [US6-001] Update GET /passengers endpoint to accept shuttleType filter
- [ ] T314 [US6-001] Update GET /passengers endpoint to accept groupId filter
- [ ] T315 [US6-001] Update GET /passengers endpoint to accept assignment status filter
- [ ] T316 [US6-001] Update GET /vehicles endpoint to accept search query parameter

### Frontend for User Story 6

- [ ] T317 [US6-001] Add search input to PassengerTable
- [ ] T318 [US6-001] Add debounced search handling (300ms delay)
- [ ] T319 [US6-001] Add shuttle type filter dropdown
- [ ] T320 [US6-001] Add group filter dropdown
- [ ] T321 [US6-001] Add assignment status filter toggle
- [ ] T322 [US6-001] Add "Clear all filters" button
- [ ] T323 [US6-001] Update usePassengers hook to support all filters
- [ ] T324 [US6-001] Add filter indicator badges showing active filters
- [ ] T325 [US6-001] Add search input to VehicleTable
- [ ] T326 [US6-001] Update useVehicles hook to support search

**Checkpoint**: User Story 6 complete - Search and filtering work

---

## Phase 9: User Story 1 (002) - 승객 탑승/하차 시간 입력 및 8시간 검증 (Priority: P1)

**Goal**: 기관 관리자가 승객의 탑승/하차 시간을 입력하고 8시간 케어 검증을 받는다

**Independent Test**: 탑승 시간 "08:00", 하차 시간 "17:00" 입력 시 9시간으로 검증 통과, "15:00" 입력 시 7시간으로 경고 표시

### Tests for User Story 1-002 (TDD Required) ⚠️

- [ ] T327 [P] [US1-002] Create CareTimeCalculator domain service test in backend/test/unit/roster/domain/services/care-time-calculator.spec.ts
- [ ] T328 [P] [US1-002] Create PassengerSchedule entity test in backend/test/unit/roster/domain/entities/passenger-schedule.entity.spec.ts
- [ ] T329 [P] [US1-002] Create care time validation test in backend/test/integration/roster/care-time-validation.spec.ts
- [ ] T330 [P] [US1-002] Create E2E test for 8-hour validation in frontend/e2e/care-time-validation.spec.ts

### Domain Layer for User Story 1-002

- [ ] T331 [P] [US1-002] Create PassengerSchedule entity in backend/src/roster/domain/entities/passenger-schedule.entity.ts
- [ ] T332 [P] [US1-002] Create CareTimeCalculator domain service in backend/src/roster/domain/services/care-time-calculator.domain-service.ts
- [ ] T333 [US1-002] Install and configure date-fns library
- [ ] T334 [US1-002] Implement calculateCareTimeHours method using date-fns
- [ ] T335 [US1-002] Implement isCareTimeSufficient method (8-hour check)
- [ ] T336 [US1-002] Add validation for pickup < dropoff (same-day only)
- [ ] T337 [US1-002] Add HH:MM format validation

### Application Layer for User Story 1-002

- [ ] T338 [P] [US1-002] Create UpsertPassengerScheduleCommand in backend/src/roster/application/commands/upsert-passenger-schedule.command.ts
- [ ] T339 [P] [US1-002] Create DeletePassengerScheduleCommand in backend/src/roster/application/commands/delete-passenger-schedule.command.ts
- [ ] T340 [US1-002] Create CareTimeValidatorService in backend/src/roster/application/services/care-time-validator.service.ts
- [ ] T341 [US1-002] Implement validateAndCalculate method in CareTimeValidatorService
- [ ] T342 [US1-002] Add auto-calculation of careTimeHours on upsert
- [ ] T343 [US1-002] Add auto-setting of isCareTimeInsufficient flag
- [ ] T344 [US1-002] Implement upsertSchedule method in PassengerService
- [ ] T345 [US1-002] Implement deleteSchedule method in PassengerService
- [ ] T346 [US1-002] Add institution type check (only validate for DAYCARE)

### Infrastructure Layer for User Story 1-002

- [ ] T347 [US1-002] Create PassengerScheduleRepository in backend/src/roster/infrastructure/persistence/passenger-schedule.repository.ts
- [ ] T348 [US1-002] Implement upsert method (create or update based on passengerId)
- [ ] T349 [US1-002] Implement delete method
- [ ] T350 [US1-002] Implement findByPassengerId method

### Interface Layer for User Story 1-002

- [ ] T351 [P] [US1-002] Create PassengerScheduleDto in backend/src/roster/interface/dtos/passenger-schedule.dto.ts
- [ ] T352 [P] [US1-002] Create PassengerScheduleResponseDto in backend/src/roster/interface/dtos/passenger-schedule-response.dto.ts
- [ ] T353 [US1-002] Add HH:MM regex validation to PassengerScheduleDto
- [ ] T354 [US1-002] Implement PUT /passengers/:id/schedule endpoint in PassengerController
- [ ] T355 [US1-002] Implement DELETE /passengers/:id/schedule endpoint in PassengerController
- [ ] T356 [US1-002] Add warning response for insufficient care time (200 with warning field)
- [ ] T357 [US1-002] Add Swagger examples showing warning scenarios
- [ ] T358 [US1-002] Register CareTimeValidatorService in RosterModule
- [ ] T359 [US1-002] Register PassengerScheduleRepository in RosterModule

### Frontend for User Story 1-002

- [ ] T360 [P] [US1-002] Create PassengerSchedule type in frontend/types/passenger-schedule.ts
- [ ] T361 [P] [US1-002] Create passenger schedule Zod schema in frontend/lib/schemas/passenger-schedule.schema.ts
- [ ] T362 [P] [US1-002] Create useUpsertPassengerSchedule mutation hook in frontend/hooks/mutations/use-upsert-passenger-schedule.ts
- [ ] T363 [P] [US1-002] Create useDeletePassengerSchedule mutation hook in frontend/hooks/mutations/use-delete-passenger-schedule.ts
- [ ] T364 [US1-002] Create ScheduleTimeInput component in frontend/components/inputs/schedule-time-input.tsx with HH:MM format
- [ ] T365 [US1-002] Create CareTimeDisplay component showing calculated hours in frontend/components/display/care-time-display.tsx
- [ ] T366 [US1-002] Create CareTimeWarning component for <8 hour warnings
- [ ] T367 [US1-002] Add schedule fields to PassengerForm (pickup time, dropoff time)
- [ ] T368 [US1-002] Add real-time care time calculation display
- [ ] T369 [US1-002] Add warning dialog when care time < 8 hours
- [ ] T370 [US1-002] Add "Save anyway" and "Cancel" buttons to warning dialog
- [ ] T371 [US1-002] Add care time badge to passenger list (red if insufficient)
- [ ] T372 [US1-002] Add schedule information to passenger detail view

**Checkpoint**: User Story 1-002 complete - 8-hour care time validation works

---

## Phase 10: User Story 2 (002) - 기관 유형별 케어 시간 규칙 설정 (Priority: P2)

**Goal**: 시스템 관리자가 기관 유형을 설정하고 최소 케어 시간을 정의할 수 있다

**Independent Test**: "주간보호" 유형을 생성하고 최소 8시간을 설정한 후, 기관에 적용하여 검증 규칙이 적용되는지 확인

### Tests for User Story 2-002 (TDD Required) ⚠️

- [ ] T373 [P] [US2-002] Create InstitutionType entity test in backend/test/unit/institution/domain/entities/institution-type.entity.spec.ts
- [ ] T374 [P] [US2-002] Create institution type API test in backend/test/integration/institution/institution-type.api.spec.ts

### Domain Layer for User Story 2-002

- [ ] T375 [US2-002] Create InstitutionType entity in backend/src/institution/domain/entities/institution-type.entity.ts
- [ ] T376 [US2-002] Add minimumCareTimeHours validation logic
- [ ] T377 [US2-002] Create IInstitutionTypeRepository interface

### Application Layer for User Story 2-002

- [ ] T378 [P] [US2-002] Create CreateInstitutionTypeCommand (system admin only)
- [ ] T379 [P] [US2-002] Create GetInstitutionTypesQuery
- [ ] T380 [US2-002] Create InstitutionTypeService in backend/src/institution/application/services/institution-type.service.ts
- [ ] T381 [US2-002] Implement getInstitutionTypes method
- [ ] T382 [US2-002] Implement createInstitutionType method (if needed, or rely on seed data)

### Infrastructure Layer for User Story 2-002

- [ ] T383 [US2-002] Create InstitutionTypeRepository in backend/src/institution/infrastructure/persistence/institution-type.repository.ts
- [ ] T384 [US2-002] Implement findAll method
- [ ] T385 [US2-002] Implement findById method
- [ ] T386 [US2-002] Implement create method (if needed)

### Interface Layer for User Story 2-002

- [ ] T387 [P] [US2-002] Create InstitutionTypeResponseDto
- [ ] T388 [US2-002] Create InstitutionTypeController in backend/src/institution/interface/controllers/institution-type.controller.ts
- [ ] T389 [US2-002] Implement GET /institution-types endpoint
- [ ] T390 [US2-002] Add Swagger decorators
- [ ] T391 [US2-002] Register InstitutionTypeController in InstitutionModule
- [ ] T392 [US2-002] Register InstitutionTypeService in InstitutionModule
- [ ] T393 [US2-002] Register InstitutionTypeRepository in InstitutionModule

### Update Institution Entity to Support Type

- [ ] T394 [US2-002] Create Institution entity in backend/src/institution/domain/entities/institution.entity.ts
- [ ] T395 [US2-002] Add institutionTypeId field and relation
- [ ] T396 [P] [US2-002] Create UpdateInstitutionCommand
- [ ] T397 [US2-002] Create InstitutionService in backend/src/institution/application/services/institution.service.ts
- [ ] T398 [US2-002] Implement updateInstitutionType method
- [ ] T399 [US2-002] Create InstitutionRepository in backend/src/institution/infrastructure/persistence/institution.repository.ts
- [ ] T400 [US2-002] Implement update method with type relation
- [ ] T401 [P] [US2-002] Create InstitutionResponseDto
- [ ] T402 [P] [US2-002] Create UpdateInstitutionDto
- [ ] T403 [US2-002] Create InstitutionController in backend/src/institution/interface/controllers/institution.controller.ts
- [ ] T404 [US2-002] Implement PATCH /institutions/:id endpoint
- [ ] T405 [US2-002] Implement GET /institutions/:id endpoint with type included

### Frontend for User Story 2-002

- [ ] T406 [P] [US2-002] Create InstitutionType type in frontend/types/institution-type.ts
- [ ] T407 [P] [US2-002] Create useInstitutionTypes query hook
- [ ] T408 [P] [US2-002] Create useUpdateInstitution mutation hook
- [ ] T409 [US2-002] Create InstitutionTypeSelector component
- [ ] T410 [US2-002] Add institution type selection to institution settings page
- [ ] T411 [US2-002] Add information tooltip explaining minimum care time requirements
- [ ] T412 [US2-002] Add confirmation dialog when changing type (warn about validation changes)

**Checkpoint**: User Story 2-002 complete - Institution types with care time rules work

---

## Phase 11: User Story 3 (002) - 케어 시간 준수 현황 모니터링 및 리포트 (Priority: P3)

**Goal**: 기관 관리자가 케어 시간 준수 통계와 리포트를 조회할 수 있다

**Independent Test**: 케어 시간 리포트를 조회하여 8시간 이상/미만 승객 비율을 확인

### Tests for User Story 3-002 (TDD Required) ⚠️

- [ ] T413 [P] [US3-002] Create care time report service test in backend/test/unit/roster/application/services/care-time-report.service.spec.ts
- [ ] T414 [P] [US3-002] Create care time report API test in backend/test/integration/roster/care-time-report.api.spec.ts

### Application Layer for User Story 3-002

- [ ] T415 [P] [US3-002] Create GetCareTimeReportQuery
- [ ] T416 [P] [US3-002] Create GetCareTimeWarningsQuery
- [ ] T417 [US3-002] Create CareTimeReportService in backend/src/roster/application/services/care-time-report.service.ts
- [ ] T418 [US3-002] Implement generateReport method
- [ ] T419 [US3-002] Implement calculateStatistics (total, sufficient, insufficient percentages)
- [ ] T420 [US3-002] Implement getWarningsList method (insufficient care time passengers only)

### Infrastructure Layer for User Story 3-002

- [ ] T421 [US3-002] Add findAllWithSchedules method in PassengerRepository
- [ ] T422 [US3-002] Add filterByInsufficientCareTime method in PassengerScheduleRepository
- [ ] T423 [US3-002] Add aggregation query for statistics

### Interface Layer for User Story 3-002

- [ ] T424 [P] [US3-002] Create CareTimeReportDto in backend/src/roster/interface/dtos/care-time-report.dto.ts
- [ ] T425 [P] [US3-002] Create CareTimeReportItemDto
- [ ] T426 [P] [US3-002] Create CareTimeWarningDto
- [ ] T427 [US3-002] Implement GET /care-time-report endpoint in PassengerController or new CareTimeController
- [ ] T428 [US3-002] Implement GET /care-time-warnings endpoint
- [ ] T429 [US3-002] Add filterInsufficient query parameter
- [ ] T430 [US3-002] Add Swagger examples for report responses
- [ ] T431 [US3-002] Register CareTimeReportService in RosterModule

### Frontend for User Story 3-002

- [ ] T432 [P] [US3-002] Create CareTimeReport type in frontend/types/care-time-report.ts
- [ ] T433 [P] [US3-002] Create useCareTimeReport query hook
- [ ] T434 [P] [US3-002] Create useCareTimeWarnings query hook
- [ ] T435 [US3-002] Create CareTimeStatistics component showing percentages with charts
- [ ] T436 [US3-002] Create CareTimeReportTable component listing all passengers with hours
- [ ] T437 [US3-002] Create CareTimeWarningsList component for insufficient passengers
- [ ] T438 [US3-002] Create care time report page in frontend/app/institutions/[id]/care-time-report/page.tsx
- [ ] T439 [US3-002] Add filter toggle "Show only insufficient"
- [ ] T440 [US3-002] Add export to Excel button for report
- [ ] T441 [US3-002] Add visual indicators (red badges) for insufficient care time
- [ ] T442 [US3-002] Add shortage calculation display (e.g., "2 hours short")

**Checkpoint**: User Story 3-002 complete - Care time monitoring and reporting work

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T443 [P] Create API documentation in backend/docs/api-documentation.md
- [ ] T444 [P] Create developer guide in backend/docs/developer-guide.md
- [ ] T445 [P] Add request/response logging middleware in backend/src/common/middleware/logger.middleware.ts
- [ ] T446 [P] Add performance monitoring (response time tracking)
- [ ] T447 [P] Create health check endpoint GET /health
- [ ] T448 [P] Add database connection health check
- [ ] T449 [P] Add global error handling for Prisma errors
- [ ] T450 [P] Add validation error formatting (consistent format)
- [ ] T451 [P] Create frontend error boundary in frontend/components/error-boundary.tsx
- [ ] T452 [P] Add global loading states in Zustand store
- [ ] T453 [P] Add toast notification system in frontend
- [ ] T454 [P] Create reusable confirmation dialog component
- [ ] T455 [P] Add keyboard shortcuts for common actions (Ctrl+N for new, etc.)
- [ ] T456 [P] Add responsive design breakpoints for mobile
- [ ] T457 [P] Add dark mode support (optional)
- [ ] T458 [P] Create comprehensive E2E test suite covering all user flows
- [ ] T459 [P] Add performance testing for 100 concurrent users
- [ ] T460 [P] Add database migration rollback procedures documentation
- [ ] T461 [P] Create deployment guide in backend/docs/deployment.md
- [ ] T462 [P] Add environment variable validation on startup
- [ ] T463 [P] Create backup and restore procedures documentation
- [ ] T464 Run quickstart.md validation (follow all setup steps)
- [ ] T465 Code cleanup and refactoring
- [ ] T466 Security audit (SQL injection, XSS, CSRF prevention)
- [ ] T467 [P] Add rate limiting for API endpoints
- [ ] T468 [P] Add input sanitization middleware
- [ ] T469 Final E2E test run across all user stories
- [ ] T470 Performance optimization (query optimization, indexing review)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-11)**: All depend on Foundational phase completion
  - Phase 3 (US1-001): Can start after Foundational - No dependencies on other stories
  - Phase 4 (US4-001): Can start after Foundational - No dependencies on other stories
  - Phase 5 (US2-001): Depends on Phase 4 (needs PassengerGroup for assignments)
  - Phase 6 (US5-001): Depends on Phase 3 and Phase 4 (needs both Vehicle and PassengerGroup)
  - Phase 7 (US3-001): Depends on Phase 5 (extends manual passenger entry)
  - Phase 8 (US6-001): Depends on Phase 5 (search/filter existing passengers)
  - Phase 9 (US1-002): Depends on Phase 5 (extends Passenger with schedule)
  - Phase 10 (US2-002): Can start after Foundational - Independent
  - Phase 11 (US3-002): Depends on Phase 9 and Phase 10 (needs schedules and types)
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Foundational (Phase 2) - MUST COMPLETE FIRST
    ↓
    ├─→ US1-001 (Vehicle Management) ────────┐
    │                                         ↓
    ├─→ US4-001 (Passenger Groups) ──────────┼─→ US5-001 (Vehicle-Group Connection)
    │       ↓                                 │
    │       └─→ US2-001 (Manual Passengers) ─┘
    │               ↓
    │               ├─→ US3-001 (Excel Upload)
    │               │
    │               ├─→ US6-001 (Search/Filter)
    │               │
    │               └─→ US1-002 (8hr Validation) ──┐
    │                                               ↓
    └─→ US2-002 (Institution Types) ───────────────┴─→ US3-002 (Care Time Reports)
```

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Domain entities before repositories
- Repositories before services
- Services before controllers
- Controllers registered in modules
- Frontend hooks before components
- Components before pages
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003-T014)
- All Foundational database schema tasks can run in parallel (T017-T023)
- All seed data tasks can run in parallel (T028-T032)
- All module structure tasks can run in parallel (T041-T050)
- Within each user story, all [P] tasks can run in parallel
- US1-001, US4-001, US2-002, US10-002 can be developed in parallel (independent stories)
- Tests for a user story marked [P] can run in parallel

---

## Parallel Example: User Story 1 (Vehicle Management)

```bash
# Launch all unit tests for US1 together (write tests first):
Task T058: "Create Vehicle domain entity test"
Task T059: "Create VehicleRepository interface test"
Task T060: "Create VehicleService unit test"
Task T061: "Create VehicleController unit test"
Task T062: "Create Vehicle API integration test"
Task T063: "Create E2E test for vehicle registration"

# After tests FAIL, launch all domain value objects together:
Task T065: "Create LicensePlateLastFour value object"
Task T066: "Create PassengerCapacity value object"

# Launch all DTOs together:
Task T088: "Create CreateVehicleDto"
Task T089: "Create UpdateVehicleDto"
Task T090: "Create VehicleResponseDto"

# Launch all frontend query hooks together:
Task T104: "Create useVehicles query hook"
Task T105: "Create useCreateVehicle mutation hook"
Task T106: "Create useUpdateVehicle mutation hook"
Task T107: "Create useDeleteVehicle mutation hook"
```

---

## Implementation Strategy

### MVP First (Minimum Viable Product)

**Fastest path to working system**:

1. Complete Phase 1: Setup (~2-3 hours)
2. Complete Phase 2: Foundational (~4-6 hours) - CRITICAL BLOCKER
3. Complete Phase 3: US1-001 (Vehicle Management) (~6-8 hours)
4. Complete Phase 4: US4-001 (Passenger Groups) (~6-8 hours)
5. Complete Phase 5: US2-001 (Manual Passengers) (~6-8 hours)
6. **STOP and VALIDATE**: Test all three stories independently
7. Basic MVP is ready (~24-30 hours total)

This gives you:
- ✅ Vehicle registration and management
- ✅ Passenger group creation and assignment
- ✅ Manual passenger entry and management
- ✅ Basic vehicle-group connections

**Skip for MVP**:
- US5-001 (Vehicle replacement) - Nice to have
- US3-001 (Excel upload) - Can add later
- US6-001 (Search/filter) - Enhancement
- All 002 features (8-hour validation) - Can add later

### Incremental Delivery

**Add features one by one**:

1. MVP (US1, US4, US2) → Test → Deploy ✅
2. Add US5-001 (Vehicle replacement) → Test → Deploy
3. Add US3-001 (Excel upload) → Test → Deploy
4. Add US6-001 (Search/filter) → Test → Deploy
5. Add US1-002 (8hr validation) → Test → Deploy
6. Add US2-002 (Institution types) → Test → Deploy
7. Add US3-002 (Care reports) → Test → Deploy

Each increment adds value without breaking previous features.

### Parallel Team Strategy

**With 3 developers working simultaneously**:

1. **Week 1**: All devs complete Setup + Foundational together (~2-3 days)
2. **Week 2**: Once Foundational is done, split:
   - Developer A: US1-001 (Vehicles)
   - Developer B: US4-001 (Groups)
   - Developer C: US2-002 (Institution Types)
3. **Week 3**: Integrate and test, then:
   - Developer A: US2-001 (Passengers)
   - Developer B: US5-001 (Vehicle-Group connections)
   - Developer C: US1-002 (8hr validation)
4. **Week 4**: Integrate, test, polish
   - Developer A: US3-001 (Excel upload)
   - Developer B: US6-001 (Search/filter)
   - Developer C: US3-002 (Reports)
5. **Week 5**: Final integration, E2E testing, deployment

**Estimated Timeline**:
- MVP (Phases 1-5): 1-2 weeks with single developer, 3-5 days with team
- Full Feature Set (All phases): 3-4 weeks with single developer, 2-3 weeks with team
- Polish & Production Ready: Add 1 week

---

## Task Breakdown Summary

| Phase | User Story | Task Count | Estimated Hours | Priority |
|-------|-----------|-----------|----------------|----------|
| Phase 1 | Setup | 14 tasks | 2-3h | Critical |
| Phase 2 | Foundational | 43 tasks (T015-T057) | 4-6h | Critical (BLOCKER) |
| Phase 3 | US1-001 (Vehicles) | 60 tasks (T058-T117) | 6-8h | P1 - MVP |
| Phase 4 | US4-001 (Groups) | 59 tasks (T118-T176) | 6-8h | P1 - MVP |
| Phase 5 | US2-001 (Passengers) | 66 tasks (T177-T242) | 6-8h | P2 - MVP |
| Phase 6 | US5-001 (Vehicle-Group) | 26 tasks (T243-T268) | 3-4h | P2 |
| Phase 7 | US3-001 (Excel Upload) | 35 tasks (T269-T303) | 4-5h | P3 |
| Phase 8 | US6-001 (Search/Filter) | 23 tasks (T304-T326) | 2-3h | P3 |
| Phase 9 | US1-002 (8hr Validation) | 46 tasks (T327-T372) | 5-6h | P1 (002) |
| Phase 10 | US2-002 (Institution Types) | 37 tasks (T373-T412) | 4-5h | P2 (002) |
| Phase 11 | US3-002 (Care Reports) | 31 tasks (T413-T442) | 3-4h | P3 (002) |
| Phase 12 | Polish | 28 tasks (T443-T470) | 4-6h | Final |

**Total**: 470 tasks
**Estimated Total Time**: 50-62 hours (single developer)
**MVP Time**: 24-33 hours (Phases 1-5 only)

---

## Notes

- [P] tasks = different files, no dependencies within their phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD REQUIRED**: Write tests FIRST, ensure they FAIL before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- User requested "최대한 작은 단위로 쪼개서" - tasks are broken into smallest possible units (e.g., separate tasks for each DTO, each method, each component)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Run `npm test` frequently to ensure tests pass as you implement
- Run `npm run db:seed` to get sample data for testing
- Use Swagger UI at `/api-docs` to test API endpoints
- Constitution requires 90% test coverage - write comprehensive tests
