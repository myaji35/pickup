'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useInstitution, useInstitutionTypes } from '@/hooks/queries/use-institution-types';
import { useUpdateInstitution } from '@/hooks/mutations/use-update-institution';
import { InstitutionTypeSelector } from '@/components/inputs/institution-type-selector';
import { InstitutionTypeChangeDialog } from '@/components/dialogs/institution-type-change-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, Bell, ChevronDown } from 'lucide-react';
import { railsClient } from '@/lib/rails-client';

// ── 타입 정의 ────────────────────────────────────────────────
interface NotificationSetting {
  guardian_id: number | null;
  notif_type: string;
  enabled: boolean;
  template: string | null;
  default_template: string;
}

interface Passenger {
  id: number;
  name: string;
}

const NOTIF_TYPE_LABELS: Record<string, string> = {
  trip_started:         '운행 시작',
  eta_before_boarding:  '탑승 예정 알림 (5분 전)',
  boarded:              '탑승 완료',
  eta_before_alighting: '하차 예정 알림 (5분 전)',
  alighted:             '하차 완료',
};

// 미리보기용 샘플 변수
const PREVIEW_VARS: Record<string, string> = {
  '{{ETA분}}':   '5',
  '{{승객이름}}': '홍길동',
  '{{기관명}}':   '행복유치원',
};

function renderPreview(template: string): string {
  let result = template;
  Object.entries(PREVIEW_VARS).forEach(([key, val]) => {
    result = result.replaceAll(key, val);
  });
  return result;
}

// ── 알림 설정 카드 ────────────────────────────────────────────
function NotificationSettingsCard({ institutionId }: { institutionId: string }) {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedPassengerId, setSelectedPassengerId] = useState<number | null>(null);
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [isLoadingPassengers, setIsLoadingPassengers] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 승객 목록 로드
  useEffect(() => {
    railsClient
      .get<{ id: number; name: string }[]>(`/institutions/passengers`)
      .then((data) => {
        setPassengers(data);
        if (data.length > 0) setSelectedPassengerId(data[0].id);
      })
      .catch(console.error)
      .finally(() => setIsLoadingPassengers(false));
  }, [institutionId]);

  // 선택된 승객의 알림 설정 로드
  useEffect(() => {
    if (!selectedPassengerId) return;
    setIsLoadingSettings(true);
    railsClient
      .get<NotificationSetting[]>(`/institutions/passengers/${selectedPassengerId}/notification_settings`)
      .then(setSettings)
      .catch(console.error)
      .finally(() => setIsLoadingSettings(false));
  }, [selectedPassengerId]);

  const updateSetting = (notif_type: string, field: 'enabled' | 'template', value: boolean | string): void => {
    setSettings((prev) =>
      prev.map((s) =>
        s.notif_type === notif_type ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSave = async () => {
    if (!selectedPassengerId) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await railsClient.patch(`/institutions/passengers/${selectedPassengerId}/notification_settings`, {
        settings: settings.map((s) => ({
          notif_type: s.notif_type,
          enabled: s.enabled,
          template: s.template || null,
        })),
      });
      setSaveMessage('저장되었습니다.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      setSaveMessage('저장 실패. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          승객별 알림 설정
        </CardTitle>
        <CardDescription>
          각 승객 보호자에게 발송되는 알림을 ON/OFF하고 문구를 개인화하세요.
          변수: <code className="bg-muted px-1 rounded text-xs">&#123;&#123;ETA분&#125;&#125;</code>{' '}
          <code className="bg-muted px-1 rounded text-xs">&#123;&#123;승객이름&#125;&#125;</code>{' '}
          <code className="bg-muted px-1 rounded text-xs">&#123;&#123;기관명&#125;&#125;</code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 승객 선택 */}
        <div className="space-y-1">
          <Label htmlFor="passenger-select">승객 선택</Label>
          {isLoadingPassengers ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              승객 목록 로딩 중...
            </div>
          ) : (
            <div className="relative">
              <select
                id="passenger-select"
                className="w-full border rounded-md px-3 py-2 text-sm appearance-none pr-8 bg-background"
                value={selectedPassengerId ?? ''}
                onChange={(e) => setSelectedPassengerId(Number(e.target.value))}
              >
                {passengers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 pointer-events-none text-muted-foreground" />
            </div>
          )}
        </div>

        {/* 알림 유형별 설정 */}
        {isLoadingSettings ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            알림 설정 로딩 중...
          </div>
        ) : (
          <div className="space-y-5">
            {settings.map((setting) => (
              <div key={setting.notif_type} className="border rounded-lg p-4 space-y-3">
                {/* 유형명 + 토글 */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {NOTIF_TYPE_LABELS[setting.notif_type] ?? setting.notif_type}
                  </span>
                  <Switch
                    checked={setting.enabled}
                    onCheckedChange={(v: boolean) => updateSetting(setting.notif_type, 'enabled', v)}
                  />
                </div>

                {setting.enabled && (
                  <>
                    {/* 템플릿 입력 */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        알림 문구 (비워두면 기본값 사용)
                      </Label>
                      <Textarea
                        rows={2}
                        className="text-sm resize-none"
                        placeholder={setting.default_template}
                        value={setting.template ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          updateSetting(setting.notif_type, 'template', e.target.value)
                        }
                      />
                    </div>

                    {/* 미리보기 */}
                    <div className="bg-muted rounded-md px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">미리보기: </span>
                      {renderPreview(setting.template || setting.default_template)}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 저장 버튼 */}
        {settings.length > 0 && (
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            {saveMessage && (
              <span className={`text-sm ${saveMessage.includes('실패') ? 'text-destructive' : 'text-green-600'}`}>
                {saveMessage}
              </span>
            )}
            <Button onClick={handleSave} disabled={isSaving || isLoadingSettings}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function InstitutionSettingsPage() {
  const params = useParams();
  const institutionId = params.id as string;

  const { data: institution, isLoading: isLoadingInstitution } = useInstitution(institutionId);
  const { data: institutionTypes = [] } = useInstitutionTypes();
  const updateInstitution = useUpdateInstitution();

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (institution) {
      setSelectedTypeId(institution.institutionTypeId);
    }
  }, [institution]);

  useEffect(() => {
    setHasChanges(selectedTypeId !== institution?.institutionTypeId);
  }, [selectedTypeId, institution?.institutionTypeId]);

  const handleTypeChange = (newTypeId: string | null) => setSelectedTypeId(newTypeId);

  const handleSave = () => setShowConfirmDialog(true);

  const handleConfirmChange = async () => {
    if (!institution) return;
    await updateInstitution.mutateAsync({
      id: institution.id,
      data: { institutionTypeId: selectedTypeId },
    });
    setShowConfirmDialog(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setSelectedTypeId(institution?.institutionTypeId ?? null);
    setHasChanges(false);
  };

  const currentType = institutionTypes.find((t: { id: string }) => t.id === institution?.institutionTypeId);
  const newType = institutionTypes.find((t: { id: string }) => t.id === selectedTypeId);

  if (isLoadingInstitution) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-gray-900" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">기관 설정</h1>
            <p className="mt-2 text-sm text-gray-600">
              기관 유형 및 승객별 알림 설정을 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* 기관 유형 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>기관 유형</CardTitle>
          <CardDescription>
            기관 유형을 선택하면 보육 시간 검증 규칙이 적용됩니다. 어린이집 유형은 모든 승객에게 최소 8시간 보육 시간이 필요합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-md space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">기관명:</span>
              <p className="font-medium">{institution?.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">사업자등록번호:</span>
              <p className="font-medium">{institution?.businessRegistrationNo}</p>
            </div>
          </div>

          <InstitutionTypeSelector
            value={selectedTypeId}
            onChange={handleTypeChange}
            disabled={updateInstitution.isPending}
          />

          {hasChanges && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
                onClick={handleCancel}
                disabled={!!updateInstitution.isPending}
              >
                취소
              </button>
              <Button onClick={handleSave} disabled={updateInstitution.isPending}>
                {updateInstitution.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '저장'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 승객별 알림 설정 카드 */}
      <NotificationSettingsCard institutionId={institutionId} />

      {/* 기관 유형 변경 확인 다이얼로그 */}
      <InstitutionTypeChangeDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmChange}
        currentType={currentType ?? null}
        newType={newType ?? null}
        isLoading={updateInstitution.isPending}
      />
    </div>
  );
}
