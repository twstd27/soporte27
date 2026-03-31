import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

function Empty({
  className,
  icon: Icon,
  title,
  description,
  children,
  ...props
}) {
  const hasShorthand = Icon || title || description

  return (
    <div
      data-slot="empty"
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center",
        className
      )}
      {...props}
    >
      {hasShorthand ? (
        <>
          {Icon && (
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Icon className="size-5 text-muted-foreground" />
            </div>
          )}
          {title && (
            <p className="text-sm font-medium tracking-tight">{title}</p>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </>
      ) : children}
    </div>
  )
}

function EmptyHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      {...props} />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function EmptyMedia({
  className,
  variant = "default",
  ...props
}) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props} />
  );
}

function EmptyTitle({
  className,
  ...props
}) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-sm font-medium tracking-tight", className)}
      {...props} />
  );
}

function EmptyDescription({
  className,
  ...props
}) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props} />
  );
}

function EmptyContent({
  className,
  ...props
}) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-2.5 text-sm text-balance",
        className
      )}
      {...props} />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}
