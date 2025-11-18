'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createVehicleSchema, VehicleFormData } from '@/lib/schemas/vehicle.schema';

interface VehicleFormProps {
  institutionId: string;
  onSubmit: (data: VehicleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * VehicleForm Component
 * 차량 등록/수정 폼
 */
export function VehicleForm({ institutionId, onSubmit, onCancel, isLoading }: VehicleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      institutionId,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="lastFourDigits" className="block text-sm font-medium text-gray-700">
          차량번호 뒤 4자리
        </label>
        <input
          id="lastFourDigits"
          type="text"
          maxLength={4}
          placeholder="1234"
          {...register('lastFourDigits')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
        />
        {errors.lastFourDigits && (
          <p className="mt-1 text-sm text-red-600">{errors.lastFourDigits.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="passengerCapacity" className="block text-sm font-medium text-gray-700">
          승객 정원
        </label>
        <input
          id="passengerCapacity"
          type="number"
          min={5}
          max={15}
          placeholder="10"
          {...register('passengerCapacity', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
        />
        {errors.passengerCapacity && (
          <p className="mt-1 text-sm text-red-600">{errors.passengerCapacity.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">5명 이상 15명 이하여야 합니다</p>
      </div>

      <input type="hidden" {...register('institutionId')} />

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? '처리 중...' : '등록'}
        </button>
      </div>
    </form>
  );
}
