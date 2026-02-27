/**
 * ELM327 AT 명령어 파서
 * OBD-II PID 응답을 숫자값으로 변환
 */

// ELM327 BLE GATT UUID (표준)
export const ELM327_SERVICE_UUID    = '0000fff0-0000-1000-8000-00805f9b34fb';
export const ELM327_WRITE_CHAR_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';
export const ELM327_NOTIFY_CHAR_UUID= '0000fff1-0000-1000-8000-00805f9b34fb';

// 요청할 PID 목록
export const PIDS = {
  SPEED:        '010D',   // 차속 (km/h)
  RPM:          '010C',   // 엔진 RPM
  COOLANT_TEMP: '0105',   // 냉각수 온도 (°C)
  FUEL_LEVEL:   '012F',   // 연료량 (%)
  THROTTLE:     '0111',   // 스로틀 개도 (%)
  DTC:          '03',     // 엔진 오류 코드 조회
} as const;

export interface ObdData {
  speed:        number | null;   // km/h
  rpm:          number | null;   // rev/min
  coolantTemp:  number | null;   // °C
  fuelLevel:    number | null;   // %
  throttle:     number | null;   // %
}

export interface DrivingEvent {
  type: 'harsh_accel' | 'harsh_brake' | 'speeding' | 'idling';
  speed: number;
  rpm:   number;
}

/**
 * ELM327 응답 문자열 파싱
 * 예: "41 0D 3C" → 차속 60 km/h
 */
export function parseResponse(pid: string, response: string): number | null {
  // 공백·CR·LF·prompt(>) 제거, 대문자 변환
  const clean = response.replace(/[\s>]/g, '').toUpperCase();

  // NO DATA / ERROR 등 오류 응답
  if (clean.includes('NODATA') || clean.includes('ERROR') || clean.includes('?')) {
    return null;
  }

  // 응답 헤더(41 XX) 이후 데이터 바이트 추출
  const header = '41' + pid.slice(2); // "41 0D" → "410D"
  const idx = clean.indexOf(header);
  if (idx === -1) return null;

  const dataHex = clean.slice(idx + header.length);
  const bytes = dataHex.match(/.{1,2}/g)?.map((h) => parseInt(h, 16)) ?? [];
  if (bytes.length === 0 || bytes.some(isNaN)) return null;

  const [A, B] = bytes;

  switch (pid) {
    case PIDS.SPEED:        return A;                           // km/h
    case PIDS.RPM:          return ((A * 256) + B) / 4;        // rpm
    case PIDS.COOLANT_TEMP: return A - 40;                     // °C
    case PIDS.FUEL_LEVEL:   return (A * 100) / 255;            // %
    case PIDS.THROTTLE:     return (A * 100) / 255;            // %
    default:                return null;
  }
}

/**
 * DTC 응답 파싱
 * 예: "43 01 33 02 3A 00 00" → ["P0133", "P023A"]
 */
export function parseDtc(response: string): string[] {
  const clean = response.replace(/[\s>]/g, '').toUpperCase();
  if (clean.includes('NODATA') || clean.includes('43000000000000')) return [];

  const idx = clean.indexOf('43');
  if (idx === -1) return [];

  const dataHex = clean.slice(idx + 2);
  const bytes = dataHex.match(/.{1,2}/g)?.map((h) => parseInt(h, 16)) ?? [];
  const codes: string[] = [];

  for (let i = 0; i < bytes.length - 1; i += 2) {
    const high = bytes[i];
    const low  = bytes[i + 1];
    if (high === 0 && low === 0) continue;

    const prefix = ['P', 'C', 'B', 'U'][(high & 0xC0) >> 6];
    const digit1 = (high & 0x30) >> 4;
    const digit2 = high & 0x0F;
    const digit3 = (low & 0xF0) >> 4;
    const digit4 = low & 0x0F;
    codes.push(`${prefix}${digit1}${digit2.toString(16).toUpperCase()}${digit3.toString(16).toUpperCase()}${digit4.toString(16).toUpperCase()}`);
  }

  return codes;
}

/**
 * 안전 이벤트 감지
 * prevSpeed, currSpeed: km/h, intervalSec: 측정 간격(초)
 */
export function detectEvents(
  prevSpeed: number,
  currSpeed: number,
  rpm: number,
  intervalSec: number = 5
): DrivingEvent[] {
  const events: DrivingEvent[] = [];
  const delta = currSpeed - prevSpeed;

  // 급가속: +10 km/h / 3초 이상
  if (delta / intervalSec > 10 / 3) {
    events.push({ type: 'harsh_accel', speed: currSpeed, rpm });
  }

  // 급제동: -15 km/h / 3초 이상
  if (delta / intervalSec < -15 / 3) {
    events.push({ type: 'harsh_brake', speed: currSpeed, rpm });
  }

  // 과속: 90 km/h 초과 (기본 제한 — 향후 도로 등급별 동적화)
  if (currSpeed > 90) {
    events.push({ type: 'speeding', speed: currSpeed, rpm });
  }

  // 장시간 공회전: 차속 0, RPM 700~1000
  if (currSpeed === 0 && rpm >= 700 && rpm <= 1000) {
    events.push({ type: 'idling', speed: 0, rpm });
  }

  return events;
}
