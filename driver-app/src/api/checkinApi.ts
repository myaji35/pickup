import apiClient from './client';
import { ApiResponse, CheckInResult } from '../types';

// POST /driver/check_ins/:id/board
export const boardPassenger = async (checkInId: number): Promise<ApiResponse<CheckInResult>> => {
  const res = await apiClient.post<ApiResponse<CheckInResult>>(
    `/driver/check_ins/${checkInId}/board`
  );
  return res.data;
};

// POST /driver/check_ins/:id/alight
export const alightPassenger = async (checkInId: number): Promise<ApiResponse<CheckInResult>> => {
  const res = await apiClient.post<ApiResponse<CheckInResult>>(
    `/driver/check_ins/${checkInId}/alight`
  );
  return res.data;
};
