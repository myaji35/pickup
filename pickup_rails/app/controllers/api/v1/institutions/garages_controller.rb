##
# Institutions::GaragesController — 제휴 정비소 추천 + 예약
#
# GET  /api/v1/institutions/garages/nearby
#   Params: lat, lng, radius_km (기본 3)
#   → 반경 내 활성 정비소 목록 (거리순)
#
# POST /api/v1/institutions/garages/:id/reservations
#   body: { vehicle_id, reserved_date, reserved_time, note, dtc_report_id? }
#   → 예약 생성
#
# GET  /api/v1/institutions/garages/reservations
#   → 내 기관 예약 목록
##
module Api
  module V1
    module Institutions
      class GaragesController < ApplicationController
        before_action :require_institution_admin!

        # GET /api/v1/institutions/garages/nearby
        def nearby
          lat = params[:lat].to_f
          lng = params[:lng].to_f
          return render_error("lat, lng 파라미터가 필요합니다.", :bad_request) if lat.zero? && lng.zero?

          radius = [params[:radius_km].to_f, 3.0].then { |r| r.positive? ? r : 3.0 }
          garages = PartnerGarage.near(lat, lng, radius_km: radius)

          render_success(garages.map { |g| garage_json(g, lat, lng) })
        end

        # POST /api/v1/institutions/garages/:id/reservations
        def create_reservation
          garage = PartnerGarage.active.find_by(id: params[:id])
          return render_error("정비소를 찾을 수 없습니다.", :not_found) if garage.nil?

          vehicle = current_institution.vehicles.find_by(id: params[:vehicle_id])
          return render_error("차량을 찾을 수 없습니다.", :not_found) if vehicle.nil?

          dtc = DtcReport.find_by(id: params[:dtc_report_id]) if params[:dtc_report_id].present?

          reservation = GarageReservation.new(
            partner_garage: garage,
            institution:    current_institution,
            vehicle:        vehicle,
            dtc_report:     dtc,
            reserved_date:  params[:reserved_date],
            reserved_time:  params[:reserved_time],
            note:           params[:note],
            referral_fee_krw: 5000,
          )

          if reservation.save
            render_success(reservation_json(reservation), status: :created)
          else
            render_error("예약 실패", errors: reservation.errors.full_messages)
          end
        end

        # GET /api/v1/institutions/garages/reservations
        def reservations
          records = GarageReservation
            .where(institution: current_institution)
            .includes(:partner_garage, :vehicle)
            .recent
            .limit(50)

          render_success(records.map { |r| reservation_json(r) })
        end

        private

        def current_institution
          current_user.institution
        end

        def garage_json(garage, ref_lat = nil, ref_lng = nil)
          data = {
            id:          garage.id,
            name:        garage.name,
            brand:       garage.brand,
            address:     garage.address,
            lat:         garage.lat,
            lng:         garage.lng,
            phone:       garage.phone,
            rating:      garage.rating,
            specialties: garage.specialties_array,
          }
          if ref_lat && ref_lng
            data[:distance_km] = PartnerGarage.send(:haversine,
              ref_lat, ref_lng, garage.lat.to_f, garage.lng.to_f).round(2)
          end
          data
        end

        def reservation_json(r)
          {
            id:            r.id,
            status:        r.status,
            garage_name:   r.partner_garage.name,
            garage_phone:  r.partner_garage.phone,
            vehicle_plate: r.vehicle.plate_last4,
            reserved_date: r.reserved_date,
            reserved_time: r.reserved_time,
            note:          r.note,
            confirmed_at:  r.confirmed_at,
            created_at:    r.created_at,
          }
        end
      end
    end
  end
end
