import ContactForm from "@/components/ContactForm";
import Socials from "@/components/Socials";
import profile from "@/data/profile.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send Prashant a message about a role, a project, or anything else.",
};

export default function ContactPage() {
  return (
    <div className="grid gap-12 pb-8 pt-10 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
      <header>
        <h1 className="display text-4xl sm:text-5xl">Contact</h1>
        <p className="measure mt-4 text-muted-foreground sm:text-lg">
          For roles, collaborations, or questions about anything on this site.
          Messages go straight to his inbox.
        </p>
        <dl className="mt-8 flex flex-col gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd>
              <a href={`mailto:${profile.email}`} className="link">
                {profile.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Based in</dt>
            <dd>{profile.location}</dd>
          </div>
          <div>
            <dt className="mb-1 text-muted-foreground">Elsewhere</dt>
            <dd>
              <Socials className="-ml-2 flex items-center gap-1" />
            </dd>
          </div>
        </dl>
      </header>
      <ContactForm />
    </div>
  );
}
