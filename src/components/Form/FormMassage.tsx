import { forwardRef, type HTMLAttributes } from "react";
import { useFormField } from "./useFormField";

export const FormMessage = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error?.message ?? children;
  if (!body) return null;

  return (
    <p
      ref={ref}
      id={formMessageId}
      role="alert"
      className={["text-xs text-red-500", className].filter(Boolean).join(" ")}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";
