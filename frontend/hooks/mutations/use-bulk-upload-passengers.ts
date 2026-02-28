import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BulkUploadParams {
  file: File;
  institutionId: string;
  skipDuplicates?: boolean;
}

interface BulkUploadResult {
  created: number;
  skipped: number;
  errors: Array<{ row: number; field: string; message: string; value?: string }>;
  totalProcessed: number;
}

async function bulkUploadPassengers(params: BulkUploadParams): Promise<BulkUploadResult> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('rails_access_token') : null;
  const base = process.env.NEXT_PUBLIC_RAILS_API_URL || 'http://localhost:3001/api/v1';

  const formData = new FormData();
  formData.append('file', params.file);

  const response = await fetch(`${base}/institutions/passengers/bulk_import`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message || `HTTP ${response.status}`);
  }

  const json = await response.json();
  const data = json.data || json;
  return {
    created: data.imported ?? data.created ?? 0,
    skipped: data.skipped ?? 0,
    errors:  data.errors ?? [],
    totalProcessed: (data.imported ?? 0) + (data.skipped ?? 0) + (data.errors?.length ?? 0),
  };
}

export function useBulkUploadPassengers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkUploadPassengers,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengers', variables.institutionId] });
    },
  });
}
