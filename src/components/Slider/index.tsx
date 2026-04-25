import * as SliderPrimitive from '@radix-ui/react-slider'
import { type ComponentPropsWithoutRef } from 'react'
import { sliderColors } from './variants'
import { defaultUiColor, type UiColor } from '../ui.config'

interface SliderProps extends ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  color?: UiColor
}

export function Slider({ color = defaultUiColor, className, ...props }: SliderProps) {
  const { range, thumb, focus } = sliderColors[color]

  return (
    <SliderPrimitive.Root
      className={['relative flex w-full touch-none select-none items-center', className].filter(Boolean).join(' ')}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-neutral-200">
        <SliderPrimitive.Range className={['absolute h-full', range].join(' ')} />
      </SliderPrimitive.Track>

      {(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={[
            'block h-5 w-5 rounded-full border-2 bg-white shadow transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            thumb, focus,
          ].join(' ')}
        />
      ))}
    </SliderPrimitive.Root>
  )
}
