import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bus, Users, Route } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("data:image/svg+xml,%3Csvg width=\'1200\' height=\'400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'1200\' height=\'400\' fill=\'%23334155\'/%3E%3C/svg%3E")'
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            스마트한 이동의 시작, Pickup MaaS
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-200">
            혁신과 차량 운영, 새로 변화하여 제공하세요.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 h-auto text-base">
                무료 회원가입
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button variant="outline" className="bg-white text-slate-900 hover:bg-gray-100 px-6 py-3 h-auto text-base">
                로그인
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Pickup MaaS가 제공하는 스마트한 솔루션
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Pickup MaaS는 실시간 차량 추적, 간편한 승객관리 및 경로 관리, AI 기반 경로 최적화 솔루션을 제공합니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bus className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>차량 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  실시간으로 차량의 위치와 상태를 확인하고 효율적으로 운행을 관리합니다.
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>승객 명단 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  간편한 엑세스로 승객 정보를 업로드하고 탑승상황을 확인할 수 있습니다.
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Route className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>AI 경로 최적화</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  AI 알고리즘을 통한 이동 경로를 분석하여 최적의 경로를 제공합니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            숫자로 증명된 도입 효과
          </h2>
          <p className="text-center text-gray-600 mb-12">
            평균적인 데이터를 통해 Pickup MaaS를 가치를 직접 확인하세요.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="text-center p-8">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-2">운행 비용 절감</p>
                <p className="text-5xl font-bold text-slate-900">최대 20%</p>
              </CardContent>
            </Card>

            <Card className="text-center p-8">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-2">관리 시간 단축</p>
                <p className="text-5xl font-bold text-slate-900">50%</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            신뢰할 수 있는 파트너
          </h2>

          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold">Pickup MaaS</span>
            </div>
            <div className="w-24 h-12 bg-gray-300 rounded"></div>
            <div className="w-24 h-12 bg-gray-400 rounded"></div>
            <div className="w-24 h-12 bg-gray-500 rounded"></div>
            <div className="w-24 h-12 bg-gray-300 rounded"></div>
            <div className="w-24 h-12 bg-gray-400 rounded"></div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <Button variant="outline" className="text-sm">서비스소개</Button>
            <Button variant="outline" className="text-sm">기능</Button>
            <Button variant="outline" className="text-sm">도입 효과</Button>
            <Link href="/register">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white text-sm">
                회원가입
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button variant="outline" className="text-sm">로그인</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            지금 바로 전문가와 상담하고 비즈니스의 효율을 높여 보세요.
          </h2>
          <p className="text-gray-300 mb-8">
            간단한 정보 입력만으로 Pickup MaaS가 제공하는 맞춤형 솔루션과 제안을 받아보실 수 있습니다.
          </p>
          <Link href="/register">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 h-auto text-base">
              지금 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Logo & Description */}
            <div className="md:col-span-1">
              <h3 className="text-white font-bold mb-2">Pickup MaaS</h3>
              <p className="text-sm">
                스마트한 차량 관리로<br />
                비즈니스의 미래를 만들다
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-semibold mb-3">서비스</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">기능</a></li>
                <li><a href="#" className="hover:text-white">도입효과</a></li>
                <li><a href="#" className="hover:text-white">고객 사례</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-3">회사</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">회사 소개</a></li>
                <li><a href="#" className="hover:text-white">채용</a></li>
                <li><a href="#" className="hover:text-white">문의하기</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold mb-3">자료</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">블로그</a></li>
                <li><a href="#" className="hover:text-white">자주 묻는 질문</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-3">정책</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">개인정보처리방침</a></li>
                <li><a href="#" className="hover:text-white">서비스 이용약관</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-sm text-center">
            © 2025 Pickup MaaS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
