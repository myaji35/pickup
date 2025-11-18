'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PassengerGroup } from '@/types/passenger-group';
import { PassengerGroupFormData } from '@/lib/schemas/passenger-group.schema';
import { usePassengerGroups } from '@/hooks/queries/use-passenger-groups';
import { useCreatePassengerGroup } from '@/hooks/mutations/use-create-passenger-group';
import { useUpdatePassengerGroup } from '@/hooks/mutations/use-update-passenger-group';
import { useDeletePassengerGroup } from '@/hooks/mutations/use-delete-passenger-group';
import { PassengerGroupTable } from '@/components/tables/passenger-group-table';
import { PassengerGroupDialog } from '@/components/dialogs/passenger-group-dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Loader2 } from 'lucide-react';

/**
 * Passenger Groups Page
 * 승객 그룹 관리 페이지
 */
export default function PassengerGroupsPage() {
  const params = useParams();
  const institutionId = params.id as string;

  // State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PassengerGroup | undefined>();
  const [groupToDelete, setGroupToDelete] = useState<PassengerGroup | undefined>();

  // Queries & Mutations
  const { data: groups = [], isLoading } = usePassengerGroups(institutionId);
  const createMutation = useCreatePassengerGroup();
  const updateMutation = useUpdatePassengerGroup();
  const deleteMutation = useDeletePassengerGroup();

  // Handlers
  const handleCreate = () => {
    setSelectedGroup(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (group: PassengerGroup) => {
    setSelectedGroup(group);
    setDialogOpen(true);
  };

  const handleDelete = (group: PassengerGroup) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: PassengerGroupFormData) => {
    if (selectedGroup) {
      // Update existing group
      await updateMutation.mutateAsync({
        id: selectedGroup.id,
        institutionId,
        data: {
          name: data.name,
        },
      });
    } else {
      // Create new group
      await createMutation.mutateAsync({
        institutionId: data.institutionId,
        groupCode: data.groupCode,
        name: data.name,
        passengerIds: data.passengerIds,
      });
    }
    setDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (groupToDelete) {
      await deleteMutation.mutateAsync({
        id: groupToDelete.id,
        institutionId,
      });
      setDeleteDialogOpen(false);
      setGroupToDelete(undefined);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Passenger Groups</h1>
          <p className="text-muted-foreground mt-2">
            Manage passenger groups for your institution
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>

      {/* Table */}
      <PassengerGroupTable
        groups={groups}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Create/Edit Dialog */}
      <PassengerGroupDialog
        institutionId={institutionId}
        group={selectedGroup}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the passenger group &quot;{groupToDelete?.name}&quot;.
              This action cannot be undone.
              {groupToDelete && groupToDelete.totalPassengerCount > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                  <p className="text-sm font-medium text-destructive">
                    Warning: This group has {groupToDelete.totalPassengerCount} passenger(s).
                    Please remove all passengers before deleting the group.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={
                deleteMutation.isPending ||
                (groupToDelete?.totalPassengerCount ?? 0) > 0
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
