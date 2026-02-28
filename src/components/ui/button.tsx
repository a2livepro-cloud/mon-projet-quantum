import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quantum-accent focus-visible:ring-offset-2 focus-visible:ring-offset-quantum-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-quantum-accent text-white hover:bg-blue-600",
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
        secondary:
          "bg-quantum-surface text-slate-200 hover:bg-quantum-surface/80 border border-white/10",
        outline:
          "border border-quantum-accent/50 bg-transparent hover:bg-quantum-accent/10 text-quantum-accent",
        ghost: "hover:bg-quantum-surface hover:text-slate-100",
        link: "text-quantum-accent underline-offset-4 hover:underline",
        gold: "bg-quantum-gold text-quantum-bg hover:bg-amber-500",
        cyan: "bg-quantum-cyan text-quantum-bg hover:bg-cyan-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
