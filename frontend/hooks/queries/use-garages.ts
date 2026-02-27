/**
 * Garages Hooks — Epic 13 파트너십 정비소 네트워크
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';

export interface PartnerGarage {
  id: number;
  name: string;
  brand: string | null;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  rating: number;
  specialties: string[];
  distance_km?: number;
}

export interface GarageReservation {
  id: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  garage_name: string;
  garage_phone: string | null;
  vehicle_plate: string;
  reserved_date: string;
  reserved_time: string | null;
  note: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface CreateReservationInput {
  garage_id: number;
  vehicle_id: number | string;
  reserved_date: string;
  reserved_time?: string;
  note?: string;
  dtc_report_id?: number;
}

// ─── 근처 정비소 조회 ────────────────────────────────────────────────────────
export function useNearbyGarages(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['garages', 'nearby', lat, lng],
    queryFn: () =>
      railsClient.get<PartnerGarage[]>('/institutions/garages/nearby', {
        lat: String(lat),
        lng: String(lng),
        radius_km: '3',
      }),
    enabled: !!lat && !!lng,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── 예약 목록 ───────────────────────────────────────────────────────────────
export function useGarageReservations() {
  return useQuery({
    queryKey: ['garages', 'reservations'],
    queryFn: () => railsClient.get<GarageReservation[]>('/institutions/garages/reservations'),
  });
}

// ─── 예약 생성 ───────────────────────────────────────────────────────────────
export function useCreateGarageReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReservationInput) =>
      railsClient.post<GarageReservation>(
        `/institutions/garages/${input.garage_id}/reservations`,
        {
          vehicle_id:    input.vehicle_id,
          reserved_date: input.reserved_date,
          reserved_time: input.reserved_time,
          note:          input.note,
          dtc_report_id: input.dtc_report_id,
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['garages', 'reservations'] });
    },
  });
}
