import { Stepper } from "@mui/material";
import type { ReactNode } from "react";

interface VerticalStepperProps {
  children: ReactNode;
  className?: string;
}

export function VerticalStepper({ children, className }: VerticalStepperProps) {
  return (
    <Stepper
      orientation="vertical"
      connector={null}
      nonLinear
      sx={{ gap: 0, p: 0 }}
      className={className}
    >
      {children}
    </Stepper>
  );
}
