'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { usePassengers } from '@/hooks/queries/use-passengers';
import { useCreatePassenger } from '@/hooks/mutations/use-create-passenger';
import { useUpdatePassenger } from '@/hooks/mutations/use-update-passenger';
import { useDeletePassenger } from '@/hooks/mutations/use-delete-passenger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CsvUploadDialog } from '@/components/dialogs/csv-upload-dialog';
import { Loader2, Plus, Upload, Search, X, Filter } from 'lucide-react';

/**
 * Passengers Page
 * 승객 명단 관리 페이지
 * T317-T326: Search and Filter UI
 */
export default function PassengersPage() {
  const params = useParams();
  const institutionId = params.id as string;

  // T318: Search with debounce
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // T319-T321: Filter states
  const [shuttleTypeFilter, setShuttleTypeFilter] = useState<string | undefined>();
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<'assigned' | 'unassigned' | undefined>();
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);

  // T318: Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: passengers = [], isLoading } = usePassengers(institutionId, {
    shuttleType: shuttleTypeFilter,
    search: debouncedSearch || undefined,
    assignmentStatus: assignmentStatusFilter,
  });

  const createMutation = useCreatePassenger();
  const updateMutation = useUpdatePassenger();
  const deleteMutation = useDeletePassenger();

  // T322: Clear all filters
  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setShuttleTypeFilter(undefined);
    setAssignmentStatusFilter(undefined);
  };

  // T323: Check if any filters are active
  const hasActiveFilters = searchInput || shuttleTypeFilter || assignmentStatusFilter;

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

      {/* T317-T326: Search and Filter UI */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Search & Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* T318: Search Input with debounce */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* T319: Shuttle Type Filter */}
          <Select
            value={shuttleTypeFilter || 'all'}
            onValueChange={(value) => setShuttleTypeFilter(value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Shuttle Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="MORNING">Morning</SelectItem>
              <SelectItem value="EVENING">Evening</SelectItem>
              <SelectItem value="TEMPORARY">Temporary</SelectItem>
            </SelectContent>
          </Select>

          {/* T309 & T320: Assignment Status Filter */}
          <Select
            value={assignmentStatusFilter || 'all'}
            onValueChange={(value) => setAssignmentStatusFilter(value === 'all' ? undefined : value as 'assigned' | 'unassigned')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assignment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* T323-T326: Active Filters Display and Clear Button */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {searchInput && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchInput}
                <button onClick={() => setSearchInput('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {shuttleTypeFilter && (
              <Badge variant="secondary" className="gap-1">
                Type: {shuttleTypeFilter}
                <button onClick={() => setShuttleTypeFilter(undefined)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {assignmentStatusFilter && (
              <Badge variant="secondary" className="gap-1">
                Status: {assignmentStatusFilter}
                <button onClick={() => setAssignmentStatusFilter(undefined)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* T325: Result count */}
        <div className="text-sm text-muted-foreground">
          {passengers.length} passenger{passengers.length !== 1 ? 's' : ''} found
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
