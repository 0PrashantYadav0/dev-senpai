"use client";

import LineHoverLink from "@/components/vui/LineHoverLink";
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
    <header className="sticky top-0 z-40 border-b border-dashed bg-background/85 backdrop-blur">
      <nav className="flex h-13 items-center justify-between px-[var(--gutter)] py-3">
        <Link
          href="/"
          className="display-md mr-3 whitespace-nowrap text-[15px] leading-[1.15] hover:text-signal sm:text-base"
        >
          Prashant Yadav
        </Link>
        <ul className="flex items-center gap-3.5 sm:gap-6">
          {navLinks.map((nav) => {
            const active = pathname === nav.href || pathname.startsWith(nav.href + "/");
            return (
              <li key={nav.href}>
                <LineHoverLink
                  href={nav.href}
                  active={active}
                  aria-current={active ? "page" : undefined}
                  className="text-[13px] sm:text-sm"
                >
                  {nav.name}
                </LineHoverLink>
              </li>
            );
          })}
          <li>
            <ThemeToggle />
          </li>
        </ul>
      </nav>
    </header>
  );
}
