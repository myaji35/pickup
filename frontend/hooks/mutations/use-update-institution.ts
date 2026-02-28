import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';

interface UpdateInstitutionInput {
  name?: string;
  institution_type?: string;
  [key: string]: unknown;
}

export function useUpdateInstitution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInstitutionInput }) =>
      railsClient.patch<{ id: number }>(`/admin/institutions/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['institution', String(data.id)] });
    },
  });
}
