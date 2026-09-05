"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { name: "Work", href: "/experience" },
  { name: "Projects", href: "/projects" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-site items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="text-[15px] font-medium tracking-tight hover:text-signal"
        >
          Prashant Yadav
        </Link>
        <ul className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((nav) => {
            const active = pathname === nav.href || pathname.startsWith(nav.href + "/");
            return (
              <li key={nav.href}>
                <Link
                  href={nav.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 items-center rounded-md px-2.5 text-sm transition-colors sm:px-3",
                    active
                      ? "text-foreground underline decoration-signal decoration-2 underline-offset-[10px]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {nav.name}
                </Link>
              </li>
            );
          })}
          <li className="ml-1">
            <ThemeToggle />
          </li>
        </ul>
      </nav>
    </header>
  );
}
