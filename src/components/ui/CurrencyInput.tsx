import React, { InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/Input';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currency';

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: string | number | null | undefined;
  onValueChange: (value: string) => void;
  label?: string;
  prefix?: string;
}

export function CurrencyInput({ value, onValueChange, label, prefix = 'Rp', inputMode = 'numeric', autoComplete = 'off', ...props }: CurrencyInputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
        </label>
      )}
      <Input
        {...props}
        type="text"
        inputMode={inputMode}
        autoComplete={autoComplete}
        prefix={prefix as React.ReactNode}
        value={formatCurrencyInput(value)}
        onChange={(event) => onValueChange(parseCurrencyInput(event.target.value))}
      />
    </div>
  );
}