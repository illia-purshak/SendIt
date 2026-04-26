import { Step, StepContent, StepLabel } from "@mui/material";
import { User } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/Form/FormField";
import { FormItem } from "@/components/Form/FormItem";
import { FormLabel } from "@/components/Form/FormLabel";
import { Input } from "@/components/Input";
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

export function SenderForm() {
  const { control } = useFormContext<ParcelTemplateFormValues>();

  return (
    <Step expanded>
      <StepLabel sx={STEP_LABEL_SX}>
        <span className="inline-flex items-center gap-2">
          <User size={14} strokeWidth={2} />
          <span>Sender</span>
        </span>
      </StepLabel>
      <StepContent sx={STEP_CONTENT_SX}>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={control}
              name="senderName"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel required>Name</FormLabel>
                  <Input
                    placeholder="John Doe"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    color="green"
                    error={fieldState.error?.message}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="senderPhone"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel required>Phone</FormLabel>
                  <Input
                    placeholder="+380501234567"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    color="green"
                    error={fieldState.error?.message}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="senderCity"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel required>City</FormLabel>
                  <Input
                    placeholder="Kyiv"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    color="green"
                    error={fieldState.error?.message}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="senderAddress"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel required>Address</FormLabel>
                  <Input
                    placeholder="1 Main St"
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
        </div>
      </StepContent>
    </Step>
  );
}
