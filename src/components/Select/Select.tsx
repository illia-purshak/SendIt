import * as SelectPrimitive from "@radix-ui/react-select";
import { Label } from "@radix-ui/react-label";
import { Check, ChevronDown } from "lucide-react";
import { useId, type ComponentPropsWithoutRef } from "react";
import {
  getSelectTriggerClasses,
  selectItemHighlight,
  type SelectVariant,
} from "./variants";
import { defaultUiColor, type UiColor } from "../ui.config";

const EMPTY_OPTION_VALUE = "__empty__";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<
  ComponentPropsWithoutRef<typeof SelectPrimitive.Root>,
  "children"
> {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  variant?: SelectVariant;
  color?: UiColor;
  className?: string;
}

export function Select({
  options,
  placeholder = "Select…",
  label,
  error,
  variant = "default",
  color = defaultUiColor,
  className,
  disabled,
  ...props
}: SelectProps) {
  const id = useId();
  const normalizedValue =
    typeof props.value === "string" && props.value === "" ? EMPTY_OPTION_VALUE : props.value;

  function handleValueChange(value: string) {
    props.onValueChange?.(value === EMPTY_OPTION_VALUE ? "" : value);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
        </Label>
      )}

      <SelectPrimitive.Root
        {...props}
        disabled={disabled}
        value={normalizedValue}
        onValueChange={handleValueChange}
      >
        <SelectPrimitive.Trigger
          id={id}
          className={[
            "flex h-9 w-full cursor-pointer items-center justify-between text-sm outline-none transition-colors",
            variant !== "ghost" ? "rounded-md px-3" : "px-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "data-placeholder:text-neutral-400",
            getSelectTriggerClasses(variant, color, !!error),
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown
              size={14}
              className="shrink-0 opacity-60 transition-transform duration-200 in-data-[state=open]:rotate-180"
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className="z-50 min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-md data-[state=open]:animate-[dropdown-in_150ms_ease-out] data-[state=closed]:animate-[dropdown-out_100ms_ease-in]"
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value === "" ? EMPTY_OPTION_VALUE : opt.value}
                  disabled={opt.disabled}
                  className={[
                    "relative flex cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-8 text-sm text-neutral-700 outline-none",
                    "data-disabled:pointer-events-none data-disabled:opacity-40",
                    selectItemHighlight[color],
                  ].join(" ")}
                >
                  <SelectPrimitive.ItemText>
                    {opt.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2.5">
                    <Check size={14} />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
