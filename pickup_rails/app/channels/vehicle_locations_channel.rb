# 실시간 차량 위치 채널
# 구독: { channel: "VehicleLocationsChannel", institution_id: 1 }  → 기관 전체 차량
# 구독: { channel: "VehicleLocationsChannel", trip_id: 5 }          → 단일 운행 추적
class VehicleLocationsChannel < ApplicationCable::Channel
  def subscribed
    if params[:trip_id]
      trip = authorize_trip!(params[:trip_id])
      stream_from "vehicle_locations:trip:#{trip.id}"
    elsif params[:institution_id]
      authorize_institution!(params[:institution_id])
      stream_from "vehicle_locations:institution:#{params[:institution_id]}"
    else
      reject
    end
  end

  def unsubscribed
    stop_all_streams
  end

  private

  def authorize_trip!(trip_id)
    trip = Trip.find(trip_id)
    # 드라이버 본인, 기관 관리자, 슈퍼 어드민만 접근 가능
    unless current_user.super_admin? ||
           (current_user.institution_admin? && trip.roster.institution_id == current_user.institution_id) ||
           (current_user.driver? && trip.driver_id == current_user.id)
      reject
    end
    trip
  rescue ActiveRecord::RecordNotFound
    reject
  end

  def authorize_institution!(institution_id)
    unless current_user.super_admin? ||
           (current_user.institution_admin? && current_user.institution_id == institution_id.to_i) ||
           (current_user.driver? && current_user.institution_id == institution_id.to_i)
      reject
    end
  end
end
