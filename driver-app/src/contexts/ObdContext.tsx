/**
 * OBD-II Context
 *
 * ObdService를 React Context로 감싸 앱 전체에 OBD 데이터를 제공
 * - 연결 상태 (disconnected → scanning → connecting → initializing → connected)
 * - 실시간 차량 데이터 (속도, RPM, 냉각수 온도, 연료량, 스로틀)
 * - 안전 이벤트 (급가속, 급제동, 과속, 공회전)
 * - DTC 오류 코드
 */

import React, {
  createContext, useContext, useRef, useState, useCallback, useEffect,
} from 'react';
import { ObdService, ObdConnectionState } from '../services/obd2/ObdService';
import { ObdData, DrivingEvent } from '../services/obd2/elm327';

interface ObdContextValue {
  // 연결 상태
  connectionState: ObdConnectionState;
  isConnected: boolean;

  // 실시간 데이터
  obdData: ObdData | null;

  // 안전 이벤트 (최근 5개)
  recentEvents: DrivingEvent[];

  // DTC 코드 (운행 시작 시 조회)
  dtcCodes: string[];

  // 에러 메시지
  lastError: string | null;

  // 액션
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkDtc: () => Promise<string[]>;
  clearEvents: () => void;
}

const ObdContext = createContext<ObdContextValue | null>(null);

export const ObdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionState, setConnectionState] = useState<ObdConnectionState>('disconnected');
  const [obdData, setObdData] = useState<ObdData | null>(null);
  const [recentEvents, setRecentEvents] = useState<DrivingEvent[]>([]);
  const [dtcCodes, setDtcCodes] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const serviceRef = useRef<ObdService | null>(null);

  // ObdService 초기화 (컴포넌트 마운트 시)
  useEffect(() => {
    const service = new ObdService({
      onStateChange: (state) => setConnectionState(state),
      onDataUpdate:  (data)  => setObdData(data),
      onEventDetected: (events) => {
        setRecentEvents((prev) => [...events, ...prev].slice(0, 5));
      },
      onDtcDetected: (codes) => setDtcCodes(codes),
      onError: (msg) => setLastError(msg),
    });
    serviceRef.current = service;

    return () => {
      service.destroy();
      serviceRef.current = null;
    };
  }, []);

  const connect = useCallback(async () => {
    setLastError(null);
    await serviceRef.current?.connectOrScan();
  }, []);

  const disconnect = useCallback(async () => {
    await serviceRef.current?.disconnect();
  }, []);

  const checkDtc = useCallback(async (): Promise<string[]> => {
    return serviceRef.current?.checkDtc() ?? Promise.resolve([]);
  }, []);

  const clearEvents = useCallback(() => {
    setRecentEvents([]);
  }, []);

  return (
    <ObdContext.Provider value={{
      connectionState,
      isConnected: connectionState === 'connected',
      obdData,
      recentEvents,
      dtcCodes,
      lastError,
      connect,
      disconnect,
      checkDtc,
      clearEvents,
    }}>
      {children}
    </ObdContext.Provider>
  );
};

export const useObd = (): ObdContextValue => {
  const ctx = useContext(ObdContext);
  if (!ctx) throw new Error('useObd must be used within ObdProvider');
  return ctx;
};
