import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  /* `rounded-full` on the base rather than per-size: a pill is the shape of every
     control in this design, and a square-cornered one reads as a foreign widget.
     `active:translate-y-px` is the whole press animation — a control that gives
     slightly under the cursor feels friendlier than one that only changes
     colour, and it costs a single class. */
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold outline-none transition-[color,background-color,border-color,box-shadow,translate] active:translate-y-px focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* The one primary action on a view: solid brand over the warm paper. */
        default: "shadow-soft bg-primary text-primary-foreground hover:bg-brand-hover",
        /* Its partner, for the action beside the primary one. Filled rather than
           outlined — an outline next to a solid pill reads as disabled. */
        secondary: "bg-secondary text-secondary-foreground hover:bg-border",
        outline: "border border-input bg-card hover:bg-secondary",
        destructive: "shadow-soft bg-destructive text-destructive-foreground hover:brightness-95",
        ghost: "hover:bg-secondary",
        link: "text-brand-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
