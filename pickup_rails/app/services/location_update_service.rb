# GPS 위치 업데이트 + OBD 데이터 저장 + ActionCable 브로드캐스트 + ETA 계산
class LocationUpdateService
  attr_reader :trip, :lat, :lng, :heading, :speed,
              :rpm, :coolant_temp, :fuel_level, :throttle, :events

  def initialize(trip, lat:, lng:, heading: nil, speed: nil,
                 rpm: nil, coolant_temp: nil, fuel_level: nil, throttle: nil, events: [])
    @trip         = trip
    @lat          = lat.to_f
    @lng          = lng.to_f
    @heading      = heading&.to_f
    @speed        = speed&.to_f
    @rpm          = rpm&.to_f
    @coolant_temp = coolant_temp&.to_f
    @fuel_level   = fuel_level&.to_f
    @throttle     = throttle&.to_f
    @events       = Array(events)
  end

  def call
    now = Time.current

    # Trip 위치 + OBD 업데이트
    obd_attrs = {}
    if rpm || coolant_temp || fuel_level || throttle
      obd_attrs = {
        last_rpm:          rpm,
        last_coolant_temp: coolant_temp,
        last_fuel_level:   fuel_level,
        last_throttle:     throttle,
        obd_updated_at:    now
      }.compact
    end

    trip.update!(
      current_lat:          lat,
      current_lng:          lng,
      location_updated_at:  now,
      **obd_attrs
    )

    # Vehicle 위치 업데이트
    trip.vehicle.update!(
      current_lat:          lat,
      current_lng:          lng,
      heading:              heading,
      speed:                speed,
      location_updated_at:  now
    )

    # 안전 이벤트 저장
    save_driving_events(now)

    payload = build_payload(now)

    # Trip 단위 스트림 브로드캐스트
    ActionCable.server.broadcast("vehicle_locations:trip:#{trip.id}", payload)

    # 기관 전체 스트림 브로드캐스트
    institution_id = trip.roster.institution_id
    ActionCable.server.broadcast("vehicle_locations:institution:#{institution_id}", payload)

    payload
  end

  private

  def save_driving_events(now)
    return if events.empty?

    valid_types = DrivingEvent::TYPES
    driver_id   = trip.driver_id

    events.each do |ev|
      event_type = ev[:event_type] || ev["event_type"]
      next unless valid_types.include?(event_type.to_s)

      DrivingEvent.create!(
        trip_id:    trip.id,
        driver_id:  driver_id,
        event_type: event_type,
        speed:      ev[:speed] || ev["speed"],
        rpm:        ev[:rpm]   || ev["rpm"],
        lat:        lat,
        lng:        lng,
        created_at: now
      )
    end
  rescue => e
    Rails.logger.warn("DrivingEvent 저장 실패: #{e.message}")
  end

  def build_payload(now)
    eta_info = calculate_next_stop_eta

    payload = {
      type:        "location_update",
      trip_id:     trip.id,
      vehicle_id:  trip.vehicle_id,
      plate_last4: trip.vehicle.plate_last4,
      lat:         lat,
      lng:         lng,
      heading:     heading,
      speed:       speed,
      rpm:         rpm,
      fuel_level:  fuel_level,
      status:      trip.status,
      updated_at:  now.iso8601
    }

    payload.merge!(eta_info) if eta_info
    payload
  end

  # 다음 탑승 예정 정류장까지의 ETA 계산
  # - 현재 위치 → 다음 미탑승 승객 픽업 위치
  # - boarding_order 순서 기준, 아직 pending 상태인 첫 번째 승객
  def calculate_next_stop_eta
    next_check_in = find_next_pending_check_in
    return nil unless next_check_in

    passenger = next_check_in.passenger
    return nil unless passenger.pickup_lat.present? && passenger.pickup_lng.present?

    origin      = { lat: lat, lng: lng }
    destination = { lat: passenger.pickup_lat.to_f, lng: passenger.pickup_lng.to_f }

    svc    = VrpClientService.new
    result = svc.eta(origin: origin, destination: destination)

    {
      next_stop: {
        check_in_id:     next_check_in.id,
        passenger_id:    passenger.id,
        passenger_name:  passenger.name,
        pickup_address:  passenger.pickup_address,
        lat:             passenger.pickup_lat.to_f,
        lng:             passenger.pickup_lng.to_f,
        boarding_order:  next_check_in_boarding_order(next_check_in),
      },
      eta_minutes:    result[:duration_min],
      eta_distance_m: result[:distance_m],
      eta_source:     result[:source] || "haversine",
    }
  rescue => e
    Rails.logger.warn("[LocationUpdateService] ETA 계산 실패: #{e.message}")
    nil
  end

  # 다음 탑승 대기 중인 CheckIn 조회 (boarding_order 기준 오름차순)
  def find_next_pending_check_in
    trip.check_ins
        .where(status: :pending)
        .joins("LEFT JOIN roster_passengers ON roster_passengers.passenger_id = check_ins.passenger_id
                AND roster_passengers.roster_id = #{trip.roster_id}")
        .order(Arel.sql("COALESCE(roster_passengers.boarding_order, 9999), check_ins.id"))
        .includes(:passenger)
        .first
  end

  # check_in에 대응하는 roster_passenger의 boarding_order 조회
  def next_check_in_boarding_order(check_in)
    trip.roster.roster_passengers
        .find_by(passenger_id: check_in.passenger_id)
        &.boarding_order
  end
end
