'use client';

import Link from 'next/link';
import { Vehicle } from '@/types/vehicle';

interface VehicleTableProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
  onConnectGroup?: (vehicle: Vehicle) => void;
  onDisconnectGroup?: (vehicle: Vehicle) => void;
  institutionId?: string;
}

/**
 * VehicleTable Component
 * 차량 목록 테이블
 * T261-T263: 그룹 연결/해제 기능 추가
 */
export function VehicleTable({ vehicles, onEdit, onDelete, onConnectGroup, onDisconnectGroup, institutionId }: VehicleTableProps) {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-lg">등록된 차량이 없습니다</p>
        <p className="text-gray-400 text-sm mt-2">
          차량 등록 버튼을 클릭하여 첫 차량을 등록하세요
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              차량번호 뒤 4자리
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              승객 정원
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              그룹 배정 상태
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              등록일시
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              작업
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {vehicle.lastFourDigits}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {vehicle.passengerCapacity}명
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {vehicle.currentGroupId ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    배정됨
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    미배정
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(vehicle.createdAt).toLocaleDateString('ko-KR')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                {vehicle.currentGroupId ? (
                  <>
                    {onDisconnectGroup && (
                      <button
                        onClick={() => onDisconnectGroup(vehicle)}
                        className="text-orange-600 hover:text-orange-900"
                        title="그룹 연결 해제"
                      >
                        연결 해제
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {onConnectGroup && (
                      <button
                        onClick={() => onConnectGroup(vehicle)}
                        className="text-green-600 hover:text-green-900"
                        title="그룹에 연결"
                      >
                        그룹 연결
                      </button>
                    )}
                  </>
                )}
                {institutionId && (
                  <Link
                    href={`/institutions/${institutionId}/vehicles/${vehicle.id}/maintenance`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    정비
                  </Link>
                )}
                <button
                  onClick={() => onEdit(vehicle)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  수정
                </button>
                <button
                  onClick={() => onDelete(vehicle)}
                  className="text-red-600 hover:text-red-900"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
