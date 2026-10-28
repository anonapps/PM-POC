import type { ComponentPropsWithRef, ReactNode } from "react";

export type ChoiceRowProps = {
  input: ComponentPropsWithRef<"input"> & { type: "checkbox" | "radio" };
  children: ReactNode;
  labelProps?: ComponentPropsWithRef<"label">;
};

/** Native label/input composition; callers retain selection and keyboard behavior. */
export function ChoiceRow({ input, children, labelProps }: ChoiceRowProps) {
  return <label {...labelProps}><input {...input}/>{children}</label>;
}
