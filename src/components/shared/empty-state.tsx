import { Files, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon = Files,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-xl border border-border/80 bg-muted/40 text-muted-foreground">
        <Icon className="size-6" strokeWidth={1.5} />
      </div>
      <h2 className="text-base font-medium tracking-tight">{title}</h2>
      {description && (
        <div className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
          {description}
        </div>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
