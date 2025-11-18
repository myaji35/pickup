'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { usePassengers } from '@/hooks/queries/use-passengers';
import { useCreatePassenger } from '@/hooks/mutations/use-create-passenger';
import { useUpdatePassenger } from '@/hooks/mutations/use-update-passenger';
import { useDeletePassenger } from '@/hooks/mutations/use-delete-passenger';
import { Button } from '@/components/ui/button';
import { CsvUploadDialog } from '@/components/dialogs/csv-upload-dialog';
import { Loader2, Plus, Upload } from 'lucide-react';

/**
 * Passengers Page
 * 승객 명단 관리 페이지
 */
export default function PassengersPage() {
  const params = useParams();
  const institutionId = params.id as string;

  const [shuttleTypeFilter, setShuttleTypeFilter] = useState<string | undefined>();
  const [search, setSearch] = useState<string | undefined>();
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);

  const { data: passengers = [], isLoading } = usePassengers(institutionId, {
    shuttleType: shuttleTypeFilter,
    search,
  });

  const createMutation = useCreatePassenger();
  const updateMutation = useUpdatePassenger();
  const deleteMutation = useDeletePassenger();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Passengers</h1>
          <p className="text-muted-foreground mt-2">
            Manage passengers for your institution
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setIsCsvUploadOpen(true)}
            variant="outline"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            CSV 업로드
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Passenger
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {passengers.map((passenger) => (
          <div
            key={passenger.id}
            className="p-4 border rounded-lg hover:bg-muted/50 transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{passenger.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {passenger.phoneNumber} • {passenger.shuttleType}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pickup: {passenger.pickupAddress}
                </p>
                <p className="text-sm text-muted-foreground">
                  Dropoff: {passenger.dropoffAddress}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    deleteMutation.mutate({
                      id: passenger.id,
                      institutionId,
                    })
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* T303: CSV Upload Dialog */}
      <CsvUploadDialog
        isOpen={isCsvUploadOpen}
        onClose={() => setIsCsvUploadOpen(false)}
        institutionId={institutionId}
      />
    </div>
  );
}
