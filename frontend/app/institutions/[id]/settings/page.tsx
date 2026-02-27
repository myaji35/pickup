'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useInstitution, useInstitutionTypes } from '@/hooks/queries/use-institution-types';
import { useUpdateInstitution } from '@/hooks/mutations/use-update-institution';
import { InstitutionTypeSelector } from '@/components/inputs/institution-type-selector';
import { InstitutionTypeChangeDialog } from '@/components/dialogs/institution-type-change-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2 } from 'lucide-react';

/**
 * T410: Institution Settings Page
 * 기관 설정 페이지 - 기관 유형 선택
 */
export default function InstitutionSettingsPage() {
  const params = useParams();
  const institutionId = params.id as string;

  // Queries & Mutations
  const { data: institution, isLoading: isLoadingInstitution } = useInstitution(institutionId);
  const { data: institutionTypes = [] } = useInstitutionTypes();
  const updateInstitution = useUpdateInstitution();

  // State
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize selected type from institution data
  useEffect(() => {
    if (institution) {
      setSelectedTypeId(institution.institutionTypeId);
    }
  }, [institution]);

  // Check if there are unsaved changes
  useEffect(() => {
    setHasChanges(selectedTypeId !== institution?.institutionTypeId);
  }, [selectedTypeId, institution?.institutionTypeId]);

  const handleTypeChange = (newTypeId: string | null) => {
    setSelectedTypeId(newTypeId);
  };

  const handleSave = () => {
    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmChange = async () => {
    if (!institution) return;

    await updateInstitution.mutateAsync({
      id: institution.id,
      data: {
        institutionTypeId: selectedTypeId,
      },
    });

    setShowConfirmDialog(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    // Reset to original value
    setSelectedTypeId(institution?.institutionTypeId ?? null);
    setHasChanges(false);
  };

  const currentType = institutionTypes.find(
    (type) => type.id === institution?.institutionTypeId
  );
  const newType = institutionTypes.find((type) => type.id === selectedTypeId);

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
            <h1 className="text-3xl font-bold text-gray-900">Institution Settings</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage institution type and care time validation rules
            </p>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Institution Type</CardTitle>
          <CardDescription>
            Select the institution type to enable care time validation. DAYCARE institutions
            require 8-hour minimum care time for all passengers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Institution Info */}
          <div className="bg-muted p-4 rounded-md space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Institution Name:</span>
              <p className="font-medium">{institution?.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Business Registration No:</span>
              <p className="font-medium">{institution?.businessRegistrationNo}</p>
            </div>
          </div>

          {/* Type Selector */}
          <InstitutionTypeSelector
            value={selectedTypeId}
            onChange={handleTypeChange}
            disabled={updateInstitution.isPending}
          />

          {/* Save/Cancel Buttons */}
          {hasChanges && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCancel} disabled={updateInstitution.isPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateInstitution.isPending}>
                {updateInstitution.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
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
