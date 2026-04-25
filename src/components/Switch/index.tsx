import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Label } from '@radix-ui/react-label'
import { useId, type ComponentPropsWithoutRef } from 'react'
import { switchColors, switchSizes, type SwitchSize } from './variants'
import { defaultUiColor, type UiColor } from '../ui.config'

interface SwitchProps extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string
  color?: UiColor
  size?: SwitchSize
}

export function Switch({
  label,
  color = defaultUiColor,
  size = 'md',
  id: idProp,
  className,
  ...props
}: SwitchProps) {
  const generated = useId()
  const id = idProp ?? generated
  const { root, thumb } = switchSizes[size]
  const { on, focus } = switchColors[color]

  return (
    <div className="flex items-center gap-2">
      <SwitchPrimitive.Root
        id={id}
        className={[
          'relative inline-flex shrink-0 cursor-pointer rounded-full bg-neutral-300 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          root, on, focus,
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={[
            'pointer-events-none block rounded-full bg-white shadow transition-transform',
            thumb,
          ].join(' ')}
        />
      </SwitchPrimitive.Root>

      {label && (
        <Label htmlFor={id} className="cursor-pointer select-none text-sm text-neutral-900">
          {label}
        </Label>
      )}
    </div>
  )
}
