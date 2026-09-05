import profile from "@/data/profile.json";
import Link from "next/link";
import Socials from "./Socials";

export default function Footer() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto flex w-full max-w-site flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-col gap-1 text-sm">
          <a href={`mailto:${profile.email}`} className="link w-fit">
            {profile.email}
          </a>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Prashant Kumar Yadav.{" "}
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
