import { cn } from "@/lib/utils";

/**
 * Reusable skeleton component for loading states.
 * Renders an animated pulse placeholder matching content layout.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Skeleton for a text line.
 * Default height matches body text (h-4), customizable width.
 */
export function SkeletonLine({
  className,
  width,
}: {
  className?: string;
  width?: string;
}) {
  return (
    <Skeleton
      className={cn("h-4 rounded", className)}
      style={width ? { width } : undefined}
    />
  );
}

/**
 * Skeleton for a circular avatar/logo placeholder.
 */
export function SkeletonCircle({
  className,
  size = "h-10 w-10",
}: {
  className?: string;
  size?: string;
}) {
  return <Skeleton className={cn("rounded-full", size, className)} />;
}

/**
 * Skeleton for an image/card thumbnail area.
 */
export function SkeletonImage({
  className,
  aspectRatio = "aspect-video",
}: {
  className?: string;
  aspectRatio?: string;
}) {
  return <Skeleton className={cn(aspectRatio, "w-full rounded-lg", className)} />;
}

/**
 * Skeleton for a card — image area + text lines below.
 */
export function SkeletonCard({
  className,
  lines = 3,
  hasImage = true,
  imageAspectRatio = "aspect-video",
}: {
  className?: string;
  lines?: number;
  hasImage?: boolean;
  imageAspectRatio?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {hasImage && <SkeletonImage aspectRatio={imageAspectRatio} />}
      <div className="space-y-2 px-1">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            className={i === lines - 1 ? "w-2/3" : "w-full"}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for a stats/metric box — big number + label below.
 */
export function SkeletonStat({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-8 w-20 rounded" />
      <Skeleton className="h-3 w-14 rounded" />
    </div>
  );
}

/**
 * Skeleton for a table row — multiple cells in a row.
 */
export function SkeletonTableRow({
  className,
  cells = 5,
}: {
  className?: string;
  cells?: number;
}) {
  return (
    <div className={cn("flex gap-4 py-3", className)}>
      {Array.from({ length: cells }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4 rounded"
          style={{ flex: i === 0 ? "2" : "1" }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for a filter/sidebar section — title + option lines.
 */
export function SkeletonFilterSection({
  className,
  options = 4,
}: {
  className?: string;
  options?: number;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-4 w-24 rounded" />
      <div className="space-y-2">
        {Array.from({ length: options }).map((_, i) => (
          <Skeleton key={i} className="h-3 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    </div>
  );
}
