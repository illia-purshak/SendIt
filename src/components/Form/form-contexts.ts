import { createContext, useContext } from "react";

export interface FormFieldContextValue {
  name: string;
}

export const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

export function useFormFieldContext() {
  return useContext(FormFieldContext);
}

export interface FormItemContextValue {
  id: string;
}

export const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

export function useFormItemContext() {
  return useContext(FormItemContext);
}
