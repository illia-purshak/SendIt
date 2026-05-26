import { forwardRef, useId, type HTMLAttributes } from "react";
import { FormItemContext } from "./form-contexts";

export const FormItem = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        ref={ref}
        className={["flex flex-col gap-1.5", className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";
