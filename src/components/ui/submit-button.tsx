"use client";

import { useFormStatus } from "react-dom";
import { Button, type buttonVariants } from "@/components/ui/button";
import type { ComponentProps } from "react";
import type { VariantProps } from "class-variance-authority";

export function SubmitButton({
  children,
  pendingText = "Enviando…",
  ...props
}: ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants> & { pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
