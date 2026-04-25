import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Label } from '@radix-ui/react-label'
import { Check } from 'lucide-react'
import { useId, type ComponentPropsWithoutRef } from 'react'
import { checkboxColors, checkboxSizes, type CheckboxSize } from './variants'
import { defaultUiColor, type UiColor } from '../ui.config'

interface CheckboxProps extends ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string
  color?: UiColor
  size?: CheckboxSize
}

export function Checkbox({
  label,
  color = defaultUiColor,
  size = 'md',
  id: idProp,
  className,
  ...props
}: CheckboxProps) {
  const generated = useId()
  const id = idProp ?? generated
  const { box, iconSize } = checkboxSizes[size]
  const { checked, focus } = checkboxColors[color]

  return (
    <div className="flex items-center gap-2">
      <CheckboxPrimitive.Root
        id={id}
        className={[
          'shrink-0 cursor-pointer border-2 border-neutral-300 bg-white transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          box, focus, checked,
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
          <Check size={iconSize} strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      {label && (
        <Label htmlFor={id} className="cursor-pointer select-none text-sm text-neutral-900">
          {label}
        </Label>
      )}
    </div>
  )
}
