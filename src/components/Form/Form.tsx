import type { ComponentPropsWithoutRef } from "react";

export function Form({ className, ...props }: ComponentPropsWithoutRef<"form">) {
  return (
    <form
      className={["flex flex-col gap-6", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
