import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../layout/Sidebar'; // reusing the generic merge function

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
  {
    variants: {
      variant: {
        ALLOW: "bg-success/10 text-success border border-success/20",
        WARN: "bg-warning/10 text-warning border border-warning/30",
        BLOCK: "bg-danger/10 text-danger border border-danger/30",
        gray: "bg-muted/10 text-muted border border-muted/30",
        primary: "bg-primary-brand/10 text-primary-brand border border-primary-brand/30"
      },
    },
    defaultVariants: {
      variant: "gray",
    },
  }
);

interface ActionBadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function ActionBadge({ className, variant, ...props }: ActionBadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
