/**
 * OBD-II BLE 서비스 (react-native-ble-plx)
 *
 * 책임:
 *  1. BLE 스캔 → ELM327 동글 발견
 *  2. 연결 → GATT 특성 구독
 *  3. AT 초기화 명령 전송
 *  4. PID 폴링 (5초 간격)
 *  5. 안전 이벤트 감지 → 콜백
 */

import { BleManager, Device, Characteristic, BleError } from 'react-native-ble-plx';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  ELM327_SERVICE_UUID, ELM327_WRITE_CHAR_UUID, ELM327_NOTIFY_CHAR_UUID,
  PIDS, ObdData, DrivingEvent, parseResponse, parseDtc, detectEvents,
} from './elm327';

const SECURE_KEY_DEVICE_ID = 'obd_device_id';
const POLL_INTERVAL_MS = 5000;

// AT 초기화 시퀀스 (ELM327 표준)
const INIT_COMMANDS = [
  'ATZ\r',    // 리셋
  'ATE0\r',   // 에코 끄기
  'ATL0\r',   // 줄바꿈 끄기
  'ATS0\r',   // 공백 끄기
  'ATH0\r',   // 헤더 끄기
  'ATSP0\r',  // 프로토콜 자동 선택
];

export type ObdConnectionState = 'disconnected' | 'scanning' | 'connecting' | 'initializing' | 'connected' | 'error';

export interface ObdServiceCallbacks {
  onStateChange:  (state: ObdConnectionState) => void;
  onDataUpdate:   (data: ObdData) => void;
  onEventDetected:(events: DrivingEvent[]) => void;
  onDtcDetected:  (codes: string[]) => void;
  onError:        (msg: string) => void;
}

export class ObdService {
  private manager: BleManager;
  private device: Device | null = null;
  private writeChar: Characteristic | null = null;
  private responseBuffer = '';
  private resolveResponse: ((v: string) => void) | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private prevSpeed: number | null = null;
  private callbacks: ObdServiceCallbacks;

  constructor(callbacks: ObdServiceCallbacks) {
    this.manager = new BleManager();
    this.callbacks = callbacks;
  }

  // ── 공개 API ──────────────────────────────────────────────────

  /** 저장된 기기 ID로 재연결 시도, 없으면 스캔 */
  async connectOrScan(): Promise<void> {
    const savedId = await SecureStore.getItemAsync(SECURE_KEY_DEVICE_ID);
    if (savedId) {
      try {
        await this.connectToDevice(savedId);
        return;
      } catch {
        // 저장된 기기 연결 실패 → 스캔으로 폴백
      }
    }
    await this.startScan();
  }

  /** BLE 스캔 시작 */
  async startScan(): Promise<void> {
    this.callbacks.onStateChange('scanning');

    await this.requestPermissions();

    this.manager.startDeviceScan(
      [ELM327_SERVICE_UUID],
      { allowDuplicates: false },
      async (error: BleError | null, device: Device | null) => {
        if (error) {
          // UUID 필터 미지원 기기를 위한 폴백: 이름 기반 필터
          this.manager.stopDeviceScan();
          this.callbacks.onError(`스캔 오류: ${error.message}`);
          return;
        }
        if (device && this.isElm327(device)) {
          this.manager.stopDeviceScan();
          await this.connectToDevice(device.id);
        }
      }
    );

    // 30초 후 스캔 타임아웃
    setTimeout(() => {
      this.manager.stopDeviceScan();
      if (!this.device) {
        this.callbacks.onStateChange('disconnected');
        this.callbacks.onError('OBD 동글을 찾지 못했습니다. 동글이 꽂혀 있고 시동이 켜져 있는지 확인하세요.');
      }
    }, 30000);
  }

  /** 연결 해제 + 폴링 중지 */
  async disconnect(): Promise<void> {
    this.stopPolling();
    if (this.device) {
      await this.device.cancelConnection().catch(() => {});
      this.device = null;
    }
    this.callbacks.onStateChange('disconnected');
  }

  /** DTC 조회 (운행 시작 시 1회) */
  async checkDtc(): Promise<string[]> {
    try {
      const response = await this.sendCommand(PIDS.DTC + '\r');
      const codes = parseDtc(response);
      if (codes.length > 0) this.callbacks.onDtcDetected(codes);
      return codes;
    } catch {
      return [];
    }
  }

  destroy(): void {
    this.disconnect();
    this.manager.destroy();
  }

  // ── 내부 메서드 ───────────────────────────────────────────────

  private isElm327(device: Device): boolean {
    const name = (device.name ?? '').toLowerCase();
    return (
      name.includes('elm') ||
      name.includes('obd') ||
      name.includes('konnwei') ||
      name.includes('viecar') ||
      name.includes('obdlink')
    );
  }

  private async connectToDevice(deviceId: string): Promise<void> {
    this.callbacks.onStateChange('connecting');
    try {
      this.device = await this.manager.connectToDevice(deviceId, {
        autoConnect: true,
        requestMTU: 512,
      });

      await this.device.discoverAllServicesAndCharacteristics();

      const services = await this.device.services();
      const targetService = services.find(
        (s) => s.uuid.toLowerCase() === ELM327_SERVICE_UUID
      );
      if (!targetService) throw new Error('ELM327 서비스를 찾을 수 없습니다');

      const chars = await targetService.characteristics();
      this.writeChar = chars.find(
        (c) => c.uuid.toLowerCase() === ELM327_WRITE_CHAR_UUID
      ) ?? null;
      const notifyChar = chars.find(
        (c) => c.uuid.toLowerCase() === ELM327_NOTIFY_CHAR_UUID
      ) ?? null;

      if (!this.writeChar || !notifyChar) throw new Error('필요한 GATT 특성이 없습니다');

      // 응답 수신 구독
      notifyChar.monitor((error, char) => {
        if (error || !char?.value) return;
        const chunk = Buffer.from(char.value, 'base64').toString('ascii');
        this.responseBuffer += chunk;
        if (this.responseBuffer.includes('>') && this.resolveResponse) {
          this.resolveResponse(this.responseBuffer);
          this.responseBuffer = '';
          this.resolveResponse = null;
        }
      });

      // 기기 ID 저장 (재연결용)
      await SecureStore.setItemAsync(SECURE_KEY_DEVICE_ID, deviceId);

      // AT 초기화
      this.callbacks.onStateChange('initializing');
      for (const cmd of INIT_COMMANDS) {
        await this.sendCommand(cmd);
        await this.sleep(300);
      }

      this.callbacks.onStateChange('connected');
      this.startPolling();
    } catch (e: any) {
      this.callbacks.onStateChange('error');
      this.callbacks.onError(`연결 실패: ${e.message}`);
    }
  }

  private async sendCommand(cmd: string): Promise<string> {
    if (!this.writeChar) throw new Error('BLE 연결 없음');

    return new Promise((resolve, reject) => {
      this.resolveResponse = resolve;
      const b64 = Buffer.from(cmd).toString('base64');
      this.writeChar!.writeWithResponse(b64).catch(reject);

      // 3초 타임아웃
      setTimeout(() => {
        if (this.resolveResponse === resolve) {
          this.resolveResponse = null;
          resolve('TIMEOUT');
        }
      }, 3000);
    });
  }

  private startPolling(): void {
    this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async poll(): Promise<void> {
    try {
      const [speedRaw, rpmRaw, coolantRaw, fuelRaw, throttleRaw] = await Promise.all([
        this.sendCommand(PIDS.SPEED + '\r'),
        this.sendCommand(PIDS.RPM   + '\r'),
        this.sendCommand(PIDS.COOLANT_TEMP + '\r'),
        this.sendCommand(PIDS.FUEL_LEVEL   + '\r'),
        this.sendCommand(PIDS.THROTTLE     + '\r'),
      ]);

      const data: ObdData = {
        speed:       parseResponse(PIDS.SPEED,        speedRaw),
        rpm:         parseResponse(PIDS.RPM,           rpmRaw),
        coolantTemp: parseResponse(PIDS.COOLANT_TEMP, coolantRaw),
        fuelLevel:   parseResponse(PIDS.FUEL_LEVEL,   fuelRaw),
        throttle:    parseResponse(PIDS.THROTTLE,     throttleRaw),
      };

      this.callbacks.onDataUpdate(data);

      // 안전 이벤트 감지
      if (data.speed !== null && this.prevSpeed !== null) {
        const events = detectEvents(
          this.prevSpeed,
          data.speed,
          data.rpm ?? 0,
          POLL_INTERVAL_MS / 1000
        );
        if (events.length > 0) this.callbacks.onEventDetected(events);
      }
      if (data.speed !== null) this.prevSpeed = data.speed;
    } catch (e: any) {
      console.warn('OBD 폴링 오류:', e.message);
    }
  }

  private async requestPermissions(): Promise<void> {
    if (Platform.OS !== 'android') return;
    const { PermissionsAndroid } = await import('react-native');
    if (Platform.Version >= 31) {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
    } else {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
