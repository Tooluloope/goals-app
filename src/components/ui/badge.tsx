import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Area variants
        faith: "border-transparent bg-violet-100 text-violet-700",
        family: "border-transparent bg-pink-100 text-pink-700",
        learning: "border-transparent bg-sky-100 text-sky-700",
        career: "border-transparent bg-emerald-100 text-emerald-700",
        finance: "border-transparent bg-amber-100 text-amber-700",
        health: "border-transparent bg-red-100 text-red-700",
        personal: "border-transparent bg-purple-100 text-purple-700",
        business: "border-transparent bg-blue-100 text-blue-700",
        // Priority variants
        high: "border-transparent bg-red-50 text-red-600",
        medium: "border-transparent bg-amber-50 text-amber-600",
        low: "border-transparent bg-slate-100 text-slate-600",
        // Status variants
        todo: "border-transparent bg-slate-100 text-slate-700",
        doing: "border-transparent bg-blue-100 text-blue-700",
        done: "border-transparent bg-emerald-100 text-emerald-700",
        failed: "border-transparent bg-red-100 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
