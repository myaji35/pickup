'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Eye } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * T566-T575: Institution List Management
 *
 * All institutions with filtering, search, and actions
 */

interface Institution {
  id: string;
  name: string;
  businessRegistrationNo: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
  approvedAt?: string;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusLabels = {
  PENDING: '승인대기',
  ACTIVE: '활성',
  SUSPENDED: '정지',
  INACTIVE: '비활성',
};

export default function InstitutionsPage() {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/backend/api/v1'}/admin/institutions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load institutions');
      }

      const data = await response.json();
      setInstitutions(data.data || []);
    } catch (error) {
      console.error('Failed to load institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter institutions
  const filteredInstitutions = institutions.filter((inst) => {
    // Status filter
    if (statusFilter !== 'ALL' && inst.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        inst.name.toLowerCase().includes(query) ||
        inst.businessRegistrationNo.includes(query)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">회원사 관리</h1>
        <p className="text-gray-600 mt-2">
          전체 회원사 목록 조회 및 관리
        </p>
      </div>

      {/* Filters - T567-T568 */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="회원사명 또는 사업자등록번호 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              <SelectItem value="PENDING">승인대기</SelectItem>
              <SelectItem value="ACTIVE">활성</SelectItem>
              <SelectItem value="SUSPENDED">정지</SelectItem>
              <SelectItem value="INACTIVE">비활성</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          총 {filteredInstitutions.length}개 회원사
        </div>
      </Card>

      {/* Table - T569 */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>회원사명</TableHead>
              <TableHead>사업자등록번호</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead>승인일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstitutions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  회원사가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredInstitutions.map((institution) => (
                <TableRow key={institution.id}>
                  <TableCell className="font-medium">{institution.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {institution.businessRegistrationNo}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[institution.status]}
                    >
                      {statusLabels[institution.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(institution.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>
                    {institution.approvedAt
                      ? new Date(institution.approvedAt).toLocaleDateString('ko-KR')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/admin/institutions/${institution.id}`)
                      }
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      상세
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
