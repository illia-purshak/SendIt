import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/Accordion'
import { DatePicker } from '@/components/DatePicker'
import {
  Dropdown, DropdownContent, DropdownItem, DropdownLabel,
  DropdownSeparator, DropdownTrigger,
} from '@/components/Dropdown'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/AlertDialog'
import { Badge, type BadgeVariant } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Checkbox } from '@/components/Checkbox'
import { IconButton } from '@/components/IconButton'
import { Input } from '@/components/Input'
import { Link } from '@/components/Link'
import { RadioGroup, RadioItem } from '@/components/Radio'
import { Slider } from '@/components/Slider'
import { Switch } from '@/components/Switch'
import { Toggle, ToggleGroup, ToggleGroupItem } from '@/components/Toggle'
import { useToast } from '@/components/Toast/use-toast'
import { uiColors, type UiColor } from '@/components/ui.config'
import { useState } from 'react'
import { type ButtonVariant, type ButtonColor } from '@/components/Button/variants'
import { type InputVariant } from '@/components/Input/variants'
import { type IconButtonSize } from '@/components/IconButton/variants'
import {
  AlignCenter, AlignLeft, AlignRight,
  Bell, Bold, Bookmark, Heart, Italic, Plus, Search, Settings, Star, Trash2, Underline,
} from 'lucide-react'

type Swatch = { shade: string | number; hex: string }

const PALETTE: Record<string, Swatch[]> = {
  teal: [
    { shade: 950, hex: '#042f2e' },
    { shade: 800, hex: '#115e59' },
    { shade: 700, hex: '#0f766e' },
    { shade: 500, hex: '#14b8a6' },
    { shade: 300, hex: '#5eead4' },
    { shade: 100, hex: '#ccfbf1' },
    { shade: 50,  hex: '#f0fdfa' },
  ],
  neutral: [
    { shade: 900, hex: '#262626' },
    { shade: 700, hex: '#404040' },
    { shade: 600, hex: '#5A5A5A' },
    { shade: 400, hex: '#919191' },
    { shade: 300, hex: '#D6D6D6' },
    { shade: 200, hex: '#E5E5E5' },
    { shade: 100, hex: '#F5F5F5' },
    { shade: 50,  hex: '#FFFFFF' },
  ],
  info: [
    { shade: 900, hex: '#0D3A6B' },
    { shade: 600, hex: '#255C99' },
    { shade: 300, hex: '#7EA3CC' },
    { shade: 100, hex: '#D6E8F7' },
  ],
  warning: [
    { shade: 900, hex: '#7A4000' },
    { shade: 500, hex: '#FF8E1E' },
    { shade: 300, hex: '#FFBC72' },
    { shade: 100, hex: '#FFF0DC' },
  ],
  error: [
    { shade: 900, hex: '#7B1D1D' },
    { shade: 600, hex: '#C0392B' },
    { shade: 300, hex: '#E8837A' },
    { shade: 100, hex: '#FDECEA' },
  ],
  success: [
    { shade: 900, hex: '#134e4a' },
    { shade: 600, hex: '#0f766e' },
    { shade: 400, hex: '#2dd4bf' },
    { shade: 100, hex: '#ccfbf1' },
  ],
}

const TYPE_SCALE = [
  { cls: 'text-xs',   size: '12px' },
  { cls: 'text-sm',   size: '14px' },
  { cls: 'text-base', size: '16px' },
  { cls: 'text-lg',   size: '18px' },
  { cls: 'text-xl',   size: '20px' },
  { cls: 'text-2xl',  size: '24px' },
  { cls: 'text-3xl',  size: '30px' },
  { cls: 'text-4xl',  size: '36px' },
  { cls: 'text-5xl',  size: '48px' },
  { cls: 'text-6xl',  size: '60px' },
  { cls: 'text-7xl',  size: '72px' },
  { cls: 'text-8xl',  size: '96px' },
  { cls: 'text-9xl',  size: '128px' },
]

const FONT_WEIGHTS = [
  { cls: 'font-thin',       label: 'Thin',       value: '100' },
  { cls: 'font-extralight', label: 'Extra Light', value: '200' },
  { cls: 'font-light',      label: 'Light',       value: '300' },
  { cls: 'font-normal',     label: 'Normal',      value: '400' },
  { cls: 'font-medium',     label: 'Medium',      value: '500' },
  { cls: 'font-semibold',   label: 'Semibold',    value: '600' },
  { cls: 'font-bold',       label: 'Bold',        value: '700' },
  { cls: 'font-extrabold',  label: 'Extra Bold',  value: '800' },
  { cls: 'font-black',      label: 'Black',       value: '900' },
]

const BUTTON_VARIANTS: ButtonVariant[] = ['default', 'outline', 'ghost']
const BUTTON_HELPER_COLORS: ButtonColor[] = ['brown', 'pink', 'gray']
const BADGE_VARIANTS: BadgeVariant[] = ['error', 'warning', 'info', 'success', 'pink', 'brown', 'destructive']
const ICON_BUTTON_SIZES: IconButtonSize[] = ['sm', 'md', 'lg']
const INPUT_VARIANTS: InputVariant[] = ['default', 'outline', 'ghost']

const NAV_ITEMS = [
  { id: 'button',      label: 'Button' },
  { id: 'badge',       label: 'Badge' },
  { id: 'input',       label: 'Input' },
  { id: 'link',        label: 'Link' },
  { id: 'icon-button', label: 'Icon Button' },
  { id: 'toast',       label: 'Toast' },
  { id: 'checkbox',    label: 'Checkbox' },
  { id: 'radio',       label: 'Radio' },
  { id: 'switch',      label: 'Switch' },
  { id: 'slider',        label: 'Slider' },
  { id: 'toggle',        label: 'Toggle' },
  { id: 'toggle-group',  label: 'Toggle Group' },
  { id: 'accordion',     label: 'Accordion' },
  { id: 'alert-dialog',  label: 'Alert Dialog' },
  { id: 'dropdown',      label: 'Dropdown' },
  { id: 'date-picker',   label: 'Date Picker' },
  { id: 'typography',    label: 'Typography' },
  { id: 'palette',     label: 'Palette' },
]

function Sidebar() {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  return (
    <aside className="sticky top-0 h-screen w-44 shrink-0 border-r border-neutral-200 bg-white">
      <div className="p-5 pt-12">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-400">Components</p>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="rounded-md px-3 py-1.5 text-left text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="w-max rounded-xl border border-neutral-200 bg-white p-8">
      <h2 className="mb-6 text-lg font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
  )
}

function VariantLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-medium tracking-widest text-neutral-400 uppercase">{children}</p>
  )
}

function Typography() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <VariantLabel>Scale</VariantLabel>
        <div className="flex flex-col gap-1">
          {TYPE_SCALE.map(({ cls, size }) => (
            <div key={cls} className="flex items-baseline justify-between gap-12">
              <span className={`${cls} leading-tight text-neutral-900`}>
                The quick brown fox
              </span>
              <span className="shrink-0 font-mono text-xs text-neutral-400">
                {cls} / {size}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <VariantLabel>Weight</VariantLabel>
        <div className="flex flex-col gap-1">
          {FONT_WEIGHTS.map(({ cls, label, value }) => (
            <div key={cls} className="flex items-baseline justify-between gap-12">
              <span className={`${cls} text-2xl text-neutral-900`}>{label}</span>
              <span className="shrink-0 font-mono text-xs text-neutral-400">
                {cls} / {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <VariantLabel>Color</VariantLabel>
        <div className="flex flex-col gap-1">
          <span className="text-base text-neutral-900">Primary text — neutral-900</span>
          <span className="text-base text-neutral-600">Secondary text — neutral-600</span>
          <span className="text-base text-neutral-300">Disabled text — neutral-300</span>
          <span className="text-base text-teal-700">Accent text — teal-700</span>
          <span className="text-base text-error-600">Error text — error-600</span>
        </div>
      </div>
    </div>
  )
}

function Palette() {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(PALETTE).map(([family, shades]) => (
        <div key={family}>
          <p className="mb-1.5 text-xs font-medium capitalize text-neutral-600">{family}</p>
          <div className="flex gap-1.5">
            {shades.map(({ shade, hex }) => (
              <div key={shade} className="flex flex-col items-center gap-1">
                <div
                  className="h-10 w-10 rounded-md border border-black/5"
                  style={{ backgroundColor: hex }}
                  title={`${family}-${shade}: ${hex}`}
                />
                <span className="text-xs text-neutral-400">{shade}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DatePickerSection() {
  const [dates, setDates] = useState<Partial<Record<UiColor, Date | undefined>>>({})

  return (
    <Section id="date-picker" title="Date Picker">
      <div className="mb-6">
        <VariantLabel>Colors</VariantLabel>
        <div className="flex w-64 flex-col gap-3">
          {uiColors.map((color: UiColor) => (
            <DatePicker
              key={color}
              color={color}
              value={dates[color]}
              onChange={date => setDates(prev => ({ ...prev, [color]: date }))}
              placeholder={color}
            />
          ))}
        </div>
      </div>
      <div className="mb-6 border-t border-neutral-100 pt-6">
        <VariantLabel>Variants</VariantLabel>
        <div className="flex w-64 flex-col gap-3">
          {(['default', 'outline', 'ghost'] as const).map(variant => (
            <DatePicker key={variant} variant={variant} placeholder={variant} />
          ))}
        </div>
      </div>
      <div className="border-t border-neutral-100 pt-6">
        <VariantLabel>States</VariantLabel>
        <div className="flex w-64 flex-col gap-3">
          <DatePicker value={new Date()} placeholder="With value" />
          <DatePicker disabled placeholder="Disabled" />
        </div>
      </div>
    </Section>
  )
}

export function UiKitPage() {
  const { toast } = useToast()

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />

      <div className="flex-1 overflow-x-auto">
      <div className="min-w-max px-10 py-12">
      <h1 className="mb-10 text-3xl font-bold text-neutral-900">UI Kit</h1>

      <div className="flex flex-row items-start gap-6">

        <Section id="button" title="Button">
          {BUTTON_VARIANTS.map(variant => (
            <div key={variant} className="mb-6 last:mb-0">
              <VariantLabel>{variant}</VariantLabel>
              <div className="flex flex-wrap gap-2">
                {uiColors.map((color: UiColor) => (
                  <Button key={color} variant={variant} color={color}>{color}</Button>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-6 border-t border-neutral-100 pt-6">
            <VariantLabel>Helper colors</VariantLabel>
            <div className="flex flex-col gap-3">
              {BUTTON_VARIANTS.map(variant => (
                <div key={variant} className="flex flex-wrap gap-2">
                  {BUTTON_HELPER_COLORS.map(color => (
                    <Button key={color} variant={variant} color={color}>{color}</Button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 border-t border-neutral-100 pt-6">
            <VariantLabel>Sizes</VariantLabel>
            <div className="flex items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
          <div className="mt-6">
            <VariantLabel>Disabled</VariantLabel>
            <div className="flex gap-2">
              <Button variant="default" disabled>Default</Button>
              <Button variant="outline" disabled>Outline</Button>
              <Button variant="ghost" disabled>Ghost</Button>
            </div>
          </div>
        </Section>

        <Section id="badge" title="Badge">
          <div className="mb-6">
            <VariantLabel>Small (solid)</VariantLabel>
            <div className="flex flex-wrap gap-2">
              {BADGE_VARIANTS.map(variant => (
                <Badge key={variant} variant={variant} size="sm">{variant}</Badge>
              ))}
            </div>
          </div>
          <div>
            <VariantLabel>Medium (outline)</VariantLabel>
            <div className="flex flex-wrap gap-2">
              {BADGE_VARIANTS.map(variant => (
                <Badge key={variant} variant={variant} size="md">{variant}</Badge>
              ))}
            </div>
          </div>
        </Section>

        <Section id="input" title="Input">
          {INPUT_VARIANTS.map(variant => (
            <div key={variant} className="mb-6 last:mb-0">
              <VariantLabel>{variant}</VariantLabel>
              <div className="flex flex-col gap-3">
                {uiColors.map((color: UiColor) => (
                  <Input key={color} variant={variant} color={color} placeholder={color} />
                ))}
              </div>
            </div>
          ))}
          <div className="mt-6 border-t border-neutral-100 pt-6">
            <VariantLabel>States</VariantLabel>
            <div className="flex flex-col gap-3">
              <Input label="With label" placeholder="Enter value" />
              <Input placeholder="Error" error="This field is required." />
              <Input placeholder="Disabled" disabled />
            </div>
          </div>
        </Section>

        <Section id="link" title="Link">
          <div className="mb-6">
            <VariantLabel>Variants</VariantLabel>
            <div className="flex flex-col gap-3">
              <Link href="/ui-kit">Internal — default</Link>
              <Link href="https://radix-ui.com">External — default</Link>
              <Link href="https://tailwindcss.com" variant="muted">Muted</Link>
              <Link href="/ui-kit" variant="nav">Nav</Link>
            </div>
          </div>
          <div>
            <VariantLabel>Explicit override</VariantLabel>
            <div className="flex flex-col gap-3">
              <Link href="/ui-kit" external>Internal forced external</Link>
              <Link href="https://radix-ui.com" external={false}>External forced internal</Link>
            </div>
          </div>
        </Section>

        <Section id="icon-button" title="Icon Button">
          {BUTTON_VARIANTS.map(variant => (
            <div key={variant} className="mb-6 last:mb-0">
              <VariantLabel>{variant}</VariantLabel>
              <div className="flex flex-wrap gap-2">
                {uiColors.map((color: UiColor, i) => {
                  const Icon = [Bell, Bookmark, Heart, Plus, Search, Settings][i % 6]
                  return (
                    <IconButton key={color} variant={variant} color={color} aria-label={color}>
                      <Icon size={16} />
                    </IconButton>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="mt-6 border-t border-neutral-100 pt-6">
            <VariantLabel>Sizes</VariantLabel>
            <div className="flex items-center gap-2">
              {ICON_BUTTON_SIZES.map(size => (
                <IconButton key={size} size={size} aria-label={size}>
                  <Star size={size === 'sm' ? 14 : size === 'md' ? 16 : 20} />
                </IconButton>
              ))}
            </div>
          </div>
          <div className="mt-6">
            <VariantLabel>Disabled</VariantLabel>
            <div className="flex gap-2">
              <IconButton variant="default" aria-label="default disabled" disabled><Trash2 size={16} /></IconButton>
              <IconButton variant="outline" aria-label="outline disabled" disabled><Trash2 size={16} /></IconButton>
              <IconButton variant="ghost" aria-label="ghost disabled" disabled><Trash2 size={16} /></IconButton>
            </div>
          </div>
        </Section>

        <Section id="toast" title="Toast">
          <div className="mb-6">
            <VariantLabel>Colors</VariantLabel>
            <div className="flex flex-wrap gap-2">
              {uiColors.map((color: UiColor) => (
                <Button
                  key={color}
                  variant="outline"
                  color={color}
                  onClick={() => toast({ title: color.charAt(0).toUpperCase() + color.slice(1), color })}
                >
                  {color}
                </Button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <VariantLabel>With description</VariantLabel>
            <Button
              variant="outline"
              color="info"
              onClick={() => toast({
                title: 'Update available',
                description: 'Version 2.0 is ready to install.',
                color: 'info',
              })}
            >
              Show
            </Button>
          </div>
          <div>
            <VariantLabel>With action</VariantLabel>
            <Button
              variant="outline"
              color="error"
              onClick={() => toast({
                title: 'File deleted',
                description: 'report-2024.pdf was removed.',
                color: 'error',
                action: { label: 'Undo', onClick: () => {} },
              })}
            >
              Show
            </Button>
          </div>
        </Section>

        <Section id="checkbox" title="Checkbox">
          <div className="mb-6">
            <VariantLabel>Colors</VariantLabel>
            <div className="flex flex-col gap-3">
              {uiColors.map((color: UiColor) => (
                <Checkbox key={color} color={color} label={color} defaultChecked />
              ))}
            </div>
          </div>
          <div className="mb-6 border-t border-neutral-100 pt-6">
            <VariantLabel>Sizes</VariantLabel>
            <div className="flex items-center gap-6">
              <Checkbox size="sm" label="Small" defaultChecked />
              <Checkbox size="md" label="Medium" defaultChecked />
              <Checkbox size="lg" label="Large" defaultChecked />
            </div>
          </div>
          <div>
            <VariantLabel>States</VariantLabel>
            <div className="flex flex-col gap-3">
              <Checkbox label="Unchecked" />
              <Checkbox label="Checked" defaultChecked />
              <Checkbox label="Disabled" disabled />
              <Checkbox label="Checked + disabled" defaultChecked disabled />
            </div>
          </div>
        </Section>

        <Section id="radio" title="Radio">
          <div className="mb-6">
            <VariantLabel>Colors</VariantLabel>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {uiColors.map((color: UiColor) => (
                <div key={color}>
                  <p className="mb-2 text-xs capitalize text-neutral-400">{color}</p>
                  <RadioGroup defaultValue="a" color={color}>
                    <RadioItem value="a" label="Option A" />
                    <RadioItem value="b" label="Option B" />
                  </RadioGroup>
                </div>
              ))}
            </div>
          </div>
          <div>
            <VariantLabel>States</VariantLabel>
            <RadioGroup defaultValue="a">
              <RadioItem value="a" label="Selected" />
              <RadioItem value="b" label="Unselected" />
              <RadioItem value="c" label="Disabled" disabled />
            </RadioGroup>
          </div>
        </Section>

        <Section id="switch" title="Switch">
          <div className="mb-6">
            <VariantLabel>Colors</VariantLabel>
            <div className="flex flex-col gap-3">
              {uiColors.map((color: UiColor) => (
                <Switch key={color} color={color} label={color} defaultChecked />
              ))}
            </div>
          </div>
          <div className="mb-6 border-t border-neutral-100 pt-6">
            <VariantLabel>Sizes</VariantLabel>
            <div className="flex flex-col gap-3">
              <Switch size="sm" label="Small" defaultChecked />
              <Switch size="md" label="Medium" defaultChecked />
              <Switch size="lg" label="Large" defaultChecked />
            </div>
          </div>
          <div>
            <VariantLabel>States</VariantLabel>
            <div className="flex flex-col gap-3">
              <Switch label="Off" />
              <Switch label="On" defaultChecked />
              <Switch label="Disabled" disabled />
            </div>
          </div>
        </Section>

        <Section id="slider" title="Slider">
          <div className="mb-6">
            <VariantLabel>Colors</VariantLabel>
            <div className="flex w-56 flex-col gap-5">
              {uiColors.map((color: UiColor) => (
                <Slider key={color} color={color} defaultValue={[50]} />
              ))}
            </div>
          </div>
          <div>
            <VariantLabel>States</VariantLabel>
            <div className="flex w-56 flex-col gap-5">
              <Slider defaultValue={[30]} />
              <Slider defaultValue={[60]} disabled />
            </div>
          </div>
        </Section>

        <Section id="toggle" title="Toggle">
          {BUTTON_VARIANTS.map(variant => (
            <div key={variant} className="mb-6 last:mb-0">
              <VariantLabel>{variant}</VariantLabel>
              <div className="flex flex-wrap gap-2">
                {uiColors.map((color: UiColor) => (
                  <Toggle key={color} variant={variant} color={color}>{color}</Toggle>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-6 border-t border-neutral-100 pt-6">
            <VariantLabel>Sizes</VariantLabel>
            <div className="flex items-center gap-2">
              <Toggle size="sm">Small</Toggle>
              <Toggle size="md">Medium</Toggle>
              <Toggle size="lg">Large</Toggle>
            </div>
          </div>
          <div className="mt-6">
            <VariantLabel>Disabled</VariantLabel>
            <div className="flex gap-2">
              <Toggle variant="default" disabled>Default</Toggle>
              <Toggle variant="outline" disabled>Outline</Toggle>
              <Toggle variant="ghost" disabled>Ghost</Toggle>
            </div>
          </div>
        </Section>

        <Section id="toggle-group" title="Toggle Group">
          {BUTTON_VARIANTS.map(variant => (
            <div key={variant} className="mb-6 last:mb-0">
              <VariantLabel>{variant}</VariantLabel>
              <div className="flex flex-col gap-3">
                <ToggleGroup type="single" defaultValue="b" variant={variant}>
                  <ToggleGroupItem value="a"><Bold size={15} /></ToggleGroupItem>
                  <ToggleGroupItem value="b"><Italic size={15} /></ToggleGroupItem>
                  <ToggleGroupItem value="c"><Underline size={15} /></ToggleGroupItem>
                </ToggleGroup>
                <ToggleGroup type="multiple" defaultValue={['a', 'c']} variant={variant}>
                  <ToggleGroupItem value="a"><AlignLeft size={15} /></ToggleGroupItem>
                  <ToggleGroupItem value="b"><AlignCenter size={15} /></ToggleGroupItem>
                  <ToggleGroupItem value="c"><AlignRight size={15} /></ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          ))}
          <div className="mt-6 border-t border-neutral-100 pt-6">
            <VariantLabel>Colors</VariantLabel>
            <div className="flex flex-col gap-3">
              {uiColors.map((color: UiColor) => (
                <ToggleGroup key={color} type="single" defaultValue="a" variant="outline" color={color}>
                  <ToggleGroupItem value="a"><Bold size={15} /></ToggleGroupItem>
                  <ToggleGroupItem value="b"><Italic size={15} /></ToggleGroupItem>
                  <ToggleGroupItem value="c"><Underline size={15} /></ToggleGroupItem>
                </ToggleGroup>
              ))}
            </div>
          </div>
        </Section>

        <Section id="accordion" title="Accordion">
          {(['default', 'outline', 'ghost'] as const).map(variant => (
            <div key={variant} className="mb-6 last:mb-0">
              <VariantLabel>{variant}</VariantLabel>
              <Accordion type="single" collapsible variant={variant} className="w-72">
                <AccordionItem value="a">
                  <AccordionTrigger>What is SendIt?</AccordionTrigger>
                  <AccordionContent>A modern shipping platform built for speed and reliability.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="b">
                  <AccordionTrigger>How does it work?</AccordionTrigger>
                  <AccordionContent>Connect your store, set your rates, and start shipping in minutes.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="c">
                  <AccordionTrigger>Pricing</AccordionTrigger>
                  <AccordionContent>Plans start at $0. Pay only for what you ship.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ))}
          <div className="border-t border-neutral-100 pt-6">
            <VariantLabel>Colors</VariantLabel>
            <div className="flex flex-col gap-4">
              {uiColors.map((color: UiColor) => (
                <Accordion key={color} type="single" collapsible variant="outline" color={color} className="w-72">
                  <AccordionItem value="a">
                    <AccordionTrigger>{color}</AccordionTrigger>
                    <AccordionContent>This accordion uses the {color} color token.</AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}
            </div>
          </div>
        </Section>

        <Section id="alert-dialog" title="Alert Dialog">
          <div className="mb-6">
            <VariantLabel>Colors</VariantLabel>
            <div className="flex flex-wrap gap-2">
              {uiColors.map((color: UiColor) => (
                <AlertDialog key={color} color={color}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" color={color}>{color}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your data.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ))}
            </div>
          </div>
          <div>
            <VariantLabel>Examples</VariantLabel>
            <div className="flex flex-wrap gap-2">
              <AlertDialog color="error">
                <AlertDialogTrigger asChild>
                  <Button variant="default" color="error">Delete account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Delete account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and remove all associated data. This action cannot be undone.
                  </AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog color="warning">
                <AlertDialogTrigger asChild>
                  <Button variant="outline" color="warning">Discard changes</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have unsaved changes. Leaving now will discard all your progress.
                  </AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep editing</AlertDialogCancel>
                    <AlertDialogAction>Discard</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog color="success">
                <AlertDialogTrigger asChild>
                  <Button variant="outline" color="success">Publish</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Publish post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your post will be visible to all users once published.
                  </AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Not yet</AlertDialogCancel>
                    <AlertDialogAction>Publish</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Section>

        <DatePickerSection />

        <Section id="dropdown" title="Dropdown">
          <div className="mb-6">
            <VariantLabel>Colors</VariantLabel>
            <div className="flex flex-wrap gap-2">
              {uiColors.map((color: UiColor) => (
                <Dropdown key={color} color={color}>
                  <DropdownTrigger>{color}</DropdownTrigger>
                  <DropdownContent>
                    <DropdownItem>Profile</DropdownItem>
                    <DropdownItem>Settings</DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem>Log out</DropdownItem>
                  </DropdownContent>
                </Dropdown>
              ))}
            </div>
          </div>
          <div className="mb-6 border-t border-neutral-100 pt-6">
            <VariantLabel>Variants</VariantLabel>
            <div className="flex items-center gap-2">
              {(['default', 'outline', 'ghost'] as const).map(variant => (
                <Dropdown key={variant}>
                  <DropdownTrigger variant={variant}>{variant}</DropdownTrigger>
                  <DropdownContent>
                    <DropdownItem>Profile</DropdownItem>
                    <DropdownItem>Settings</DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem>Log out</DropdownItem>
                  </DropdownContent>
                </Dropdown>
              ))}
            </div>
          </div>
          <div className="mb-6 border-t border-neutral-100 pt-6">
            <VariantLabel>With label &amp; icons</VariantLabel>
            <Dropdown>
              <DropdownTrigger>Options</DropdownTrigger>
              <DropdownContent>
                <DropdownLabel>Account</DropdownLabel>
                <DropdownItem><Settings size={14} />Settings</DropdownItem>
                <DropdownItem><Bell size={14} />Notifications</DropdownItem>
                <DropdownSeparator />
                <DropdownLabel>Actions</DropdownLabel>
                <DropdownItem><Star size={14} />Bookmark</DropdownItem>
                <DropdownItem disabled><Trash2 size={14} />Delete</DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
          <div className="border-t border-neutral-100 pt-6">
            <VariantLabel>Disabled trigger</VariantLabel>
            <Dropdown>
              <DropdownTrigger disabled>Disabled</DropdownTrigger>
              <DropdownContent>
                <DropdownItem>Unreachable</DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </Section>

        <Section id="typography" title="Typography">
          <Typography />
        </Section>

        <Section id="palette" title="Palette">
          <Palette />
        </Section>

      </div>
      </div>
      </div>
    </div>
  )
}
