import { forwardRef, type HTMLAttributes } from "react";
import { useFormField } from "./useFormField";

export const FormDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={["text-xs text-neutral-500", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";
