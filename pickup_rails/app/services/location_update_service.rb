# GPS 위치 업데이트 + OBD 데이터 저장 + ActionCable 브로드캐스트
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
    {
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
  end
end
