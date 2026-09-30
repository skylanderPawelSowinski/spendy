import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // `sheen` zamiast `animate-pulse`: przesuwające się światło czyta się
      // jako „trwa pobieranie", a miganie całego bloku — jako usterka.
      className={cn("sheen bg-skeleton rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
