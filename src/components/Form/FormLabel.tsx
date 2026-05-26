import { Label } from "@radix-ui/react-label";
import { forwardRef, type ComponentRef, type ComponentPropsWithoutRef } from "react";
import { useFormField } from "./useFormField";

type FormLabelProps = ComponentPropsWithoutRef<typeof Label> & {
  required?: boolean;
};

export const FormLabel = forwardRef<ComponentRef<typeof Label>, FormLabelProps>(
  ({ required, children, className, ...props }, ref) => {
    const { error, formItemId } = useFormField();

    return (
      <Label
        ref={ref}
        htmlFor={formItemId}
        className={[
          "text-sm font-medium",
          error ? "text-red-600" : "text-gray-700",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
    );
  },
);
FormLabel.displayName = "FormLabel";
