'use client';

import { Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInstitutionTypes } from '@/hooks/queries/use-institution-types';
import { Label } from '@/components/ui/label';

/**
 * T409: InstitutionTypeSelector Component
 * 기관 유형 선택 컴포넌트
 */

interface InstitutionTypeSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function InstitutionTypeSelector({
  value,
  onChange,
  disabled = false,
}: InstitutionTypeSelectorProps) {
  const { data: institutionTypes, isLoading } = useInstitutionTypes();

  const handleValueChange = (newValue: string) => {
    // "none" means removing the institution type
    if (newValue === 'none') {
      onChange(null);
    } else {
      onChange(newValue);
    }
  };

  // Find selected type for tooltip info
  const selectedType = institutionTypes?.find((type) => type.id === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="institution-type">Institution Type</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="space-y-2">
                <p className="font-semibold">Care Time Requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <strong>DAYCARE (주간보호):</strong> Requires minimum 8 hours care time
                    for passengers
                  </li>
                  <li>
                    <strong>GENERAL (일반):</strong> No care time validation required
                  </li>
                  <li>
                    <strong>None:</strong> No institution type set, no validation
                  </li>
                </ul>
                {selectedType && selectedType.minimumCareTimeHours && (
                  <p className="text-amber-600 text-sm mt-2">
                    ⚠️ Current setting requires {selectedType.minimumCareTimeHours} hours
                    minimum care time
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Select
        value={value || 'none'}
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id="institution-type" className="w-full">
          <SelectValue placeholder="Select institution type..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">None (No type set)</span>
          </SelectItem>
          {institutionTypes?.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <div className="flex items-center justify-between w-full">
                <span>
                  {type.typeName} ({type.typeCode})
                </span>
                {type.minimumCareTimeHours && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {type.minimumCareTimeHours}h min
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedType && selectedType.minimumCareTimeHours && (
        <p className="text-sm text-muted-foreground">
          This type requires minimum {selectedType.minimumCareTimeHours} hours care time
          for all passengers
        </p>
      )}
    </div>
  );
}
