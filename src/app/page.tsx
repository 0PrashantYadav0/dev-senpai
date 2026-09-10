import Achievements from "@/components/home/Achievements";
import AsciiDonut from "@/components/home/AsciiDonut";
import ContactStrip from "@/components/home/ContactStrip";
import ExperienceLedger from "@/components/home/ExperienceLedger";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import OpenSource from "@/components/home/OpenSource";
import SectionHeading from "@/components/home/SectionHeading";
import Skills from "@/components/home/Skills";
import StackStrip from "@/components/home/StackStrip";
import profile from "@/data/profile.json";
import projectsData from "@/data/projects.json";
import { getMergedStdlibPrCount } from "@/lib/github";
import { FileText, Mail } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const projectCount = projectsData.projects.length;
  const { count: prCount } = await getMergedStdlibPrCount();

  return (
    <div className="flex flex-col gap-20 pb-8 pt-10 sm:pt-16">
      <section className="flex flex-col gap-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-14">
          <div>
            <h1 className="display text-[2.6rem] sm:text-6xl">
              hi, prashant here{" "}
              <span aria-hidden className="inline-block">
                👋
              </span>
            </h1>
            <p className="measure mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {new Date().getFullYear() - profile.birthYear - 1}-year-old
              software developer from India. I like building complex systems,
              instant coffee, and anime.
            </p>
            <p className="measure mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Lately that means voice AI that picks up real phone calls, Go
              microservices behind it, and {prCount}+ pull requests merged
              into stdlib-js.
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              Graduating from IIIT Lucknow in June 2027. Open to backend,
              infrastructure, and applied-AI roles.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
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
          <div className="flex flex-col items-center gap-1 justify-self-center lg:justify-self-end">
            <AsciiDonut />
            <p className="font-mono text-[11px] text-muted-foreground">
              donut.c, re-derived by hand. No 3D library.
            </p>
          </div>
        </div>

        <div className="border-y py-5">
          <StackStrip />
        </div>
      </section>

      <section>
        <SectionHeading title="Experience" href="/experience" linkText="All work and education" />
        <ExperienceLedger />
      </section>

      <section>
        <SectionHeading
          title="Selected projects"
          href="/projects"
          linkText={`All ${projectCount} projects`}
        />
        <FeaturedProjects />
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
        <SectionHeading title="Skills" />
        <Skills />
      </section>

      <ContactStrip />
    </div>
  );
}
