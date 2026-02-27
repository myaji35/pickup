class PartnerGarage < ApplicationRecord
  has_many :garage_reservations, dependent: :nullify

  validates :name,    presence: true
  validates :address, presence: true

  scope :active, -> { where(active: true) }

  # 반경 내 정비소 (Haversine, km 단위)
  def self.near(lat, lng, radius_km: 3)
    lat_f = lat.to_f
    lng_f = lng.to_f
    # SQLite 용 근사 필터 (위도 1도 ≈ 111km)
    lat_delta = radius_km / 111.0
    lng_delta = radius_km / (111.0 * Math.cos(lat_f * Math::PI / 180))

    active
      .where(lat: (lat_f - lat_delta)..(lat_f + lat_delta),
             lng: (lng_f - lng_delta)..(lng_f + lng_delta))
      .sort_by { |g| haversine(lat_f, lng_f, g.lat.to_f, g.lng.to_f) }
      .first(5)
  end

  def rating
    rating_x10.to_f / 10.0
  end

  def specialties_array
    JSON.parse(specialties || "[]")
  rescue
    []
  end

  def self.haversine(lat1, lng1, lat2, lng2)
    r = 6371.0
    dlat = (lat2 - lat1) * Math::PI / 180
    dlng = (lng2 - lng1) * Math::PI / 180
    a = Math.sin(dlat/2)**2 + Math.cos(lat1*Math::PI/180) * Math.cos(lat2*Math::PI/180) * Math.sin(dlng/2)**2
    2 * r * Math.asin(Math.sqrt(a))
  end
end
