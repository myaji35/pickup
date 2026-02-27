import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * T293: useBulkUploadPassengers mutation hook
 * CSV 파일로 승객을 일괄 등록하는 mutation
 */

interface BulkUploadParams {
  file: File;
  institutionId: string;
  skipDuplicates?: boolean;
}

interface BulkUploadRowError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

interface BulkUploadResult {
  created: number;
  skipped: number;
  errors: BulkUploadRowError[];
  totalProcessed: number;
}

async function bulkUploadPassengers(params: BulkUploadParams): Promise<BulkUploadResult> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('institutionId', params.institutionId);
  formData.append('skipDuplicates', params.skipDuplicates !== false ? 'true' : 'false');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/passengers/bulk-upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload CSV file');
  }

  const data = await response.json();
  return data.data || data;
}

export function useBulkUploadPassengers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkUploadPassengers,
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengers', variables.institutionId] });

      if (result.errors.length > 0) {
        toast.warning(
          `${result.created} passengers created, but ${result.errors.length} errors occurred.`
        );
      } else if (result.skipped > 0) {
        toast.success(
          `${result.created} passengers created successfully. ${result.skipped} duplicates skipped.`
        );
      } else {
        toast.success(`${result.created} passengers created successfully!`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload CSV file');
    },
  });
}
