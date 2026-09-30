import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // `shimmer` zamiast `animate-pulse`: przesuwające się światło czyta się
      // jako „trwa pobieranie", a miganie całego bloku — jako usterka.
      className={cn("shimmer rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
