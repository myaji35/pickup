'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Clock } from 'lucide-react';

/**
 * 알림 벨 — pending 기관 승인 대기 카운트 표시
 * (Rails notification_logs 연동 예정)
 */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingCount = async () => {
    try {
      const { railsClient } = await import('@/lib/rails-client');
      const data = await railsClient.get<{ meta?: { total_count: number } }>('/admin/institutions/pending');
      setPendingCount((data as any)?.meta?.total_count ?? 0);
    } catch {
      // 조용히 실패
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
      >
        <Bell className="w-5 h-5" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">알림</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              {pendingCount > 0 ? (
                <a
                  href="/admin/institutions/pending"
                  className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-gray-900">승인 대기 중인 기관</p>
                    <p className="text-xs text-gray-600">{pendingCount}개 기관이 승인을 기다립니다.</p>
                  </div>
                </a>
              ) : (
                <div className="py-6 text-center text-gray-500">
                  <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">새로운 알림이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
