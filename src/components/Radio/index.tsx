import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Label } from '@radix-ui/react-label'
import { createContext, useContext, useId, type ComponentPropsWithoutRef } from 'react'
import { radioColors } from './variants'
import { defaultUiColor, type UiColor } from '../ui.config'

const RadioColorContext = createContext<UiColor>(defaultUiColor)

interface RadioGroupProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  color?: UiColor
}

export function RadioGroup({ color = defaultUiColor, className, ...props }: RadioGroupProps) {
  return (
    <RadioColorContext.Provider value={color}>
      <RadioGroupPrimitive.Root
        className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}
        {...props}
      />
    </RadioColorContext.Provider>
  )
}

interface RadioItemProps extends ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  label?: string
}

export function RadioItem({ label, id: idProp, className, ...props }: RadioItemProps) {
  const color = useContext(RadioColorContext)
  const generated = useId()
  const id = idProp ?? generated
  const { checked, focus } = radioColors[color]

  return (
    <div className="flex items-center gap-2">
      <RadioGroupPrimitive.Item
        id={id}
        className={[
          'h-5 w-5 shrink-0 cursor-pointer rounded-full border-2 border-neutral-300 bg-white transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          focus, checked,
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="flex h-full w-full items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-white" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>

      {label && (
        <Label htmlFor={id} className="cursor-pointer select-none text-sm text-neutral-900">
          {label}
        </Label>
      )}
    </div>
  )
}
