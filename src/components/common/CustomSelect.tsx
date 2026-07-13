// src/components/common/CustomSelect.tsx
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  style = {}
}) => {
  const { t } = useTranslation('common');
  const resolvedPlaceholder = placeholder ?? t('customSelect.placeholder');
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-full ${className}`} style={style}>
        <SelectValue placeholder={resolvedPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CustomSelect;
