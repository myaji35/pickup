'use client';

import { useEffect, useRef, useState } from 'react';

/* ────────────────────────────────────────────────
   타입 정의
──────────────────────────────────────────────── */
interface Stop {
  x: number;
  y: number;
  label: string;
}

interface Vehicle {
  id: number;
  stops: Stop[];
  stopIndex: number;
  progress: number; // 0~1 현재 구간 진행도
  speed: number;
  color: string;
  pulseRadius: number;
  pulseAlpha: number;
  isPulsing: boolean;
  trailPoints: { x: number; y: number; alpha: number }[];
  x: number;
  y: number;
}

/* ────────────────────────────────────────────────
   유틸: 두 점 사이 선형 보간
──────────────────────────────────────────────── */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/* ────────────────────────────────────────────────
   유틸: 격자 도시 지도 그리기
──────────────────────────────────────────────── */
function drawCityGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.18;

  const gridSize = 48;

  // 수평선
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 0.5;
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // 수직선
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // 교차점 도트
  ctx.globalAlpha = alpha * 0.25;
  ctx.fillStyle = '#22d3ee';
  for (let y = 0; y <= h; y += gridSize) {
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/* ────────────────────────────────────────────────
   유틸: 레이더 스윕 링 그리기
──────────────────────────────────────────────── */
function drawRadarRings(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  maxR: number,
  alpha: number
) {
  ctx.save();
  const rings = [0.25, 0.5, 0.75, 1.0];
  rings.forEach((r) => {
    const radius = maxR * r;
    const grad = ctx.createRadialGradient(cx, cy, radius - 1, cx, cy, radius);
    grad.addColorStop(0, `rgba(34,211,238,${0.06 * alpha})`);
    grad.addColorStop(1, `rgba(34,211,238,0)`);
    ctx.strokeStyle = `rgba(34,211,238,${0.12 * alpha})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

/* ────────────────────────────────────────────────
   유틸: 정류장 노드 그리기
──────────────────────────────────────────────── */
function drawStop(
  ctx: CanvasRenderingContext2D,
  stop: Stop,
  alpha: number,
  time: number
) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 2 + stop.x);
  ctx.save();
  ctx.globalAlpha = alpha * (0.5 + 0.3 * pulse);

  // 외부 링
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(stop.x, stop.y, 6 + pulse * 2, 0, Math.PI * 2);
  ctx.stroke();

  // 내부 점
  ctx.fillStyle = '#22d3ee';
  ctx.globalAlpha = alpha * 0.9;
  ctx.beginPath();
  ctx.arc(stop.x, stop.y, 3, 0, Math.PI * 2);
  ctx.fill();

  // 라벨
  ctx.globalAlpha = alpha * 0.6;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px monospace';
  ctx.fillText(stop.label, stop.x + 10, stop.y + 4);

  ctx.restore();
}

/* ────────────────────────────────────────────────
   유틸: 경로선 그리기
──────────────────────────────────────────────── */
function drawRoute(
  ctx: CanvasRenderingContext2D,
  stops: Stop[],
  alpha: number,
  color: string
) {
  if (stops.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha * 0.25;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(stops[0].x, stops[0].y);
  for (let i = 1; i < stops.length; i++) {
    ctx.lineTo(stops[i].x, stops[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/* ────────────────────────────────────────────────
   유틸: 차량 블립 그리기
──────────────────────────────────────────────── */
function drawVehicle(
  ctx: CanvasRenderingContext2D,
  v: Vehicle,
  alpha: number,
  mouseX: number,
  mouseY: number
) {
  ctx.save();

  // 트레일
  v.trailPoints.forEach((p) => {
    ctx.globalAlpha = alpha * p.alpha * 0.4;
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // 탑승 완료 펄스
  if (v.isPulsing && v.pulseAlpha > 0) {
    ctx.globalAlpha = alpha * v.pulseAlpha * 0.5;
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(v.x, v.y, v.pulseRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 마우스 근접 반응 — 글로우 강화
  const dx = v.x - mouseX;
  const dy = v.y - mouseY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const isNear = dist < 80;

  // 외부 글로우
  ctx.globalAlpha = alpha * (isNear ? 0.6 : 0.3);
  ctx.strokeStyle = isNear ? '#4ade80' : v.color;
  ctx.lineWidth = isNear ? 2 : 1;
  ctx.beginPath();
  ctx.arc(v.x, v.y, isNear ? 9 : 7, 0, Math.PI * 2);
  ctx.stroke();

  // 내부 블립
  ctx.globalAlpha = alpha * (isNear ? 1 : 0.9);
  ctx.fillStyle = isNear ? '#4ade80' : v.color;
  ctx.beginPath();
  ctx.arc(v.x, v.y, isNear ? 4 : 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 근접 시 차량 ID 태그
  if (isNear) {
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 0.8;
    const tagW = 62;
    const tagH = 18;
    const tx = v.x + 12;
    const ty = v.y - 12;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tagW, tagH, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '9px monospace';
    ctx.fillText(`차량 ${v.id.toString().padStart(2, '0')} ▶`, tx + 6, ty + 12);
  }

  ctx.restore();
}

/* ════════════════════════════════════════════════
   메인 컴포넌트
════════════════════════════════════════════════ */
export default function ControlCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const mouseRef = useRef({ x: -999, y: -999 });
  const phaseRef = useRef<'poweron' | 'running'>('poweron');
  const powerAlphaRef = useRef(0); // 0 → 1 파워온 페이드
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* 캔버스 크기 */
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    /* 정류장 정의 (비율 기반) */
    const makeStops = (): Stop[] => [
      { x: W() * 0.15, y: H() * 0.25, label: 'A-01' },
      { x: W() * 0.32, y: H() * 0.18, label: 'A-02' },
      { x: W() * 0.52, y: H() * 0.22, label: 'B-01' },
      { x: W() * 0.68, y: H() * 0.15, label: 'B-02' },
      { x: W() * 0.80, y: H() * 0.30, label: 'C-01' },
      { x: W() * 0.75, y: H() * 0.55, label: 'C-02' },
      { x: W() * 0.60, y: H() * 0.70, label: 'D-01' },
      { x: W() * 0.40, y: H() * 0.75, label: 'D-02' },
      { x: W() * 0.22, y: H() * 0.65, label: 'E-01' },
      { x: W() * 0.12, y: H() * 0.50, label: 'E-02' },
      { x: W() * 0.50, y: H() * 0.50, label: 'HQ' },   // 중앙 (기관)
    ];

    /* 차량 경로 구성 */
    const makeVehicles = (stops: Stop[]): Vehicle[] => {
      const routes = [
        [0, 1, 2, 10],      // A → HQ
        [3, 4, 5, 10],      // B → HQ
        [6, 7, 8, 9, 10],   // D-E → HQ
        [1, 2, 5, 10],      // A-B-C → HQ
        [9, 8, 7, 10],      // E-D → HQ
      ];
      const colors = ['#22d3ee', '#818cf8', '#34d399', '#f472b6', '#fb923c'];

      return routes.map((route, i) => {
        const vehicleStops = route.map((idx) => stops[idx]);
        return {
          id: i + 1,
          stops: vehicleStops,
          stopIndex: 0,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.002,
          color: colors[i],
          pulseRadius: 0,
          pulseAlpha: 0,
          isPulsing: false,
          trailPoints: [],
          x: vehicleStops[0].x,
          y: vehicleStops[0].y,
        };
      });
    };

    const allStops = makeStops();
    vehiclesRef.current = makeVehicles(allStops);

    /* 마우스 추적 */
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    canvas.addEventListener('mousemove', onMouseMove);

    /* 애니메이션 루프 */
    const draw = () => {
      const w = W();
      const h = H();
      timeRef.current += 0.016;
      const t = timeRef.current;

      // 파워온 페이드
      if (phaseRef.current === 'poweron') {
        powerAlphaRef.current = Math.min(1, powerAlphaRef.current + 0.008);
        if (powerAlphaRef.current >= 1) {
          phaseRef.current = 'running';
          setReady(true);
        }
      }

      const alpha = powerAlphaRef.current;

      // 배경 클리어
      ctx.clearRect(0, 0, w, h);

      // 격자 지도
      drawCityGrid(ctx, w, h, alpha);

      // 레이더 링
      drawRadarRings(ctx, w * 0.5, h * 0.5, Math.min(w, h) * 0.48, alpha);

      // 중앙 HQ 글로우
      const hqPulse = 0.5 + 0.5 * Math.sin(t * 1.5);
      ctx.save();
      ctx.globalAlpha = alpha * 0.15 * hqPulse;
      const hqGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, 60);
      hqGrad.addColorStop(0, '#22d3ee');
      hqGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = hqGrad;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.5, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 정류장 업데이트 (비율 기반 재계산)
      const freshStops = makeStops();

      // 경로선
      const routeGroups = [
        [freshStops[0], freshStops[1], freshStops[2], freshStops[10]],
        [freshStops[3], freshStops[4], freshStops[5], freshStops[10]],
        [freshStops[6], freshStops[7], freshStops[8], freshStops[9], freshStops[10]],
        [freshStops[1], freshStops[2], freshStops[5], freshStops[10]],
        [freshStops[9], freshStops[8], freshStops[7], freshStops[10]],
      ];
      const routeColors = ['#22d3ee', '#818cf8', '#34d399', '#f472b6', '#fb923c'];
      routeGroups.forEach((route, i) => {
        drawRoute(ctx, route, alpha, routeColors[i]);
      });

      // 정류장 노드
      freshStops.forEach((stop) => drawStop(ctx, stop, alpha, t));

      // 차량 업데이트 & 드로우
      vehiclesRef.current.forEach((v, vi) => {
        // 정류장 위치 최신화
        v.stops = routeGroups[vi] ?? v.stops;

        const from = v.stops[v.stopIndex];
        const to = v.stops[(v.stopIndex + 1) % v.stops.length];
        if (!from || !to) return;

        // 마우스 근접 시 속도 살짝 증가
        const dx = v.x - mouseRef.current.x;
        const dy = v.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speedMult = dist < 80 ? 1.6 : 1;

        v.progress += v.speed * speedMult;

        if (v.progress >= 1) {
          v.progress = 0;
          v.stopIndex = (v.stopIndex + 1) % v.stops.length;

          // 탑승 완료 펄스 (HQ 도착 시)
          const nextStop = v.stops[v.stopIndex];
          if (nextStop?.label === 'HQ') {
            v.isPulsing = true;
            v.pulseRadius = 0;
            v.pulseAlpha = 1;
          }
        }

        // 위치 보간
        v.x = lerp(from.x, to.x, v.progress);
        v.y = lerp(from.y, to.y, v.progress);

        // 트레일 업데이트
        v.trailPoints.push({ x: v.x, y: v.y, alpha: 0.8 });
        if (v.trailPoints.length > 18) v.trailPoints.shift();
        v.trailPoints.forEach((p, i) => {
          p.alpha = (i / v.trailPoints.length) * 0.8;
        });

        // 펄스 업데이트
        if (v.isPulsing) {
          v.pulseRadius += 1.2;
          v.pulseAlpha -= 0.025;
          if (v.pulseAlpha <= 0) {
            v.isPulsing = false;
            v.pulseRadius = 0;
            v.pulseAlpha = 0;
          }
        }

        drawVehicle(ctx, v, alpha, mouseRef.current.x, mouseRef.current.y);
      });

      // 스캔 라인 (레이더 스윕 효과)
      const sweepAngle = (t * 0.4) % (Math.PI * 2);
      ctx.save();
      ctx.globalAlpha = alpha * 0.06;
      // 코닉 그라디언트는 대체 방식(섹터 fill)으로 처리
      // 단순 섹터로 대체
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.5);
      ctx.arc(w * 0.5, h * 0.5, Math.min(w, h) * 0.48, sweepAngle, sweepAngle + 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}
    />
  );
}
