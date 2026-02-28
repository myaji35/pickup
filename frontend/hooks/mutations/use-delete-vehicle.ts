import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, institutionId }: { id: string; institutionId: string }) => {
      await railsClient.delete(`/institutions/vehicles/${id}`);
      return { id, institutionId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
