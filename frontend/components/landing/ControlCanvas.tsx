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
   씬 타입 정의
──────────────────────────────────────────────── */
type ScenePhase = 'scene1' | 'transition_1to2' | 'scene2' | 'transition_2to3' | 'scene3' | 'transition_3to1';
type PowerPhase = 'grid' | 'vehicles' | 'routes' | 'complete';

/* Scene 타이밍 (초) */
const SCENE1_DURATION = 4.0;   // 전체 관제뷰 (줌아웃)
const SCENE2_DURATION = 5.0;   // 실시간 이동 (줌인 추적)
const SCENE3_DURATION = 3.0;   // 탑승완료 (ping + 카운트)
const TRANSITION_DURATION = 0.6; // 씬 전환

/* Power-on 단계 타이밍 */
const GRID_PHASE_END = 0.8;      // 0~0.8초: 그리드 확산
const VEHICLES_PHASE_END = 1.5;  // 0.8~1.5초: 차량 하나씩 등장
const ROUTES_PHASE_END = 2.2;    // 1.5~2.2초: 경로선 그려짐
// 2.2초~: 헤드라인 페이드인 (complete)

/* ────────────────────────────────────────────────
   유틸: 두 점 사이 선형 보간
──────────────────────────────────────────────── */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/* easeInOut 보간 */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/* ────────────────────────────────────────────────
   유틸: 격자 도시 지도 그리기 (중앙에서 확산 지원)
──────────────────────────────────────────────── */
function drawCityGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number,
  expandProgress: number = 1.0  // 0~1: 중앙에서 바깥으로 확산
) {
  ctx.save();

  const gridSize = 48;
  const cx = w / 2;
  const cy = h / 2;
  const maxDist = Math.max(w, h);

  // 수평선
  ctx.globalAlpha = alpha * 0.18;
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 0.5;

  for (let y = 0; y < h; y += gridSize) {
    const distFromCenter = Math.abs(y - cy);
    const revealThreshold = expandProgress * maxDist * 0.7;
    if (distFromCenter > revealThreshold) continue;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // 수직선
  for (let x = 0; x < w; x += gridSize) {
    const distFromCenter = Math.abs(x - cx);
    const revealThreshold = expandProgress * maxDist * 0.7;
    if (distFromCenter > revealThreshold) continue;

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
      const distFromCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const revealThreshold = expandProgress * maxDist * 0.7;
      if (distFromCenter > revealThreshold) continue;

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
   유틸: 경로선 그리기 (progressDraw: 0~1 부분 그리기)
──────────────────────────────────────────────── */
function drawRoute(
  ctx: CanvasRenderingContext2D,
  stops: Stop[],
  alpha: number,
  color: string,
  progressDraw: number = 1.0
) {
  if (stops.length < 2) return;

  // 전체 경로 총 길이 계산
  const segments: { from: Stop; to: Stop; len: number }[] = [];
  let totalLen = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const dx = stops[i + 1].x - stops[i].x;
    const dy = stops[i + 1].y - stops[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segments.push({ from: stops[i], to: stops[i + 1], len });
    totalLen += len;
  }

  const drawLen = totalLen * progressDraw;

  ctx.save();
  ctx.globalAlpha = alpha * 0.25;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();

  let accumulated = 0;
  let started = false;
  for (const seg of segments) {
    if (accumulated >= drawLen) break;
    const segDraw = Math.min(seg.len, drawLen - accumulated);
    const t = segDraw / seg.len;

    if (!started) {
      ctx.moveTo(seg.from.x, seg.from.y);
      started = true;
    }
    ctx.lineTo(
      lerp(seg.from.x, seg.to.x, t),
      lerp(seg.from.y, seg.to.y, t)
    );
    accumulated += segDraw;
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
  mouseY: number,
  highlight: boolean = false
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

  // 마우스 근접 또는 씬2 하이라이트
  const dx = v.x - mouseX;
  const dy = v.y - mouseY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const isNear = dist < 80 || highlight;

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

/* ────────────────────────────────────────────────
   Scene3 전용: 탑승완료 오버레이 (ping + 카운트)
──────────────────────────────────────────────── */
function drawScene3Overlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  alpha: number,
  time: number,
  boardedCount: number
) {
  // 중앙 HQ 대형 ping 링
  const pingScale = (time % 2.0) / 2.0;
  const pingAlpha = (1 - pingScale) * 0.6;
  ctx.save();
  ctx.globalAlpha = alpha * pingAlpha;
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.5, 20 + pingScale * 80, 0, Math.PI * 2);
  ctx.stroke();

  // 2nd ring (delayed)
  const pingScale2 = ((time + 0.8) % 2.0) / 2.0;
  const pingAlpha2 = (1 - pingScale2) * 0.35;
  ctx.globalAlpha = alpha * pingAlpha2;
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.5, 20 + pingScale2 * 80, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 탑승 카운터 텍스트
  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`탑승 완료 +${boardedCount}`, w * 0.5, h * 0.5 - 28);
  ctx.font = '9px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('BOARDING COMPLETE', w * 0.5, h * 0.5 + 38);
  ctx.textAlign = 'left';
  ctx.restore();
}

/* ════════════════════════════════════════════════
   메인 컴포넌트
════════════════════════════════════════════════ */
export default function ControlCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vehiclesRef = useRef<Vehicle[]>([]);
  const mouseRef = useRef({ x: -999, y: -999 });

  // 파워온 상태머신
  const powerPhaseRef = useRef<PowerPhase>('grid');
  const powerTimeRef = useRef(0); // 파워온 경과 시간(초)
  const powerAlphaRef = useRef(0); // 전체 알파 (0→1)
  const vehicleRevealRef = useRef<boolean[]>([]); // 차량 하나씩 등장 여부
  const routeRevealRef = useRef<number[]>([]); // 경로별 progressDraw

  // 씬 상태머신
  const sceneRef = useRef<ScenePhase>('scene1');
  const sceneTimeRef = useRef(0); // 현재 씬 경과 시간(초)
  const cameraRef = useRef({ scale: 1, tx: 0, ty: 0 }); // 카메라 transform
  const targetCameraRef = useRef({ scale: 1, tx: 0, ty: 0 });
  const trackedVehicleIdxRef = useRef(0); // 씬2에서 추적할 차량 인덱스
  const boardedCountRef = useRef(1); // 씬3 탑승 카운터

  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
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

    // 초기 reveal 상태
    vehicleRevealRef.current = vehiclesRef.current.map(() => false);
    routeRevealRef.current = vehiclesRef.current.map(() => 0);

    /* 마우스 추적 */
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    canvas.addEventListener('mousemove', onMouseMove);

    /* 씬 전환 함수 */
    const transitionTo = (next: ScenePhase) => {
      sceneRef.current = next;
      sceneTimeRef.current = 0;
    };

    /* ────────────────────────────────────────────
       씬 카메라 목표값 업데이트
    ──────────────────────────────────────────── */
    const updateCameraTarget = (scene: ScenePhase, w: number, h: number) => {
      if (scene === 'scene1' || scene === 'transition_3to1') {
        // 줌아웃: 전체 뷰
        targetCameraRef.current = { scale: 1.0, tx: 0, ty: 0 };
      } else if (scene === 'scene2' || scene === 'transition_1to2') {
        // 줌인: 추적 차량 위치로
        const v = vehiclesRef.current[trackedVehicleIdxRef.current];
        if (v) {
          const scale = 1.6;
          const tx = w / 2 - v.x * scale;
          const ty = h / 2 - v.y * scale;
          targetCameraRef.current = { scale, tx, ty };
        }
      } else if (scene === 'scene3' || scene === 'transition_2to3') {
        // 씬3: HQ 중앙 줌인
        const scale = 1.4;
        const tx = w / 2 - w * 0.5 * scale;
        const ty = h / 2 - h * 0.5 * scale;
        targetCameraRef.current = { scale, tx, ty };
      }
    };

    /* 애니메이션 루프 */
    const draw = (timestamp: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05); // 실제 delta(초), 최대 50ms
      lastTimeRef.current = timestamp;

      const w = W();
      const h = H();
      timeRef.current += dt;
      const t = timeRef.current;

      /* ── 파워온 단계 처리 ── */
      const isPowerComplete = powerPhaseRef.current === 'complete';

      if (!isPowerComplete) {
        powerTimeRef.current += dt;
        const pt = powerTimeRef.current;

        if (pt < GRID_PHASE_END) {
          powerPhaseRef.current = 'grid';
          powerAlphaRef.current = pt / GRID_PHASE_END;
        } else if (pt < VEHICLES_PHASE_END) {
          powerPhaseRef.current = 'vehicles';
          powerAlphaRef.current = 1;
          // 차량 하나씩 순차 등장
          const vehicleElapsed = pt - GRID_PHASE_END;
          const vehicleInterval = (VEHICLES_PHASE_END - GRID_PHASE_END) / vehiclesRef.current.length;
          vehiclesRef.current.forEach((_, i) => {
            vehicleRevealRef.current[i] = vehicleElapsed >= vehicleInterval * i;
          });
        } else if (pt < ROUTES_PHASE_END) {
          powerPhaseRef.current = 'routes';
          powerAlphaRef.current = 1;
          vehicleRevealRef.current = vehiclesRef.current.map(() => true);
          // 경로선 순차 그리기
          const routeElapsed = pt - VEHICLES_PHASE_END;
          const routeTotal = ROUTES_PHASE_END - VEHICLES_PHASE_END;
          const routeInterval = routeTotal / vehiclesRef.current.length;
          vehiclesRef.current.forEach((_, i) => {
            const rElapsed = routeElapsed - routeInterval * i;
            routeRevealRef.current[i] = Math.max(0, Math.min(1, rElapsed / routeInterval));
          });
        } else {
          powerPhaseRef.current = 'complete';
          powerAlphaRef.current = 1;
          vehicleRevealRef.current = vehiclesRef.current.map(() => true);
          routeRevealRef.current = vehiclesRef.current.map(() => 1);
          setReady(true);
        }
      }

      const alpha = powerAlphaRef.current;

      /* ── 씬 상태머신 업데이트 ── */
      if (isPowerComplete) {
        sceneTimeRef.current += dt;
        const st = sceneTimeRef.current;

        switch (sceneRef.current) {
          case 'scene1':
            if (st >= SCENE1_DURATION) {
              // 씬2로 전환 — 추적 차량 선택
              trackedVehicleIdxRef.current = Math.floor(Math.random() * vehiclesRef.current.length);
              transitionTo('transition_1to2');
            }
            break;
          case 'transition_1to2':
            if (st >= TRANSITION_DURATION) transitionTo('scene2');
            break;
          case 'scene2':
            if (st >= SCENE2_DURATION) transitionTo('transition_2to3');
            break;
          case 'transition_2to3':
            if (st >= TRANSITION_DURATION) {
              boardedCountRef.current = Math.floor(Math.random() * 5) + 1;
              transitionTo('scene3');
            }
            break;
          case 'scene3':
            if (st >= SCENE3_DURATION) transitionTo('transition_3to1');
            break;
          case 'transition_3to1':
            if (st >= TRANSITION_DURATION) transitionTo('scene1');
            break;
        }

        // 카메라 목표 업데이트
        updateCameraTarget(sceneRef.current, w, h);

        // 카메라 부드럽게 추적 (씬2에서는 차량 위치 실시간 반영)
        if (sceneRef.current === 'scene2') {
          const v = vehiclesRef.current[trackedVehicleIdxRef.current];
          if (v) {
            const scale = 1.6;
            targetCameraRef.current = {
              scale,
              tx: w / 2 - v.x * scale,
              ty: h / 2 - v.y * scale,
            };
          }
        }

        const lerpSpeed = 0.04;
        cameraRef.current.scale = lerp(cameraRef.current.scale, targetCameraRef.current.scale, lerpSpeed);
        cameraRef.current.tx = lerp(cameraRef.current.tx, targetCameraRef.current.tx, lerpSpeed);
        cameraRef.current.ty = lerp(cameraRef.current.ty, targetCameraRef.current.ty, lerpSpeed);
      }

      /* ── 그리드 확산 진행도 계산 ── */
      const gridExpandProgress = powerPhaseRef.current === 'grid'
        ? easeInOut(powerAlphaRef.current)
        : 1.0;

      // 배경 클리어
      ctx.clearRect(0, 0, w, h);

      /* ── 카메라 transform 적용 ── */
      ctx.save();
      ctx.translate(cameraRef.current.tx, cameraRef.current.ty);
      ctx.scale(cameraRef.current.scale, cameraRef.current.scale);

      // 격자 지도
      drawCityGrid(ctx, w, h, alpha, gridExpandProgress);

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

      // 경로선 (파워온 단계별 progressDraw 적용)
      const routeGroups = [
        [freshStops[0], freshStops[1], freshStops[2], freshStops[10]],
        [freshStops[3], freshStops[4], freshStops[5], freshStops[10]],
        [freshStops[6], freshStops[7], freshStops[8], freshStops[9], freshStops[10]],
        [freshStops[1], freshStops[2], freshStops[5], freshStops[10]],
        [freshStops[9], freshStops[8], freshStops[7], freshStops[10]],
      ];
      const routeColors = ['#22d3ee', '#818cf8', '#34d399', '#f472b6', '#fb923c'];
      routeGroups.forEach((route, i) => {
        drawRoute(ctx, route, alpha, routeColors[i], routeRevealRef.current[i] ?? 1);
      });

      // 정류장 노드
      freshStops.forEach((stop) => drawStop(ctx, stop, alpha, t));

      // 차량 업데이트 & 드로우
      vehiclesRef.current.forEach((v, vi) => {
        // 파워온 시 순차 등장 처리
        if (!vehicleRevealRef.current[vi]) return;

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

        // 씬2에서 추적 차량 하이라이트
        const isTracked = isPowerComplete
          && (sceneRef.current === 'scene2' || sceneRef.current === 'transition_1to2' || sceneRef.current === 'transition_2to3')
          && vi === trackedVehicleIdxRef.current;

        drawVehicle(ctx, v, alpha, mouseRef.current.x, mouseRef.current.y, isTracked);
      });

      // 스캔 라인 (레이더 스윕 효과)
      const sweepAngle = (t * 0.4) % (Math.PI * 2);
      ctx.save();
      ctx.globalAlpha = alpha * 0.06;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.5);
      ctx.arc(w * 0.5, h * 0.5, Math.min(w, h) * 0.48, sweepAngle, sweepAngle + 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 씬3 오버레이 (카메라 transform 내)
      if (isPowerComplete && (sceneRef.current === 'scene3' || sceneRef.current === 'transition_2to3')) {
        const sceneAlpha = sceneRef.current === 'transition_2to3'
          ? Math.min(1, sceneTimeRef.current / TRANSITION_DURATION)
          : 1.0;
        drawScene3Overlay(ctx, w, h, alpha * sceneAlpha, sceneTimeRef.current, boardedCountRef.current);
      }

      ctx.restore(); // 카메라 transform 해제

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
