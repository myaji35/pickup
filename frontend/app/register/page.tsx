'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/backend/api/v1';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessRegistrationNumber: '',
    institutionName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    adminName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.adminPassword.length < 8) {
      alert('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register-institution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessRegistrationNumber: formData.businessRegistrationNumber,
          institutionName: formData.institutionName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          adminName: formData.adminName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '회원가입에 실패했습니다.');
      }

      alert(
        '회원가입이 완료되었습니다!\n관리자 승인 후 로그인하실 수 있습니다.\n승인 결과는 이메일로 안내드립니다.'
      );
      router.push('/');
    } catch (error: any) {
      alert(error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          홈으로 돌아가기
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">기관 회원가입</CardTitle>
            <CardDescription>Pickup MaaS와 함께 스마트한 이동 서비스를 시작하세요</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Institution Info */}
              <div className="space-y-2">
                <label htmlFor="businessRegistrationNumber" className="block text-sm font-medium text-gray-700">
                  사업자 등록번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="businessRegistrationNumber"
                  name="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={handleChange}
                  placeholder="하이픈 없이 10자리 입력"
                  maxLength={10}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500">예: 1234567890</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="institutionName" className="block text-sm font-medium text-gray-700">
                  기관명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="institutionName"
                  name="institutionName"
                  value={formData.institutionName}
                  onChange={handleChange}
                  placeholder="서울 어린이집"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <hr className="my-6" />

              {/* Admin User Info */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700">관리자 계정 정보</h3>
                <p className="text-xs text-gray-500 mt-1">기관을 관리할 관리자 계정을 생성합니다.</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
                  관리자 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="adminName"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  placeholder="홍길동"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                  관리자 이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="adminPassword"
                  name="adminPassword"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  placeholder="최소 8자 이상"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="adminPasswordConfirm" className="block text-sm font-medium text-gray-700">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="adminPasswordConfirm"
                  name="adminPasswordConfirm"
                  value={formData.adminPasswordConfirm}
                  onChange={handleChange}
                  placeholder="비밀번호 재입력"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm">
                <p className="text-blue-800 font-medium mb-1">회원가입 안내</p>
                <ul className="text-blue-700 text-xs space-y-1 list-disc list-inside">
                  <li>회원가입 후 관리자 승인이 필요합니다.</li>
                  <li>승인 완료 시 이메일로 안내드립니다.</li>
                  <li>승인 후 로그인하여 서비스를 이용하실 수 있습니다.</li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 h-auto"
              >
                {loading ? '처리 중...' : '회원가입'}
              </Button>

              {/* Login Link */}
              <div className="text-center text-sm text-gray-600 mt-4">
                이미 계정이 있으신가요?{' '}
                <Link href="/admin/login" className="text-blue-600 hover:underline font-medium">
                  로그인
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
