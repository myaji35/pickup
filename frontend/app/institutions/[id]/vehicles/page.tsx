'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useVehicles } from '@/hooks/queries/use-vehicles';
import { useCreateVehicle } from '@/hooks/mutations/use-create-vehicle';
import { useDeleteVehicle } from '@/hooks/mutations/use-delete-vehicle';
import { VehicleTable } from '@/components/tables/vehicle-table';
import { VehicleForm } from '@/components/forms/vehicle-form';
import { VehicleDialog, DeleteConfirmDialog } from '@/components/dialogs/vehicle-dialog';
import { Vehicle } from '@/types/vehicle';
import { VehicleFormData } from '@/lib/schemas/vehicle.schema';

/**
 * VehiclesPage Component
 * 차량 관리 페이지
 * T111-T117: 차량 등록, 목록, 수정, 삭제 통합
 */
export default function VehiclesPage() {
  const params = useParams();
  const institutionId = params.id as string;

  // State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // Queries & Mutations
  const { data: vehicles = [], isLoading } = useVehicles(institutionId);
  const createVehicle = useCreateVehicle();
  const deleteVehicle = useDeleteVehicle();

  // Handlers
  const handleCreate = async (data: VehicleFormData) => {
    await createVehicle.mutateAsync(data);
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (vehicle: Vehicle) => {
    // TODO: T114 - Implement edit dialog
    console.log('Edit vehicle:', vehicle);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;

    await deleteVehicle.mutateAsync({
      id: vehicleToDelete.id,
      institutionId: vehicleToDelete.institutionId,
    });
    setVehicleToDelete(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">차량 관리</h1>
            <p className="mt-2 text-sm text-gray-600">
              기관의 차량을 등록하고 관리합니다
            </p>
          </div>
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            차량 등록
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-500">차량 목록을 불러오는 중...</p>
        </div>
      )}

      {/* Vehicle Table */}
      {!isLoading && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <VehicleTable vehicles={vehicles} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      )}

      {/* Create Dialog */}
      <VehicleDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        title="새 차량 등록"
      >
        <VehicleForm
          institutionId={institutionId}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateDialogOpen(false)}
          isLoading={createVehicle.isPending}
        />
      </VehicleDialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!vehicleToDelete}
        onClose={() => setVehicleToDelete(null)}
        onConfirm={confirmDelete}
        vehicleNumber={vehicleToDelete?.lastFourDigits || ''}
        isLoading={deleteVehicle.isPending}
      />
    </div>
  );
}
