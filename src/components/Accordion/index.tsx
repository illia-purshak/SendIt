import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { createContext, useContext, type ComponentPropsWithoutRef } from 'react'
import {
  accordionContentVariants,
  accordionItemVariants,
  accordionTriggerColors,
  accordionTriggerVariants,
  type AccordionVariant,
} from './variants'
import { defaultUiColor, type UiColor } from '../ui.config'

interface AccordionCtxValue {
  color: UiColor
  variant: AccordionVariant
}

const AccordionCtx = createContext<AccordionCtxValue>({
  color: defaultUiColor,
  variant: 'default',
})

// ─── Accordion ───────────────────────────────────────────────────────────────

type AccordionProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & {
  color?: UiColor
  variant?: AccordionVariant
}

export function Accordion({
  color = defaultUiColor,
  variant = 'default',
  className,
  ...props
}: AccordionProps) {
  return (
    <AccordionCtx.Provider value={{ color, variant }}>
      <AccordionPrimitive.Root
        className={['w-full', className].filter(Boolean).join(' ')}
        {...props}
      />
    </AccordionCtx.Provider>
  )
}

// ─── AccordionItem ────────────────────────────────────────────────────────────

export function AccordionItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
  const { variant } = useContext(AccordionCtx)
  return (
    <AccordionPrimitive.Item
      className={[accordionItemVariants[variant], className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

// ─── AccordionTrigger ─────────────────────────────────────────────────────────

export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) {
  const { color, variant } = useContext(AccordionCtx)
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={[
          'flex flex-1 cursor-pointer items-center justify-between text-sm font-medium text-neutral-900 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-300',
          '[&[data-state=open]>svg]:rotate-180',
          accordionTriggerVariants[variant],
          accordionTriggerColors[color],
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
        <ChevronDown size={16} className="shrink-0 text-neutral-400 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

// ─── AccordionContent ─────────────────────────────────────────────────────────

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) {
  const { variant } = useContext(AccordionCtx)
  return (
    <AccordionPrimitive.Content
      className={[
        'overflow-hidden text-sm text-neutral-600',
        'data-[state=open]:animate-[accordion-down_200ms_ease-out]',
        'data-[state=closed]:animate-[accordion-up_180ms_ease-in]',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      <div className={accordionContentVariants[variant]}>{children}</div>
    </AccordionPrimitive.Content>
  )
}
