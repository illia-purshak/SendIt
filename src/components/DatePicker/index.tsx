import * as PopoverPrimitive from "@radix-ui/react-popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DayPicker } from "react-day-picker";
import { formatDate } from "@/i18n/utils";
import {
  calendarDayFocusRing,
  calendarNavButton,
  calendarSelectedDay,
  calendarTodayText,
  getDatePickerTriggerClasses,
  type DatePickerVariant,
} from "./variants";
import { defaultUiColor, type UiColor } from "../ui.config";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: DatePickerVariant;
  color?: UiColor;
  className?: string;
}

export function DatePicker({
  value: valueProp,
  onChange,
  placeholder,
  disabled,
  variant = "default",
  color = defaultUiColor,
  className,
}: DatePickerProps) {
  const { t } = useTranslation();
  const [internalValue, setInternalValue] = useState<Date | undefined>();
  const isControlled = valueProp !== undefined || onChange !== undefined;
  const value = isControlled ? valueProp : internalValue;

  function handleChange(date: Date | undefined) {
    if (!isControlled) setInternalValue(date);
    onChange?.(date);
  }

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        disabled={disabled}
        className={[
          "flex h-10 w-full cursor-pointer items-center gap-2 px-3 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          getDatePickerTriggerClasses(variant, color),
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <CalendarIcon size={16} className="shrink-0 text-neutral-400" />
        <span
          className={[
            "flex-1 text-left",
            value ? "text-neutral-900" : "text-neutral-400",
          ].join(" ")}
        >
          {value
            ? formatDate(value, { month: "long", day: "numeric", year: "numeric" })
            : (placeholder ?? t("common.pickDate"))}
        </span>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={[
            "z-50 rounded-lg border border-neutral-200 bg-white p-3 shadow-md",
            "data-[state=open]:animate-[dropdown-in_150ms_ease-out]",
            "data-[state=closed]:animate-[dropdown-out_100ms_ease-in]",
          ].join(" ")}
        >
          <DayPicker
            mode="single"
            selected={value}
            onSelect={handleChange}
            classNames={{
              root: "w-full",
              months: "",
              month: "space-y-2",
              month_caption: "flex items-center justify-between px-1 pb-2",
              caption_label: "text-sm font-semibold text-neutral-900",
              nav: "flex items-center gap-1",
              button_previous: calendarNavButton,
              button_next: calendarNavButton,
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday:
                "w-9 pb-1 text-center text-xs font-medium uppercase tracking-wide text-neutral-400",
              weeks: "",
              week: "flex mt-0.5",
              day: "p-0",
              day_button: "",
              selected: "",
              today: "",
              outside: "",
              disabled: "",
              hidden: "invisible",
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? (
                  <ChevronLeft size={14} />
                ) : (
                  <ChevronRight size={14} />
                ),

              DayButton: ({
                day: _day,
                modifiers,
                className: _cn,
                ...props
              }) => (
                <button
                  {...props}
                  className={[
                    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                    calendarDayFocusRing[color],
                    modifiers.selected
                      ? `font-medium ${calendarSelectedDay[color]}`
                      : modifiers.outside
                        ? "text-neutral-300 hover:bg-neutral-50"
                        : modifiers.today
                          ? `font-semibold ${calendarTodayText[color]} hover:bg-neutral-100`
                          : "text-neutral-700 hover:bg-neutral-100",
                    modifiers.disabled && "pointer-events-none opacity-40",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
              ),
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
