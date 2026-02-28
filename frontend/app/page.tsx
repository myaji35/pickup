'use client';

import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import ControlCanvas from '@/components/landing/ControlCanvas';
import {
  Bus,
  Users,
  Route,
  Shield,
  BarChart3,
  Zap,
  MapPin,
  Bell,
  ChevronRight,
  Check,
  ArrowRight,
} from 'lucide-react';

/* ────────────────────────────────────────────────
   Hook: Intersection Observer 기반 Scroll Fade-In
──────────────────────────────────────────────── */
function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.animationPlayState = 'running';
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );

    el.style.animationPlayState = 'paused';
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ────────────────────────────────────────────────
   Hook: Number Counter Animation
──────────────────────────────────────────────── */
function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const step = target / (duration / 16);
          let current = 0;

          const tick = () => {
            current += step;
            if (current < target) {
              setCount(Math.round(current * 10) / 10);
              requestAnimationFrame(tick);
            } else {
              setCount(target);
            }
          };

          requestAnimationFrame(tick);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, count };
}

/* ────────────────────────────────────────────────
   컴포넌트: 스크롤 Fade-In 래퍼
──────────────────────────────────────────────── */
function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`animate-fade-in-up ${className}`}
      style={{ animationDelay: `${delay}s`, animationPlayState: 'paused' }}
    >
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────
   컴포넌트: 카운터
──────────────────────────────────────────────── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const { ref, count } = useCounter(target);
  return (
    <span ref={ref}>
      {count % 1 === 0 ? count : count.toFixed(1)}
      {suffix}
    </span>
  );
}

/* ────────────────────────────────────────────────
   컴포넌트: Hero KPI 바 (countUp 애니메이션)
──────────────────────────────────────────────── */
interface HeroKpiItem {
  target: number;
  suffix: string;
  label: string;
  isFloat?: boolean;
  duration?: number;
}

function HeroKpiBar() {
  const kpis: HeroKpiItem[] = [
    { target: 230, suffix: '+', label: '운행 기관', duration: 1400 },
    { target: 12, suffix: '만+', label: '누적 탑승', duration: 1200 },
    { target: 99.2, suffix: '%', label: '정시율', isFloat: true, duration: 1600 },
  ];

  return (
    <div
      className="inline-flex gap-8 md:gap-12 px-6 py-3 rounded-xl backdrop-blur-md border"
      style={{
        background: 'rgba(15,23,42,0.75)',
        borderColor: 'rgba(34,211,238,0.15)',
      }}
    >
      {kpis.map(({ target, suffix, label, isFloat, duration }) => (
        <HeroKpiItem
          key={label}
          target={target}
          suffix={suffix}
          label={label}
          isFloat={isFloat}
          duration={duration}
        />
      ))}
    </div>
  );
}

function HeroKpiItem({
  target,
  suffix,
  label,
  isFloat = false,
  duration = 1500,
}: HeroKpiItem) {
  const { ref, count } = useCounter(target, duration);
  return (
    <div className="text-center">
      <p
        className="text-xl md:text-2xl font-bold"
        style={{ color: '#22d3ee' }}
      >
        <span ref={ref}>
          {isFloat ? count.toFixed(1) : Math.round(count)}
        </span>
        {suffix}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────
   컴포넌트: Chart (스크롤 진입 시 애니메이션)
──────────────────────────────────────────────── */
function AnimatedChart({ bars }: { bars: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex items-end gap-1 h-12">
      {bars.map((h, i) =>
        visible ? (
          <div
            key={i}
            className="flex-1 bg-blue-600/60 rounded-sm animate-chart-rise"
            style={{
              height: `${h}%`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ) : (
          <div key={i} className="flex-1 rounded-sm opacity-0" style={{ height: `${h}%` }} />
        )
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   메인 페이지
════════════════════════════════════════════════ */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    setScrolled(y > 40);
    setScrollY(y);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Sticky Navbar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Pickup MaaS</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">기능</a>
            <a href="#product" className="hover:text-white transition-colors">제품</a>
            <a href="#stats" className="hover:text-white transition-colors">도입 효과</a>
            <a href="#pricing" className="hover:text-white transition-colors">요금제</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/admin/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 text-sm">
                로그인
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 h-auto rounded-lg">
                무료 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section — 항공 관제실 ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">

        {/* 다크 배경 */}
        <div className="absolute inset-0 bg-slate-950" />

        {/* Canvas 관제 애니메이션 */}
        <ControlCanvas />

        {/* 좌측 하단 그라디언트 페이드 (텍스트 가독성) */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />

        {/* 컨텐츠 — 좌측 정렬 */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-xl">

            {/* 관제탑 배지 */}
            <div
              className="animate-fade-in-up inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs mb-6 backdrop-blur-sm"
              style={{
                animationDelay: '0.1s',
                borderColor: 'rgba(34,211,238,0.35)',
                background: 'rgba(34,211,238,0.06)',
                color: '#67e8f9',
              }}
            >
              {/* 레이더 pulse dot */}
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
              </span>
              실시간 관제 시스템 운영 중
            </div>

            {/* 헤드라인 */}
            <h1
              className="animate-fade-in-up text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-5"
              style={{ animationDelay: '0.2s' }}
            >
              <span className="text-white">기관의 이동을</span>
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #22d3ee, #818cf8)',
                }}
              >
                완벽하게 관리합니다
              </span>
            </h1>

            {/* 서브카피 */}
            <p
              className="animate-fade-in-up text-base md:text-lg text-slate-400 mb-8 leading-relaxed"
              style={{ animationDelay: '0.32s' }}
            >
              실시간 경로 최적화부터 탑승 확인까지,
              <br />
              <span className="text-slate-300">하나의 관제 화면으로.</span>
            </p>

            {/* CTA */}
            <div
              className="animate-fade-in-up flex flex-col sm:flex-row gap-3 mb-10"
              style={{ animationDelay: '0.42s' }}
            >
              <Link href="/register">
                <Button
                  className="px-7 py-3 h-auto text-sm rounded-xl font-semibold group"
                  style={{
                    background: 'linear-gradient(135deg, #0891b2, #6366f1)',
                    color: '#fff',
                    boxShadow: '0 0 20px rgba(34,211,238,0.25)',
                  }}
                >
                  무료로 시작하기
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button
                  variant="outline"
                  className="border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white px-7 py-3 h-auto text-sm rounded-xl backdrop-blur-sm"
                >
                  관제 화면 보기
                </Button>
              </Link>
            </div>

            {/* 신뢰 텍스트 */}
            <div
              className="animate-fade-in-up flex flex-wrap gap-4 text-xs text-slate-500"
              style={{ animationDelay: '0.52s' }}
            >
              {['신용카드 불필요', '5분 내 셋업', '24/7 고객지원'].map((text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-cyan-500" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* KPI 카운터 — 하단 바 (countUp 애니메이션) */}
        <div
          className="absolute bottom-10 left-0 right-0 z-10 animate-fade-in-up"
          style={{ animationDelay: '0.7s' }}
        >
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <HeroKpiBar />
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <div className="absolute bottom-8 right-8 flex flex-col items-center gap-1 text-slate-600 animate-bounce z-10">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-slate-600" />
        </div>
      </section>

      {/* ── Customer Logo Bar ── */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn>
            <p className="text-center text-sm text-slate-500 mb-6">
              전국 <span className="text-slate-300 font-semibold">200+</span> 기관이 신뢰합니다
            </p>
            <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap opacity-60">
              {['주간보호센터', '특수학교', '어린이집', '장애인복지관', '요양원'].map((name, i) => (
                <FadeIn key={name} delay={i * 0.08} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-slate-300 text-sm font-medium whitespace-nowrap">{name}</span>
                </FadeIn>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Bento Grid Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              운영의 모든 것을{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                하나로
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              복잡한 셔틀 운영에 필요한 모든 기능을 통합된 플랫폼에서 경험하세요.
            </p>
          </FadeIn>

          {/* ③ Bento grid — staggered scroll fade-in */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            <FadeIn delay={0} className="md:col-span-7">
              <div className="h-full bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-800/50 rounded-2xl p-8 group hover:border-blue-600/60 transition-all duration-300">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600/30 transition-colors">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">AI 경로 최적화</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  OR-Tools VRP 엔진으로 수십 개의 정류장을 자동 정렬합니다.
                  카카오 내비 실시간 교통 데이터를 반영해 매 운행마다 최적 순서를 계산합니다.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['카카오 내비 연동', '실시간 재계산', '탑승 순서 자동화'].map((tag) => (
                    <span key={tag} className="bg-blue-900/50 border border-blue-700/50 text-blue-300 text-xs px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.1} className="md:col-span-5">
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 group hover:border-slate-700 transition-all duration-300">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-600/30 transition-colors">
                  <MapPin className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">실시간 차량 추적</h3>
                <p className="text-slate-400 leading-relaxed">
                  GPS 기반 실시간 위치 확인과 도착 예상 시간(ETA)을 보호자에게 자동 전달합니다.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.15} className="md:col-span-4">
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 group hover:border-slate-700 transition-all duration-300">
                <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-violet-600/30 transition-colors">
                  <Users className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">승객 명단 관리</h3>
                <p className="text-slate-400 leading-relaxed">
                  엑셀 업로드 한 번으로 탑승 명단 완성. QR 체크인으로 탑승 확인까지.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2} className="md:col-span-8">
              <div className="h-full bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-800/50 rounded-2xl p-8 group hover:border-indigo-600/60 transition-all duration-300">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600/30 transition-colors">
                  <Bell className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">보호자 맞춤 알림</h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  운행 시작, 5분 전 도착, 탑승/하차 완료를 FCM 푸시로 즉시 전달합니다.
                  알림 유형별 ON/OFF와 문구 개인화 설정도 가능합니다.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '운행 시작', color: 'bg-blue-500/10 border-blue-700/30 text-blue-300' },
                    { label: '5분 전 알림', color: 'bg-amber-500/10 border-amber-700/30 text-amber-300' },
                    { label: '탑승 확인', color: 'bg-emerald-500/10 border-emerald-700/30 text-emerald-300' },
                  ].map(({ label, color }) => (
                    <div key={label} className={`border rounded-lg p-3 text-center text-xs font-medium ${color}`}>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.25} className="md:col-span-6">
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 group hover:border-slate-700 transition-all duration-300">
                <div className="w-12 h-12 bg-rose-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-rose-600/30 transition-colors">
                  <Shield className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">안전 점수 & 예측 정비</h3>
                <p className="text-slate-400 leading-relaxed">
                  OBD-II 연동으로 급가속·급제동을 감지하고 드라이버 코칭 메시지를 자동 발송합니다.
                  DTC 코드 기반 예측 정비 알림으로 차량 다운타임을 최소화합니다.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.3} className="md:col-span-6">
              <div className="h-full bg-slate-900 border border-slate-800 rounded-2xl p-8 group hover:border-slate-700 transition-all duration-300">
                <div className="w-12 h-12 bg-cyan-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-600/30 transition-colors">
                  <BarChart3 className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">BI 대시보드</h3>
                <p className="text-slate-400 leading-relaxed">
                  연료 효율, 정시율, 운행 비용을 한눈에. 보험사 제출용 리스크 리포트를 자동 생성합니다.
                </p>
              </div>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* ── Product Mockup Section ── */}
      <section id="product" className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeIn delay={0}>
              <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-700/50 rounded-full px-3 py-1 text-xs text-blue-300 mb-6">
                <Route className="w-3 h-3" />
                관리자 포털
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                운영 담당자를 위한{' '}
                <span className="text-blue-400">직관적인 대시보드</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8">
                기관별 차량·승객·운행 데이터를 한 화면에서 관리합니다.
                경로 최적화 버튼 하나로 오늘의 탑승 순서가 자동 결정됩니다.
              </p>
              <ul className="space-y-4">
                {[
                  '승객 명단 엑셀 업로드 및 QR 체크인',
                  'AI 기반 최적 경로 자동 계산',
                  '실시간 차량 위치 및 ETA 모니터링',
                  '보호자 앱 연동 및 알림 설정',
                ].map((item, i) => (
                  <FadeIn key={item} delay={0.1 + i * 0.08}>
                    <li className="flex items-start gap-3 text-slate-300">
                      <div className="w-5 h-5 bg-blue-600/30 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                        <Check className="w-3 h-3 text-blue-400" />
                      </div>
                      <span>{item}</span>
                    </li>
                  </FadeIn>
                ))}
              </ul>
              <div className="mt-10">
                <Link href="/admin/login">
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 h-auto rounded-xl group">
                    대시보드 체험하기
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </FadeIn>

            {/* ⑤ Dashboard Mockup with animated chart */}
            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-600/10 rounded-3xl blur-2xl" />
                <div className="relative bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Browser chrome */}
                  <div className="bg-slate-800 px-4 py-3 flex items-center gap-3 border-b border-slate-700">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                    </div>
                    <div className="flex-1 bg-slate-700 rounded-md h-5 text-xs text-slate-500 flex items-center px-3">
                      app.pickupmaas.kr/institutions/dashboard
                    </div>
                  </div>
                  {/* Dashboard content */}
                  <div className="p-4 space-y-3">
                    {/* KPI cards row */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: '오늘 운행', value: '12', color: 'text-blue-400' },
                        { label: '탑승 완료', value: '87%', color: 'text-emerald-400' },
                        { label: '평균 지연', value: '2분', color: 'text-amber-400' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-slate-800 rounded-lg p-3">
                          <p className="text-slate-500 text-xs mb-1">{label}</p>
                          <p className={`font-bold text-lg ${color}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                    {/* Vehicle list */}
                    <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                      <p className="text-slate-400 text-xs font-medium mb-2">실시간 차량 현황</p>
                      {[
                        { plate: '12가 3456', status: '운행중', passengers: '8/11', statusColor: 'text-emerald-400 bg-emerald-400/10' },
                        { plate: '98나 7890', status: '대기중', passengers: '0/11', statusColor: 'text-slate-400 bg-slate-700' },
                        { plate: '34다 5678', status: '운행중', passengers: '6/9', statusColor: 'text-emerald-400 bg-emerald-400/10' },
                      ].map(({ plate, status, passengers, statusColor }) => (
                        <div key={plate} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-mono">{plate}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">{passengers}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor}`}>{status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* ⑤ Animated chart */}
                    <div className="bg-slate-800 rounded-lg p-3">
                      <p className="text-slate-400 text-xs font-medium mb-2">이번 주 정시율</p>
                      <AnimatedChart bars={[60, 75, 85, 70, 90, 88, 95]} />
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section id="stats" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">숫자로 증명된 도입 효과</h2>
            <p className="text-slate-400">실제 도입 기관의 평균 데이터 기준</p>
          </FadeIn>

          {/* ④ Number Counter Animation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { target: 20, suffix: '%', label: '운행 비용 절감', desc: 'AI 최적 경로 적용 시', color: 'from-blue-950 border-blue-800/50' },
              { target: 50, suffix: '%', label: '관리 시간 단축', desc: '자동화 기능 도입 후', color: 'from-indigo-950 border-indigo-800/50' },
              { target: 98.5, suffix: '%', label: '고객 만족도', desc: '보호자 앱 사용자 기준', color: 'from-violet-950 border-violet-800/50' },
              { target: 5, suffix: '분↓', label: '셋업 완료', desc: '기관 등록 ~ 첫 운행까지', color: 'from-cyan-950 border-cyan-800/50' },
            ].map(({ target, suffix, label, desc, color }, i) => (
              <FadeIn key={label} delay={i * 0.1}>
                <div
                  className={`bg-gradient-to-b ${color} border rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-200`}
                >
                  <p className="text-4xl md:text-5xl font-bold text-white mb-2">
                    <Counter target={target} suffix={suffix} />
                  </p>
                  <p className="font-semibold text-slate-200 mb-1">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section id="pricing" className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">투명한 요금제</h2>
            <p className="text-slate-400">규모에 맞는 플랜을 선택하세요. 언제든 변경 가능합니다.</p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                name: 'Starter',
                price: '50,000',
                unit: '월',
                desc: '소규모 기관',
                features: ['차량 5대', '승객 50명', '기본 경로 관리', '이메일 지원'],
                highlight: false,
                delay: 0,
              },
              {
                name: 'Pro',
                price: '150,000',
                unit: '월',
                desc: '성장하는 기관',
                features: ['차량 20대', '승객 200명', 'AI 경로 최적화', 'FCM 알림', '우선 지원'],
                highlight: true,
                delay: 0.1,
              },
              {
                name: 'Enterprise',
                price: '500,000',
                unit: '월',
                desc: '대형 기관 / 다지점',
                features: ['무제한 차량', '무제한 승객', 'OBD-II 연동', 'BI 대시보드', '전담 매니저'],
                highlight: false,
                delay: 0.2,
              },
            ].map(({ name, price, unit, desc, features, highlight, delay }) => (
              <FadeIn key={name} delay={delay}>
                {/* ② Pro 카드 Pulse Glow */}
                <div
                  className={`relative h-full rounded-2xl p-6 border ${
                    highlight
                      ? 'bg-blue-950/60 border-blue-600/60 shadow-xl shadow-blue-900/30 animate-pulse-glow'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        가장 인기
                      </span>
                    </div>
                  )}
                  <p className="text-slate-400 text-sm mb-1">{name}</p>
                  <p className="text-sm text-slate-500 mb-4">{desc}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold">₩{price}</span>
                    <span className="text-slate-500 text-sm">/ {unit}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className="block">
                    <Button
                      className={`w-full py-2.5 h-auto rounded-xl text-sm font-semibold ${
                        highlight
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      시작하기
                    </Button>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="relative bg-gradient-to-br from-blue-950 to-indigo-950 border border-blue-800/50 rounded-3xl p-12 text-center overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                  지금 바로 시작하세요
                </h2>
                <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                  14일 무료 체험. 신용카드 없이 시작합니다.
                  셋업은 5분이면 충분합니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/register">
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 h-auto text-base rounded-xl font-semibold group">
                      무료로 시작하기
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/admin/login">
                    <Button
                      variant="outline"
                      className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-3 h-auto text-base rounded-xl"
                    >
                      로그인
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Bus className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">Pickup MaaS</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                AI 기반 B2B 셔틀 운영 플랫폼. 복잡한 이동을 단순하게.
              </p>
            </div>

            {[
              { title: '서비스', links: ['기능 소개', '도입 효과', '고객 사례', '요금제'] },
              { title: '회사', links: ['회사 소개', '채용', '파트너십', '문의하기'] },
              { title: '정책', links: ['개인정보처리방침', '서비스 이용약관', '쿠키 정책'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white font-semibold mb-4 text-sm">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <span>© 2026 Pickup MaaS. All rights reserved.</span>
            <div className="flex items-center gap-1">
              <span>Built with</span>
              <span className="text-rose-500">♥</span>
              <span>in Korea</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
