import { Step, StepContent, StepLabel } from "@mui/material";
import { FileText } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/Checkbox";
import { FormField } from "@/components/Form/FormField";
import { FormItem } from "@/components/Form/FormItem";
import { FormLabel } from "@/components/Form/FormLabel";
import { Input } from "@/components/Input";
import { RadioGroup, RadioItem } from "@/components/Radio";
import type { PayerType } from "@/types/parcel-templates";
import type { ParcelTemplateFormValues } from "@/validation/parcel-template";

const STEP_LABEL_SX = {
  px: 0,
  py: 0,
  "& .MuiStepLabel-iconContainer": { display: "none" },
  "& .MuiStepLabel-label": {
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#a3a3a3",
  },
} as const;

const STEP_CONTENT_SX = {
  borderLeft: "1px solid #e5e5e5",
  ml: "0px",
  pl: "10px",
  pb: "24px",
  pt: "12px",
} as const;

export function GeneralForm() {
  const { control } = useFormContext<ParcelTemplateFormValues>();

  return (
    <Step expanded>
      <StepLabel sx={STEP_LABEL_SX}>
        <span className="inline-flex items-center gap-2">
          <FileText size={14} strokeWidth={2} />
          <span>General</span>
        </span>
      </StepLabel>
      <StepContent sx={STEP_CONTENT_SX}>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel required>Template name</FormLabel>
                    <Input
                      placeholder="My home address"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      color="green"
                      error={fieldState.error?.message}
                    />
                  </FormItem>
                )}
              />
            </div>
            <div className="sm:col-span-2">
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <Input
                      placeholder="Used for weekly office deliveries"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      color="green"
                    />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="mt-4">
            <FormField
              control={control}
              name="payerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payer type</FormLabel>
                  <RadioGroup
                    color="green"
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as PayerType)}
                    className="flex-row flex-wrap gap-x-6 gap-y-2"
                  >
                    <RadioItem value="SENDER" label="Sender" />
                    <RadioItem value="RECEIVER" label="Receiver" />
                    <RadioItem value="THIRD_PARTY" label="Third party" />
                  </RadioGroup>
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <FormField
              control={control}
              name="isDefault"
              render={({ field }) => (
                <Checkbox
                  color="green"
                  label="Set as default template"
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
              )}
            />
          </div>
        </div>
      </StepContent>
    </Step>
  );
}
