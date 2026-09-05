import ChatPanel from "@/components/chat/ChatPanel";
import Achievements from "@/components/home/Achievements";
import ContactStrip from "@/components/home/ContactStrip";
import ExperienceLedger from "@/components/home/ExperienceLedger";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import OpenSource from "@/components/home/OpenSource";
import SectionHeading from "@/components/home/SectionHeading";
import Skills from "@/components/home/Skills";
import profile from "@/data/profile.json";
import projectsData from "@/data/projects.json";
import { FileText, Mail } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const projectCount = projectsData.projects.length;

  return (
    <div className="flex flex-col gap-20 pb-8 pt-10 sm:pt-16">
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-stretch lg:gap-12">
        <div className="flex flex-col justify-center">
          <p className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-1.5 rounded-full bg-signal" />
            Graduating June 2027, open to roles
          </p>
          <h1 className="display text-[2.6rem] sm:text-6xl">
            Prashant builds voice AI and the Go services that keep it on the
            line.
          </h1>
          <p className="measure mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Final-year computer science and AI student at IIIT Lucknow.
            Interned at Walmart Global Tech and at Zomato twice, shipping
            production voice bots, telephony microservices, and AI
            observability agents. Contributor to stdlib-js.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={profile.resume}
              target="_blank"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <FileText className="size-4" />
              Download resume
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors hover:border-signal hover:bg-signal-soft"
            >
              <Mail className="size-4" />
              Get in touch
            </Link>
          </div>
        </div>
        <ChatPanel variant="inline" className="h-[31rem] lg:h-auto lg:min-h-[31rem]" />
      </section>

      <section>
        <SectionHeading title="Experience" href="/experience" linkText="All work and education" />
        <ExperienceLedger />
      </section>

      <section className="grid gap-12 md:grid-cols-2 md:gap-10">
        <div>
          <SectionHeading title="Open source" />
          <OpenSource />
        </div>
        <div>
          <SectionHeading title="Achievements" />
          <Achievements />
        </div>
      </section>

      <section>
        <SectionHeading
          title="Selected projects"
          href="/projects"
          linkText={`All ${projectCount} projects`}
        />
        <FeaturedProjects />
      </section>

      <section>
        <SectionHeading title="Skills" />
        <Skills />
      </section>

      <ContactStrip />
    </div>
  );
}
