import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * The "slide" variant of VengeanceUI's LineHoverLink
 * (github.com/Ashutoshx7/VengeanceUI): an underline that slides in from
 * the right on hover and back out the other side. Pure CSS; the styles
 * live in globals.css under `.line-link`.
 */
type Props = ComponentProps<typeof Link> & { active?: boolean };

export default function LineHoverLink({ className, active, children, ...rest }: Props) {
  return (
    <Link
      {...rest}
      data-active={active ? "" : undefined}
      className={cn("line-link", className)}
    >
      {children}
    </Link>
  );
}
