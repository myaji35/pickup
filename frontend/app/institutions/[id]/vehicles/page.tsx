'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useVehicles } from '@/hooks/queries/use-vehicles';
import { useCreateVehicle } from '@/hooks/mutations/use-create-vehicle';
import { useDeleteVehicle } from '@/hooks/mutations/use-delete-vehicle';
import { useConnectVehicleToGroup } from '@/hooks/mutations/use-connect-vehicle-to-group';
import { useDisconnectVehicleFromGroup } from '@/hooks/mutations/use-disconnect-vehicle-from-group';
import { usePassengerGroups } from '@/hooks/queries/use-passenger-groups';
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
  const [vehicleToConnect, setVehicleToConnect] = useState<Vehicle | null>(null);

  // Queries & Mutations
  const { data: vehicles = [], isLoading } = useVehicles(institutionId);
  const { data: passengerGroups = [] } = usePassengerGroups(institutionId);
  const createVehicle = useCreateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const connectVehicle = useConnectVehicleToGroup();
  const disconnectVehicle = useDisconnectVehicleFromGroup();

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

  const handleConnectGroup = (vehicle: Vehicle) => {
    setVehicleToConnect(vehicle);
  };

  const handleDisconnectGroup = async (vehicle: Vehicle) => {
    if (confirm('이 차량의 그룹 연결을 해제하시겠습니까?')) {
      await disconnectVehicle.mutateAsync({ vehicleId: vehicle.id });
    }
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
          <VehicleTable
            vehicles={vehicles}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onConnectGroup={handleConnectGroup}
            onDisconnectGroup={handleDisconnectGroup}
            institutionId={institutionId}
          />
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

      {/* Connect Group Dialog - T264-T268: Simple version */}
      {vehicleToConnect && (
        <VehicleDialog
          isOpen={!!vehicleToConnect}
          onClose={() => setVehicleToConnect(null)}
          title="차량을 그룹에 연결"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                차량 <span className="font-semibold">{vehicleToConnect.lastFourDigits}</span> (
                {vehicleToConnect.passengerCapacity}인승)을 연결할 그룹을 선택하세요:
              </p>
            </div>

            {passengerGroups.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">등록된 승객 그룹이 없습니다</p>
                <p className="text-gray-400 text-sm mt-2">
                  먼저 승객 그룹을 생성해주세요
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {passengerGroups.map((group) => {
                  const canConnect = group.totalPassengerCount <= vehicleToConnect.passengerCapacity;
                  return (
                    <button
                      key={group.id}
                      onClick={async () => {
                        if (canConnect) {
                          await connectVehicle.mutateAsync({
                            vehicleId: vehicleToConnect.id,
                            groupId: group.id,
                          });
                          setVehicleToConnect(null);
                        }
                      }}
                      disabled={!canConnect || connectVehicle.isPending}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                        canConnect
                          ? 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
                          : 'border-red-300 bg-red-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{group.name}</p>
                          <p className="text-sm text-gray-600">
                            그룹 코드: {group.groupCode} • 승객 {group.totalPassengerCount}명
                          </p>
                        </div>
                        {!canConnect && (
                          <span className="text-xs text-red-600 font-medium">
                            정원 초과 (차량: {vehicleToConnect.passengerCapacity}명)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setVehicleToConnect(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </VehicleDialog>
      )}
    </div>
  );
}
