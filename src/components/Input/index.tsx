import { Label } from '@radix-ui/react-label'
import { forwardRef, type InputHTMLAttributes, useId } from 'react'
import { getInputClasses, type InputVariant } from './variants'
import { defaultUiColor, type UiColor } from '../ui.config'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  variant?: InputVariant
  color?: UiColor
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    variant = 'default',
    color = defaultUiColor,
    className,
    id: idProp,
    ...props
  },
  ref,
) {
  const generated = useId()
  const id = idProp ?? generated

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
        </Label>
      )}
      <input
        ref={ref}
        id={id}
        className={[
          'h-9 w-full cursor-pointer text-sm outline-none transition-colors',
          'placeholder:text-neutral-400',
          variant !== 'ghost' && 'rounded-md',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variant !== 'ghost' && 'px-3',
          getInputClasses(variant, color, !!error),
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && <span className="text-xs text-error-600">{error}</span>}
    </div>
  )
})
