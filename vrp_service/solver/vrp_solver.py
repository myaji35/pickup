"""
vrp_solver.py — OR-Tools 기반 VRP 솔버

입력:
  - locations: depot(0번) + 승객 픽업 지점 순서의 좌표 리스트
  - dist_matrix: NxN 거리 행렬 (미터)
  - time_matrix: NxN 시간 행렬 (초)
  - num_vehicles: 차량 수 (기본 1)
  - vehicle_capacity: 차량 최대 탑승 인원

출력:
  - optimized_order: 방문 순서 인덱스 리스트 (depot 제외)
  - total_distance_m: 총 경로 거리(m)
  - total_duration_sec: 총 경로 시간(초)
  - solver_status: 솔버 상태 메시지
"""

from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp


def solve_vrp(
    dist_matrix: list[list[int]],
    time_matrix: list[list[int]],
    num_vehicles: int = 1,
    vehicle_capacity: int = 45,
    demands: list[int] | None = None,
    time_limit_seconds: int = 10,
) -> dict:
    """
    VRP 솔버 실행.
    depot = 인덱스 0 (차량 출발/도착지)
    승객 = 인덱스 1 ~ N-1
    """
    n = len(dist_matrix)
    if n <= 1:
        return {
            "optimized_order": [],
            "total_distance_m": 0,
            "total_duration_sec": 0,
            "solver_status": "no_passengers",
        }

    # demands: 각 노드 수요량 (depot=0, 승객=1)
    if demands is None:
        demands = [0] + [1] * (n - 1)

    manager = pywrapcp.RoutingIndexManager(n, num_vehicles, 0)
    routing = pywrapcp.RoutingModel(manager)

    # ── 거리 콜백 ─────────────────────────────────────────────────
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node   = manager.IndexToNode(to_index)
        return dist_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # ── 시간 콜백 ─────────────────────────────────────────────────
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node   = manager.IndexToNode(to_index)
        return time_matrix[from_node][to_node]

    time_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.AddDimension(
        time_callback_index,
        slack_max=0,
        capacity=int(4 * 3600),  # 최대 4시간
        fix_start_cumul_to_zero=True,
        name="Time",
    )

    # ── 수용 인원 제약 ───────────────────────────────────────────
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        slack_max=0,
        vehicle_capacities=[vehicle_capacity] * num_vehicles,
        fix_start_cumul_to_zero=True,
        name="Capacity",
    )

    # ── 탐색 파라미터 ────────────────────────────────────────────
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_params.time_limit.seconds = time_limit_seconds

    # ── 풀기 ────────────────────────────────────────────────────
    solution = routing.SolveWithParameters(search_params)

    if not solution:
        # 해를 못 찾은 경우 — 입력 순서 그대로 반환
        return {
            "optimized_order": list(range(1, n)),
            "total_distance_m": _calc_sequential_distance(dist_matrix),
            "total_duration_sec": _calc_sequential_duration(time_matrix),
            "solver_status": "infeasible_fallback",
        }

    # ── 결과 추출 ────────────────────────────────────────────────
    order = []
    total_dist = 0
    total_time = 0

    index = routing.Start(0)
    while not routing.IsEnd(index):
        node = manager.IndexToNode(index)
        next_index = solution.Value(routing.NextVar(index))
        next_node  = manager.IndexToNode(next_index)
        if node != 0 or len(order) > 0:  # depot(0) 첫 방문 제외
            if not routing.IsEnd(next_index):
                total_dist += dist_matrix[node][next_node]
                total_time += time_matrix[node][next_node]
        if node != 0:
            order.append(node)
        index = next_index

    return {
        "optimized_order": order,            # depot 제외한 방문 순서 (1-based index → passenger index)
        "total_distance_m": total_dist,
        "total_duration_sec": total_time,
        "solver_status": f"optimal (objective={solution.ObjectiveValue()})",
    }


def _calc_sequential_distance(dist_matrix: list[list[int]]) -> int:
    n = len(dist_matrix)
    return sum(dist_matrix[i][i + 1] for i in range(n - 1))


def _calc_sequential_duration(time_matrix: list[list[int]]) -> int:
    n = len(time_matrix)
    return sum(time_matrix[i][i + 1] for i in range(n - 1))
