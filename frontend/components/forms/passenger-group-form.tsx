'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passengerGroupSchema, PassengerGroupFormData } from '@/lib/schemas/passenger-group.schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface PassengerGroupFormProps {
  institutionId: string;
  defaultValues?: Partial<PassengerGroupFormData>;
  onSubmit: (data: PassengerGroupFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
}

/**
 * PassengerGroupForm Component
 * 승객 그룹 생성/수정 폼
 */
export function PassengerGroupForm({
  institutionId,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditMode = false,
}: PassengerGroupFormProps) {
  const form = useForm<PassengerGroupFormData>({
    resolver: zodResolver(passengerGroupSchema),
    defaultValues: {
      institutionId,
      groupCode: defaultValues?.groupCode || '',
      name: defaultValues?.name || '',
      passengerIds: defaultValues?.passengerIds || [],
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="groupCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="GRP001"
                  {...field}
                  disabled={isEditMode || isLoading}
                />
              </FormControl>
              <FormDescription>
                A unique code for this group (1-20 characters, letters, numbers, hyphens, and underscores only)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Morning Group A"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                A descriptive name for this passenger group
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditMode ? 'Update Group' : 'Create Group'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
