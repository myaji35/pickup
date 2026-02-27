/**
 * CoachingScreen — Epic 15-4
 * 운전 코칭 메시지 + 배지 + 주간 요약
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../api/client';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface CoachingMessage {
  id: number;
  trigger_event: string;
  message_type: 'tip' | 'warning' | 'praise' | 'summary';
  severity: 'info' | 'warning' | 'critical';
  content: string;
  read: boolean;
  created_at: string;
}

interface Badge {
  id: number;
  badge_type: string;
  label: string;
  level: string;
  color: string;
  earned_on: string;
}

interface WeeklySummary {
  week_start: string;
  total_trips: number;
  avg_score: number;
  badges_earned: number;
  improvement_tips: string[];
  praise_points: string[];
}

interface CoachingSummary {
  safety_score: { overall_score: number; grade: string; period: string } | null;
  event_stats_30d: Record<string, number>;
  badge_count: number;
  unread_coaching: number;
  weekly_summary: WeeklySummary | null;
}

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────

const MSG_CONFIG: Record<string, { bg: string; border: string; icon: string }> = {
  tip:     { bg: '#eff6ff', border: '#93c5fd', icon: '💡' },
  warning: { bg: '#fff7ed', border: '#fdba74', icon: '⚠️' },
  praise:  { bg: '#f0fdf4', border: '#86efac', icon: '🎉' },
  summary: { bg: '#f8fafc', border: '#cbd5e1', icon: '📊' },
};

const SEVERITY_COLORS: Record<string, string> = {
  info:     '#3b82f6',
  warning:  '#f59e0b',
  critical: '#ef4444',
};

const LEVEL_EMOJI: Record<string, string> = {
  bronze:   '🥉',
  silver:   '🥈',
  gold:     '🥇',
  platinum: '💎',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1)  return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}시간 전`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const EVENT_LABELS: Record<string, string> = {
  harsh_braking:      '급제동',
  harsh_acceleration: '급가속',
  speeding:           '과속',
  dtc_alert:          '차량 이상',
  trip_completed:     '운행 완료',
  weekly_summary:     '주간 요약',
};

// ─────────────────────────────────────────────────
// CoachingScreen
// ─────────────────────────────────────────────────

type Tab = 'messages' | 'badges' | 'summary';

export const CoachingScreen: React.FC = () => {
  const [tab, setTab]             = useState<Tab>('messages');
  const [messages, setMessages]   = useState<CoachingMessage[]>([]);
  const [badges, setBadges]       = useState<Badge[]>([]);
  const [summary, setSummary]     = useState<CoachingSummary | null>(null);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [msgRes, badgeRes, sumRes] = await Promise.all([
        apiClient.get('/driver/coaching/messages'),
        apiClient.get('/driver/coaching/badges'),
        apiClient.get('/driver/coaching/summary'),
      ]);
      setMessages(msgRes.data?.data?.messages ?? []);
      setUnread(msgRes.data?.data?.unread_count ?? 0);
      setBadges(badgeRes.data?.data?.badges ?? []);
      setSummary(sumRes.data?.data ?? null);
    } catch (e) {
      console.error('코칭 데이터 로드 실패:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleRefresh = () => { setRefreshing(true); loadAll(); };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/driver/coaching/messages/read_all');
      setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
      setUnread(0);
    } catch (e) {
      console.error('읽음 처리 실패:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A1E0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>운전 코칭</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.readAllBtn}>모두 읽음</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 탭 */}
      <View style={styles.tabBar}>
        {(['messages', 'badges', 'summary'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'messages' ? `메시지${unread > 0 ? ` (${unread})` : ''}` : t === 'badges' ? '배지' : '주간 요약'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00A1E0" />}
      >
        {/* ── 메시지 탭 ── */}
        {tab === 'messages' && (
          <>
            {messages.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyText}>아직 코칭 메시지가 없습니다.</Text>
                <Text style={styles.emptySubText}>운행을 완료하면 맞춤 피드백이 제공됩니다.</Text>
              </View>
            ) : (
              messages.map((msg) => {
                const cfg = MSG_CONFIG[msg.message_type] ?? MSG_CONFIG.tip;
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.msgCard,
                      { backgroundColor: cfg.bg, borderLeftColor: cfg.border },
                      !msg.read && styles.msgUnread
                    ]}
                  >
                    <View style={styles.msgTop}>
                      <Text style={styles.msgIcon}>{cfg.icon}</Text>
                      <View style={styles.msgMeta}>
                        <Text style={[styles.msgEventLabel, { color: SEVERITY_COLORS[msg.severity] }]}>
                          {EVENT_LABELS[msg.trigger_event] ?? msg.trigger_event}
                        </Text>
                        <Text style={styles.msgTime}>{formatTime(msg.created_at)}</Text>
                      </View>
                      {!msg.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.msgContent}>{msg.content}</Text>
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── 배지 탭 ── */}
        {tab === 'badges' && (
          <>
            <Text style={styles.sectionTitle}>획득 배지 {badges.length}개</Text>
            {badges.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🏅</Text>
                <Text style={styles.emptyText}>아직 배지가 없습니다.</Text>
                <Text style={styles.emptySubText}>안전 운전을 꾸준히 유지하면 배지를 획득할 수 있어요!</Text>
              </View>
            ) : (
              <View style={styles.badgeGrid}>
                {badges.map((badge) => (
                  <View key={badge.id} style={[styles.badgeCard, { borderColor: badge.color + '40' }]}>
                    <Text style={styles.badgeEmoji}>{LEVEL_EMOJI[badge.level] ?? '🏅'}</Text>
                    <Text style={styles.badgeLabel}>{badge.label}</Text>
                    <Text style={[styles.badgeLevel, { color: badge.color }]}>
                      {badge.level.toUpperCase()}
                    </Text>
                    <Text style={styles.badgeDate}>{badge.earned_on}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── 주간 요약 탭 ── */}
        {tab === 'summary' && summary && (
          <>
            {/* 안전 점수 */}
            {summary.safety_score && (
              <View style={styles.scoreCard}>
                <Text style={styles.scoreTitle}>최근 안전 점수</Text>
                <Text style={styles.scoreValue}>{summary.safety_score.overall_score}</Text>
                <Text style={styles.scoreGrade}>{summary.safety_score.grade}등급</Text>
                <Text style={styles.scorePeriod}>{summary.safety_score.period}</Text>
              </View>
            )}

            {/* 이벤트 통계 (30일) */}
            <View style={styles.statsCard}>
              <Text style={styles.sectionTitle}>최근 30일 이벤트</Text>
              {Object.entries(summary.event_stats_30d).length === 0 ? (
                <Text style={styles.statsEmpty}>이벤트가 없습니다 👍</Text>
              ) : (
                Object.entries(summary.event_stats_30d).map(([type, count]) => (
                  <View key={type} style={styles.statRow}>
                    <Text style={styles.statLabel}>{EVENT_LABELS[type] ?? type}</Text>
                    <Text style={styles.statValue}>{count}건</Text>
                  </View>
                ))
              )}
            </View>

            {/* 주간 요약 */}
            {summary.weekly_summary && (
              <View style={styles.weeklyCard}>
                <Text style={styles.sectionTitle}>주간 요약 ({summary.weekly_summary.week_start}~)</Text>
                <View style={styles.weeklyStats}>
                  {[
                    { label: '운행 횟수', value: `${summary.weekly_summary.total_trips}회` },
                    { label: '평균 점수', value: `${summary.weekly_summary.avg_score}점` },
                    { label: '획득 배지', value: `${summary.weekly_summary.badges_earned}개` },
                  ].map((s) => (
                    <View key={s.label} style={styles.weeklyStatItem}>
                      <Text style={styles.weeklyStatValue}>{s.value}</Text>
                      <Text style={styles.weeklyStatLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                {summary.weekly_summary.praise_points.length > 0 && (
                  <View style={styles.praiseBox}>
                    <Text style={styles.praiseTitle}>잘한 점 👍</Text>
                    {summary.weekly_summary.praise_points.map((p, i) => (
                      <Text key={i} style={styles.praiseItem}>• {p}</Text>
                    ))}
                  </View>
                )}

                {summary.weekly_summary.improvement_tips.length > 0 && (
                  <View style={styles.tipBox}>
                    <Text style={styles.tipTitle}>개선 포인트 💪</Text>
                    {summary.weekly_summary.improvement_tips.map((t, i) => (
                      <Text key={i} style={styles.tipItem}>• {t}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ─────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f1f5f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  readAllBtn:  { fontSize: 13, color: '#94a3b8', paddingBottom: 2 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#00A1E0' },
  tabText:   { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  tabTextActive: { color: '#00A1E0', fontWeight: '700' },
  scroll:    { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon:    { fontSize: 48, marginBottom: 8 },
  emptyText:    { fontSize: 16, fontWeight: '600', color: '#475569' },
  emptySubText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 20 },
  msgCard: {
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    marginBottom: 2,
  },
  msgUnread: { opacity: 1 },
  msgTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  msgIcon: { fontSize: 20 },
  msgMeta: { flex: 1 },
  msgEventLabel: { fontSize: 12, fontWeight: '700' },
  msgTime:  { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  msgContent: { fontSize: 14, color: '#334155', lineHeight: 20 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00A1E0' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeEmoji: { fontSize: 36, marginBottom: 8 },
  badgeLabel: { fontSize: 13, fontWeight: '600', color: '#1e293b', textAlign: 'center' },
  badgeLevel: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  badgeDate:  { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  scoreCard: {
    backgroundColor: '#00A1E0',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreTitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  scoreValue: { fontSize: 56, fontWeight: 'bold', color: '#fff', lineHeight: 64 },
  scoreGrade: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  scorePeriod: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  statsCard:  { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  statsEmpty: { fontSize: 14, color: '#16a34a', textAlign: 'center', paddingVertical: 8 },
  statRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
                borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statLabel:  { fontSize: 14, color: '#475569' },
  statValue:  { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  weeklyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12 },
  weeklyStats: { flexDirection: 'row', justifyContent: 'space-around' },
  weeklyStatItem: { alignItems: 'center' },
  weeklyStatValue: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  weeklyStatLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  praiseBox: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 12 },
  praiseTitle: { fontSize: 13, fontWeight: '700', color: '#16a34a', marginBottom: 6 },
  praiseItem:  { fontSize: 13, color: '#166534', lineHeight: 20 },
  tipBox:    { backgroundColor: '#fffbeb', borderRadius: 8, padding: 12 },
  tipTitle:  { fontSize: 13, fontWeight: '700', color: '#d97706', marginBottom: 6 },
  tipItem:   { fontSize: 13, color: '#92400e', lineHeight: 20 },
});
