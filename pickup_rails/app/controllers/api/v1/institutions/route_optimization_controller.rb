##
# RouteOptimizationController — AI 경로 최적화 API
#
# 엔드포인트:
#   POST /api/v1/institutions/rosters/:id/optimize
#     → VRP 솔버 호출 → 최적 픽업 순서 반환 (DB 미저장)
#
#   GET  /api/v1/institutions/rosters/:id/route_preview
#     → 현재 boarding_order 기준 경로 미리보기 + 절감 효과 비교
#
#   POST /api/v1/institutions/rosters/:id/apply_optimization
#     → 최적화 결과 확정 → roster_passengers.boarding_order 업데이트
#
#   POST /api/v1/institutions/eta
#     → 단건 ETA 계산 (현재 차량 위치 → 목적지)
##
module Api
  module V1
    module Institutions
      class RouteOptimizationController < ApplicationController
        before_action :authenticate_user!
        before_action :set_roster, only: %i[optimize route_preview apply_optimization]

        # POST /api/v1/institutions/rosters/:id/optimize
        def optimize
          svc = VrpClientService.new

          unless svc.healthy?
            return render_error("VRP 서비스가 현재 사용 불가합니다.", :service_unavailable)
          end

          result = svc.optimize(@roster)
          render_success(format_optimization_result(result))
        rescue VrpClientService::VrpError => e
          render_error("경로 최적화 실패: #{e.message}", :unprocessable_entity)
        rescue => e
          Rails.logger.error "[RouteOptimization#optimize] #{e.message}"
          render_error("경로 최적화 중 오류가 발생했습니다.", :internal_server_error)
        end

        # GET /api/v1/institutions/rosters/:id/route_preview
        def route_preview
          roster_passengers = @roster.roster_passengers
            .includes(:passenger)
            .order(Arel.sql("COALESCE(boarding_order, 9999), id"))

          passengers_data = roster_passengers.map do |rp|
            p = rp.passenger
            {
              id:                     rp.id,
              passenger_id:           p.id,
              name:                   p.name,
              boarding_order:         rp.boarding_order,
              pickup_address:         p.pickup_address,
              lat:                    p.pickup_lat,
              lng:                    p.pickup_lng,
              estimated_arrival_sec:  rp.estimated_arrival_sec,
              cumulative_distance_m:  rp.cumulative_distance_m,
            }
          end

          savings = if @roster.optimized_distance_m && @roster.original_distance_m
            saved_m = @roster.original_distance_m - @roster.optimized_distance_m
            {
              saved_distance_m:   saved_m,
              saved_distance_km:  (saved_m / 1000.0).round(2),
              saved_fuel_cost_krw: estimate_fuel_cost(saved_m),
              optimization_rate:   ((saved_m.to_f / @roster.original_distance_m) * 100).round(1),
            }
          end

          render_success({
            roster_id:             @roster.id,
            last_optimized_at:     @roster.last_optimized_at,
            total_distance_m:      @roster.optimized_distance_m,
            total_duration_sec:    @roster.optimized_duration_sec,
            total_distance_km:     @roster.optimized_distance_m ? (@roster.optimized_distance_m / 1000.0).round(2) : nil,
            total_duration_min:    @roster.optimized_duration_sec ? (@roster.optimized_duration_sec / 60.0).round(1) : nil,
            distance_source:       @roster.distance_source,
            passengers:            passengers_data,
            savings:               savings,
          })
        end

        # POST /api/v1/institutions/rosters/:id/apply_optimization
        # body: { optimized_passengers: [{ id: rp_id, boarding_order: 1, ... }, ...] }
        def apply_optimization
          optimized = params[:optimized_passengers]
          return render_error("최적화 결과가 없습니다.", :bad_request) if optimized.blank?

          # 현재 순서로 original_distance 저장 (첫 번째 적용 시)
          original_dist = calculate_current_distance(@roster)

          ActiveRecord::Base.transaction do
            optimized.each do |item|
              rp = @roster.roster_passengers.find(item[:id])
              rp.update!(
                boarding_order:         item[:boarding_order].to_i,
                estimated_arrival_sec:  item[:estimated_arrival_sec].to_i,
                cumulative_distance_m:  item[:cumulative_distance_m].to_i,
              )
            end

            @roster.update!(
              last_optimized_at:      Time.current,
              optimized_distance_m:   params[:total_distance_m].to_i,
              optimized_duration_sec: params[:total_duration_sec].to_i,
              original_distance_m:    @roster.original_distance_m || original_dist,
              distance_source:        params[:distance_source] || "haversine",
            )
          end

          savings_m = (@roster.original_distance_m || 0) - @roster.optimized_distance_m.to_i

          render_success({
            message:              "경로 최적화가 적용되었습니다.",
            roster_id:            @roster.id,
            optimized_distance_m: @roster.optimized_distance_m,
            saved_distance_m:     savings_m,
            saved_fuel_cost_krw:  estimate_fuel_cost(savings_m),
          })
        end

        # POST /api/v1/institutions/eta
        # body: { origin: { lat:, lng: }, destination: { lat:, lng: } }
        def eta
          origin      = { lat: params.dig(:origin, :lat).to_f, lng: params.dig(:origin, :lng).to_f }
          destination = { lat: params.dig(:destination, :lat).to_f, lng: params.dig(:destination, :lng).to_f }

          svc    = VrpClientService.new
          result = svc.eta(origin: origin, destination: destination)

          render_success(result)
        rescue => e
          render_error("ETA 계산 실패: #{e.message}", :unprocessable_entity)
        end

        private

        def set_roster
          @roster = current_user.institution.rosters.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error("로스터를 찾을 수 없습니다.", :not_found)
        end

        def format_optimization_result(result)
          {
            roster_id:              result[:roster_id],
            optimized_passengers:   result[:optimized_passengers],
            total_distance_m:       result[:total_distance_m],
            total_duration_sec:     result[:total_duration_sec],
            total_distance_km:      result[:total_distance_km],
            total_duration_min:     result[:total_duration_min],
            solver_status:          result[:solver_status],
            distance_source:        result[:distance_source],
          }
        end

        # 현재 boarding_order 순서 기반 총 거리 계산 (Haversine)
        def calculate_current_distance(roster)
          passengers = roster.roster_passengers
            .includes(:passenger)
            .order(Arel.sql("COALESCE(boarding_order, 9999), id"))
            .map(&:passenger)
            .select { |p| p.pickup_lat.present? && p.pickup_lng.present? }

          return 0 if passengers.size < 2

          total = 0
          passengers.each_cons(2) do |a, b|
            total += haversine_m(a.pickup_lat, a.pickup_lng, b.pickup_lat, b.pickup_lng)
          end
          total
        end

        def haversine_m(lat1, lng1, lat2, lng2)
          r    = 6_371_000.0
          d_lat = (lat2.to_f - lat1.to_f) * Math::PI / 180
          d_lng = (lng2.to_f - lng1.to_f) * Math::PI / 180
          a = Math.sin(d_lat / 2)**2 +
              Math.cos(lat1.to_f * Math::PI / 180) * Math.cos(lat2.to_f * Math::PI / 180) *
              Math.sin(d_lng / 2)**2
          (r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).to_i
        end

        # 연료비 절감 추정 (연비 12km/L, 유가 1,650원/L)
        def estimate_fuel_cost(saved_distance_m)
          return 0 if saved_distance_m <= 0
          fuel_efficiency_km_per_l = 12.0
          fuel_price_per_l = 1_650
          saved_km = saved_distance_m / 1000.0
          ((saved_km / fuel_efficiency_km_per_l) * fuel_price_per_l).to_i
        end
      end
    end
  end
end
