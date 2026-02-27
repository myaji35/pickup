'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * T364: ScheduleTimeInput Component
 * HH:MM 형식의 시간 입력 컴포넌트
 */

interface ScheduleTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export function ScheduleTimeInput({
  label,
  value,
  onChange,
  error,
  placeholder = 'HH:MM',
}: ScheduleTimeInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // 숫자와 콜론만 허용
    inputValue = inputValue.replace(/[^\d:]/g, '');

    // 자동 포맷팅: 2자리 입력 후 자동으로 콜론 추가
    if (inputValue.length === 2 && !inputValue.includes(':')) {
      inputValue = inputValue + ':';
    }

    // 최대 5자 (HH:MM)
    if (inputValue.length <= 5) {
      onChange(inputValue);
    }
  };

  const handleBlur = () => {
    // 포맷 검증 및 자동 수정
    if (value.length === 4 && value.includes(':')) {
      // H:MM 형식을 0H:MM으로 변환
      const parts = value.split(':');
      if (parts[0].length === 1) {
        onChange(`0${parts[0]}:${parts[1]}`);
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <Input
        id={label}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={5}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
