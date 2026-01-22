'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient, User, Institution, Vehicle, Route, OptimizeRouteRequest } from '@/lib/api';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MapPin, Clock, Truck, CheckCircle } from 'lucide-react';

export default function RoutesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  // Form state
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [routeDate, setRouteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [shuttleType, setShuttleType] = useState<'MORNING' | 'EVENING' | 'TEMPORARY'>('MORNING');
  const [optimizedRoute, setOptimizedRoute] = useState<Route | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      } catch (error) {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const institutionData = await apiClient.getInstitutions();
        setInstitutions(institutionData);
      } catch (error) {
        console.error('Failed to load institutions:', error);
      }
    };

    if (user) {
      loadInstitutions();
    }
  }, [user]);

  useEffect(() => {
    const loadVehicles = async () => {
      if (!selectedInstitution) {
        setVehicles([]);
        return;
      }

      try {
        const vehicleData = await apiClient.getVehiclesByInstitution(selectedInstitution);
        setVehicles(vehicleData);
      } catch (error) {
        console.error('Failed to load vehicles:', error);
        setVehicles([]);
      }
    };

    loadVehicles();
  }, [selectedInstitution]);

  useEffect(() => {
    const loadRoutes = async () => {
      if (!selectedInstitution) {
        setRoutes([]);
        return;
      }

      try {
        const routeData = await apiClient.getRoutesByInstitution(selectedInstitution);
        setRoutes(routeData);
      } catch (error) {
        console.error('Failed to load routes:', error);
        setRoutes([]);
      }
    };

    loadRoutes();
  }, [selectedInstitution]);

  const handleOptimize = async () => {
    if (!selectedInstitution || !selectedVehicle || !routeDate || !shuttleType) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setOptimizing(true);
    try {
      const request: OptimizeRouteRequest = {
        institutionId: selectedInstitution,
        vehicleId: selectedVehicle,
        routeDate,
        shuttleType,
      };

      const response = await apiClient.optimizeRoute(request);
      setOptimizedRoute(response.data);
      alert(response.message);

      // Refresh routes list
      const routeData = await apiClient.getRoutesByInstitution(selectedInstitution);
      setRoutes(routeData);
    } catch (error: any) {
      alert(`경로 최적화 실패: ${error.message}`);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner size="lg" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AdminHeader
        title="경로 최적화"
        subtitle="AI 기반 VRP 경로 최적화"
        user={user}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* 경로 최적화 폼 */}
          <Card>
            <CardHeader>
              <CardTitle>경로 최적화 실행</CardTitle>
              <CardDescription>
                기관, 차량, 날짜를 선택하고 최적 경로를 생성합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="institution">기관</Label>
                  <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                    <SelectTrigger id="institution">
                      <SelectValue placeholder="기관을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name} ({inst.businessRegistrationNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="vehicle">차량</Label>
                  <Select
                    value={selectedVehicle}
                    onValueChange={setSelectedVehicle}
                    disabled={!selectedInstitution}
                  >
                    <SelectTrigger id="vehicle">
                      <SelectValue placeholder="차량을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.licensePlate} - {vehicle.model} ({vehicle.capacity}인승)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="routeDate">운행 날짜</Label>
                  <Input
                    id="routeDate"
                    type="date"
                    value={routeDate}
                    onChange={(e) => setRouteDate(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="shuttleType">셔틀 타입</Label>
                  <Select value={shuttleType} onValueChange={(value: any) => setShuttleType(value)}>
                    <SelectTrigger id="shuttleType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORNING">등원 (MORNING)</SelectItem>
                      <SelectItem value="EVENING">하원 (EVENING)</SelectItem>
                      <SelectItem value="TEMPORARY">임시 (TEMPORARY)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleOptimize} disabled={optimizing}>
                  {optimizing ? '최적화 중...' : '경로 최적화 실행'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 최적화 결과 */}
          {optimizedRoute && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  최적화 완료
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">승객 수</p>
                      <p className="text-2xl font-bold">{optimizedRoute.passengerCount}명</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">총 거리</p>
                      <p className="text-2xl font-bold">{optimizedRoute.totalDistance.toFixed(2)}km</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">예상 소요 시간</p>
                      <p className="text-2xl font-bold">{optimizedRoute.estimatedDuration}분</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">최적화 시간</p>
                      <p className="text-2xl font-bold">{optimizedRoute.optimizationTime}ms</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">탑승 순서</h4>
                    <div className="space-y-2">
                      {optimizedRoute.optimizedSequence.map((waypoint, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                            {waypoint.sequence}
                          </div>
                          <div className="flex-grow">
                            <p className="font-medium">승객 ID: {waypoint.passengerId}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {waypoint.address}
                            </p>
                            <p className="text-xs text-gray-500">
                              좌표: {waypoint.coordinates.lat.toFixed(6)}, {waypoint.coordinates.lng.toFixed(6)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 text-sm text-gray-500">
                    <p>알고리즘: {optimizedRoute.solverVersion}</p>
                    <p>평균 속도: {optimizedRoute.averageSpeed?.toFixed(2) || 30}km/h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 경로 목록 */}
          {routes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>최근 경로 목록</CardTitle>
                <CardDescription>
                  선택한 기관의 경로 목록입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {routes.map((route) => (
                    <div key={route.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">
                              {new Date(route.routeDate).toLocaleDateString('ko-KR')}
                            </span>
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {route.shuttleType}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              route.status === 'OPTIMIZED' ? 'bg-green-100 text-green-800' :
                              route.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                              route.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {route.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{route.passengerCount}명</span>
                            <span>{route.totalDistance.toFixed(2)}km</span>
                            <span>{route.estimatedDuration}분</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOptimizedRoute(route)}
                        >
                          상세 보기
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </PageContainer>
  );
}
