# GPS 위치 업데이트 + ActionCable 브로드캐스트 처리
class LocationUpdateService
  attr_reader :trip, :lat, :lng, :heading, :speed

  def initialize(trip, lat:, lng:, heading: nil, speed: nil)
    @trip    = trip
    @lat     = lat.to_f
    @lng     = lng.to_f
    @heading = heading&.to_f
    @speed   = speed&.to_f
  end

  def call
    now = Time.current

    # Trip 위치 업데이트 (콜백/검증 없이 직접 업데이트)
    trip.update!(
      current_lat:          lat,
      current_lng:          lng,
      location_updated_at:  now
    )

    # Vehicle 위치 업데이트
    trip.vehicle.update!(
      current_lat:          lat,
      current_lng:          lng,
      heading:              heading,
      speed:                speed,
      location_updated_at:  now
    )

    payload = build_payload(now)

    # Trip 단위 스트림 브로드캐스트
    ActionCable.server.broadcast("vehicle_locations:trip:#{trip.id}", payload)

    # 기관 전체 스트림 브로드캐스트
    institution_id = trip.roster.institution_id
    ActionCable.server.broadcast("vehicle_locations:institution:#{institution_id}", payload)

    payload
  end

  private

  def build_payload(now)
    {
      type:       "location_update",
      trip_id:    trip.id,
      vehicle_id: trip.vehicle_id,
      plate_last4: trip.vehicle.plate_last4,
      lat:        lat,
      lng:        lng,
      heading:    heading,
      speed:      speed,
      status:     trip.status,
      updated_at: now.iso8601
    }
  end
end
