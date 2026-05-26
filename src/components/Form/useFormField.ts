import { useFormContext } from "react-hook-form";
import { useFormFieldContext, useFormItemContext } from "./form-contexts";

export function useFormField() {
  const { name } = useFormFieldContext();
  const { id } = useFormItemContext();
  const { getFieldState, formState } = useFormContext();

  if (!id) {
    throw new Error("useFormField should be used within <FormItem>");
  }

  const fieldState = getFieldState(name, formState);

  return {
    id,
    name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    error: fieldState.error,
  };
}
