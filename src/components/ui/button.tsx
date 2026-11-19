"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[background-color,color,box-shadow,transform,border-color] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg shadow-sm hover:brightness-110",
        secondary: "bg-surface-3 text-fg hover:bg-surface-2 border border-border",
        outline: "border border-border-strong bg-transparent text-fg hover:bg-surface-2",
        ghost: "bg-transparent text-fg hover:bg-surface-3",
        subtle: "bg-primary-soft text-primary hover:brightness-110",
        danger: "bg-red-500/90 text-white hover:bg-red-500",
        "danger-ghost": "text-red-500 hover:bg-red-500/10",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-ui",
        md: "h-9 px-4 text-sm rounded-ui",
        lg: "h-11 px-5 text-sm rounded-ui",
        icon: "size-9 rounded-ui",
        "icon-sm": "size-7 rounded-ui [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant, size, type = "button", ...props }, ref) {
  return <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
