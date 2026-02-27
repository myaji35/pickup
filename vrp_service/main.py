"""
VRP Service — FastAPI 마이크로서비스
Pickup MaaS AI 경로 최적화 엔진

포트: 8001 (기본)
Rails에서 HTTP POST로 호출
"""

import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from solver.distance_matrix import (
    build_distance_matrix_haversine,
    build_distance_matrix_kakao,
    haversine_km,
    haversine_duration_min,
)
from solver.vrp_solver import solve_vrp

load_dotenv()

app = FastAPI(
    title="Pickup MaaS VRP Service",
    description="OR-Tools 기반 차량 경로 최적화 (VRP) 마이크로서비스",
    version="1.0.0",
)


# ── 요청/응답 스키마 ──────────────────────────────────────────────────────────

class LocationPoint(BaseModel):
    lat: float
    lng: float


class Passenger(BaseModel):
    id: int                                    # roster_passenger.id 또는 passenger.id
    name: str = ""
    lat: float
    lng: float
    pickup_address: str = ""


class VehicleInfo(BaseModel):
    start_lat: float
    start_lng: float
    capacity: int = Field(default=45, ge=1)   # 최대 탑승 인원


class OptimizeRequest(BaseModel):
    roster_id: int
    passengers: list[Passenger]
    vehicle: VehicleInfo
    use_kakao: bool = True                    # False → 직선거리만 사용
    time_limit_seconds: int = Field(default=10, ge=1, le=30)


class PassengerResult(BaseModel):
    id: int
    name: str
    boarding_order: int                        # 1-based 픽업 순서
    lat: float
    lng: float
    pickup_address: str
    estimated_arrival_sec: int                 # 출발지로부터 이 승객까지 예상 시간(초)
    cumulative_distance_m: int


class OptimizeResponse(BaseModel):
    roster_id: int
    optimized_passengers: list[PassengerResult]
    total_distance_m: int
    total_duration_sec: int
    total_distance_km: float
    total_duration_min: float
    solver_status: str
    distance_source: str                       # "kakao" or "haversine"


class EtaRequest(BaseModel):
    origin: LocationPoint
    destination: LocationPoint


class EtaResponse(BaseModel):
    distance_m: int
    duration_sec: int
    distance_km: float
    duration_min: float
    source: str


# ── 헬스체크 ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "vrp"}


# ── 경로 최적화 엔드포인트 ────────────────────────────────────────────────────

@app.post("/optimize", response_model=OptimizeResponse)
async def optimize(req: OptimizeRequest):
    """
    VRP 경로 최적화.
    입력: 로스터 ID + 승객 목록 + 차량 정보
    출력: 최적 픽업 순서 + 거리/시간 정보
    """
    if not req.passengers:
        raise HTTPException(status_code=400, detail="승객이 없습니다.")

    # depot(차량 출발지) + 승객 좌표 리스트
    locations = [
        {"lat": req.vehicle.start_lat, "lng": req.vehicle.start_lng},  # index 0 = depot
        *[{"lat": p.lat, "lng": p.lng} for p in req.passengers],
    ]

    # 거리 행렬 계산
    distance_source = "haversine"
    dist_matrix, time_matrix = build_distance_matrix_haversine(locations)

    if req.use_kakao and os.getenv("KAKAO_REST_API_KEY"):
        kakao_result = await build_distance_matrix_kakao(locations)
        if kakao_result is not None:
            dist_matrix, time_matrix = kakao_result
            distance_source = "kakao"

    # VRP 솔버 실행
    result = solve_vrp(
        dist_matrix=dist_matrix,
        time_matrix=time_matrix,
        num_vehicles=1,
        vehicle_capacity=req.vehicle.capacity,
        time_limit_seconds=req.time_limit_seconds,
    )

    # 결과 매핑 (solver order index → passenger)
    # result["optimized_order"] = [1, 3, 2, ...] (1-based indices in locations list)
    optimized_passengers = []
    cumulative_dist = 0
    cumulative_time = 0
    prev_idx = 0  # depot

    for order_rank, loc_idx in enumerate(result["optimized_order"], start=1):
        p_idx = loc_idx - 1  # passengers 리스트 인덱스 (0-based)
        if p_idx < 0 or p_idx >= len(req.passengers):
            continue
        passenger = req.passengers[p_idx]
        cumulative_dist += dist_matrix[prev_idx][loc_idx]
        cumulative_time += time_matrix[prev_idx][loc_idx]
        optimized_passengers.append(PassengerResult(
            id=passenger.id,
            name=passenger.name,
            boarding_order=order_rank,
            lat=passenger.lat,
            lng=passenger.lng,
            pickup_address=passenger.pickup_address,
            estimated_arrival_sec=cumulative_time,
            cumulative_distance_m=cumulative_dist,
        ))
        prev_idx = loc_idx

    total_dist = result["total_distance_m"]
    total_time = result["total_duration_sec"]

    return OptimizeResponse(
        roster_id=req.roster_id,
        optimized_passengers=optimized_passengers,
        total_distance_m=total_dist,
        total_duration_sec=total_time,
        total_distance_km=round(total_dist / 1000, 2),
        total_duration_min=round(total_time / 60, 1),
        solver_status=result["solver_status"],
        distance_source=distance_source,
    )


# ── ETA 단건 계산 엔드포인트 ──────────────────────────────────────────────────

@app.post("/eta", response_model=EtaResponse)
async def calculate_eta(req: EtaRequest):
    """
    출발지 → 목적지 ETA 계산.
    카카오 API 우선, fallback 직선거리.
    """
    dist_m: int
    duration_sec: int
    source: str

    if os.getenv("KAKAO_REST_API_KEY"):
        kakao = await build_distance_matrix_kakao([
            {"lat": req.origin.lat, "lng": req.origin.lng},
            {"lat": req.destination.lat, "lng": req.destination.lng},
        ])
        if kakao:
            dist_m = kakao[0][0][1]
            duration_sec = kakao[1][0][1]
            source = "kakao"
        else:
            km = haversine_km(req.origin.lat, req.origin.lng, req.destination.lat, req.destination.lng)
            dist_m = int(km * 1000)
            duration_sec = int(haversine_duration_min(km) * 60)
            source = "haversine"
    else:
        km = haversine_km(req.origin.lat, req.origin.lng, req.destination.lat, req.destination.lng)
        dist_m = int(km * 1000)
        duration_sec = int(haversine_duration_min(km) * 60)
        source = "haversine"

    return EtaResponse(
        distance_m=dist_m,
        duration_sec=duration_sec,
        distance_km=round(dist_m / 1000, 2),
        duration_min=round(duration_sec / 60, 1),
        source=source,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8001)))
