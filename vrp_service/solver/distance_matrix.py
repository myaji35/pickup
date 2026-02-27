"""
distance_matrix.py — 거리 행렬 계산

전략:
  1순위: 카카오 모빌리티 Directions API (실제 도로 거리)
  fallback: Haversine 직선거리 (API 키 없거나 쿼터 초과 시)
"""

import math
import os
from typing import Optional
import httpx

KAKAO_API_KEY = os.getenv("KAKAO_REST_API_KEY", "")
KAKAO_DIRECTIONS_URL = "https://apis-navi.kakaomobility.com/v1/waypoints/directions"


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Haversine 공식으로 두 좌표간 직선 거리(km) 계산"""
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def haversine_duration_min(dist_km: float, avg_speed_kmh: float = 30.0) -> float:
    """직선거리 기반 예상 소요 시간(분) — 도심 평균 30km/h"""
    return (dist_km / avg_speed_kmh) * 60


def build_distance_matrix_haversine(
    locations: list[dict],  # [{"lat": float, "lng": float}, ...]
) -> tuple[list[list[int]], list[list[int]]]:
    """
    Haversine 기반 거리(m) + 시간(초) 행렬 반환.
    OR-Tools는 정수 단위를 선호하므로 m/s 단위로 변환.
    """
    n = len(locations)
    dist_matrix = [[0] * n for _ in range(n)]
    time_matrix = [[0] * n for _ in range(n)]

    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            km = haversine_km(
                locations[i]["lat"], locations[i]["lng"],
                locations[j]["lat"], locations[j]["lng"],
            )
            dist_matrix[i][j] = int(km * 1000)             # 미터
            time_matrix[i][j] = int(km / 30 * 3600)        # 초 (30km/h 기준)

    return dist_matrix, time_matrix


async def build_distance_matrix_kakao(
    locations: list[dict],
) -> Optional[tuple[list[list[int]], list[list[int]]]]:
    """
    카카오 모빌리티 Directions API 기반 실도로 거리/시간 행렬.
    API 키 없거나 실패 시 None 반환 → 호출자가 Haversine fallback.
    """
    if not KAKAO_API_KEY:
        return None

    n = len(locations)
    dist_matrix = [[0] * n for _ in range(n)]
    time_matrix = [[0] * n for _ in range(n)]

    headers = {
        "Authorization": f"KakaoAK {KAKAO_API_KEY}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                try:
                    payload = {
                        "origin": {
                            "x": str(locations[i]["lng"]),
                            "y": str(locations[i]["lat"]),
                        },
                        "destination": {
                            "x": str(locations[j]["lng"]),
                            "y": str(locations[j]["lat"]),
                        },
                        "priority": "TIME",  # 시간 우선
                    }
                    resp = await client.post(
                        KAKAO_DIRECTIONS_URL,
                        json=payload,
                        headers=headers,
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        route = data["routes"][0]["summary"]
                        dist_matrix[i][j] = route["distance"]   # 미터
                        time_matrix[i][j] = route["duration"]    # 초
                    else:
                        # API 오류 → Haversine fallback 값으로 채움
                        km = haversine_km(
                            locations[i]["lat"], locations[i]["lng"],
                            locations[j]["lat"], locations[j]["lng"],
                        )
                        dist_matrix[i][j] = int(km * 1000)
                        time_matrix[i][j] = int(km / 30 * 3600)
                except Exception:
                    km = haversine_km(
                        locations[i]["lat"], locations[i]["lng"],
                        locations[j]["lat"], locations[j]["lng"],
                    )
                    dist_matrix[i][j] = int(km * 1000)
                    time_matrix[i][j] = int(km / 30 * 3600)

    return dist_matrix, time_matrix
