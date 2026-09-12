import profile from "@/data/profile.json";
import Link from "next/link";
import Socials from "./Socials";

export default function Footer() {
  return (
    <footer className="border-t border-dashed">
      <div className="flex flex-col gap-6 px-[var(--gutter)] py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 text-sm">
          <a href={`mailto:${profile.email}`} className="link w-fit">
            {profile.email}
          </a>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Prashant Kumar Yadav. Built by
            hand, fuelled by instant coffee.{" "}
            <Link href="/privacy" className="link">
              Privacy
            </Link>
          </p>
        </div>
        <Socials />
      </div>
    </footer>
  );
}
