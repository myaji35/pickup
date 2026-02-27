##
# VrpClientService — VRP 마이크로서비스 HTTP 클라이언트
#
# 환경변수:
#   VRP_SERVICE_URL — VRP 서비스 엔드포인트 (기본: http://localhost:8001)
#
# 사용 예시:
#   svc = VrpClientService.new
#   result = svc.optimize(roster)
#   result = svc.eta(origin: {lat:, lng:}, destination: {lat:, lng:})
##
require "net/http"
require "json"

class VrpClientService
  VRP_BASE = ENV.fetch("VRP_SERVICE_URL", "http://localhost:8001")
  TIMEOUT  = 30  # 최적화는 최대 30초

  class VrpError < StandardError; end

  # ── 경로 최적화 요청 ─────────────────────────────────────────────────────
  # roster: Roster 인스턴스 (passenger_groups + vehicle 포함)
  # vehicle_start: { lat:, lng: } — 차량 현재 위치 (없으면 차고지 기준)
  def optimize(roster, vehicle_start: nil)
    passengers = build_passenger_list(roster)
    return { optimized_passengers: [], total_distance_m: 0, total_duration_sec: 0 } if passengers.empty?

    vehicle = build_vehicle_info(roster, vehicle_start)

    payload = {
      roster_id:            roster.id,
      passengers:           passengers,
      vehicle:              vehicle,
      use_kakao:            ENV["KAKAO_REST_API_KEY"].present?,
      time_limit_seconds:   10,
    }

    response = post("/optimize", payload)
    response
  end

  # ── ETA 단건 계산 ────────────────────────────────────────────────────────
  def eta(origin:, destination:)
    payload = {
      origin:      { lat: origin[:lat],      lng: origin[:lng] },
      destination: { lat: destination[:lat], lng: destination[:lng] },
    }
    post("/eta", payload)
  rescue VrpError => e
    # fallback: Haversine 직선거리
    Rails.logger.warn "[VrpClientService] ETA fallback to Haversine: #{e.message}"
    haversine_eta(origin, destination)
  end

  # ── 헬스체크 ─────────────────────────────────────────────────────────────
  def healthy?
    uri = URI("#{VRP_BASE}/health")
    res = Net::HTTP.get_response(uri)
    res.is_a?(Net::HTTPSuccess)
  rescue
    false
  end

  private

  def build_passenger_list(roster)
    roster.roster_passengers.includes(:passenger).filter_map do |rp|
      p = rp.passenger
      next unless p.pickup_lat.present? && p.pickup_lng.present?

      {
        id:              rp.id,
        name:            p.name,
        lat:             p.pickup_lat.to_f,
        lng:             p.pickup_lng.to_f,
        pickup_address:  p.pickup_address.to_s,
      }
    end
  end

  def build_vehicle_info(roster, vehicle_start)
    # 로스터에 배정된 차량의 마지막 알려진 위치 사용
    # 없으면 첫 번째 승객 주소로 대체 (차고지 정보 미구현 시)
    start = vehicle_start
    if start.nil?
      vehicle = roster.institution.vehicles.first
      start = if vehicle&.last_lat.present? && vehicle&.last_lng.present?
        { lat: vehicle.last_lat, lng: vehicle.last_lng }
      else
        # 서울시청 기본값 (설정 미완료 기관)
        { lat: 37.5665, lng: 126.9780 }
      end
    end

    {
      start_lat: start[:lat].to_f,
      start_lng: start[:lng].to_f,
      capacity:  roster.institution.subscriptions.last&.plan&.max_passengers || 45,
    }
  end

  def post(path, body)
    uri  = URI("#{VRP_BASE}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.open_timeout = 5
    http.read_timeout = TIMEOUT

    req = Net::HTTP::Post.new(uri.path, { "Content-Type" => "application/json" })
    req.body = body.to_json

    res = http.request(req)
    raise VrpError, "HTTP #{res.code}" unless res.is_a?(Net::HTTPSuccess)

    JSON.parse(res.body, symbolize_names: true)
  rescue Net::OpenTimeout, Net::ReadTimeout, Errno::ECONNREFUSED => e
    raise VrpError, "VRP 서비스 연결 실패: #{e.message}"
  end

  def haversine_eta(origin, destination)
    lat1, lng1 = origin[:lat].to_f, origin[:lng].to_f
    lat2, lng2 = destination[:lat].to_f, destination[:lng].to_f

    r = 6371.0
    d_lat = (lat2 - lat1) * Math::PI / 180
    d_lng = (lng2 - lng1) * Math::PI / 180
    a = Math.sin(d_lat / 2)**2 +
        Math.cos(lat1 * Math::PI / 180) * Math.cos(lat2 * Math::PI / 180) *
        Math.sin(d_lng / 2)**2
    dist_km = r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    dist_m       = (dist_km * 1000).to_i
    duration_sec = (dist_km / 30 * 3600).to_i

    {
      distance_m:   dist_m,
      duration_sec: duration_sec,
      distance_km:  dist_km.round(2),
      duration_min: (duration_sec / 60.0).round(1),
      source:       "haversine",
    }
  end
end
