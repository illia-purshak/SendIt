import { Input } from ".";

const NumericInput = ({
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) => {
  return (
    <Input
      label={label}
      placeholder={placeholder}
      type="number"
      min={0}
      step="any"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      color="green"
      error={error}
    />
  );
};

export default NumericInput;
