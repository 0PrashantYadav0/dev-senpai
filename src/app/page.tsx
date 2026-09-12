import Achievements from "@/components/home/Achievements";
import AsciiDonut from "@/components/home/AsciiDonut";
import Banner from "@/components/home/Banner";
import ContactStrip from "@/components/home/ContactStrip";
import ExperienceLedger from "@/components/home/ExperienceLedger";
import FeaturedProjects from "@/components/home/FeaturedProjects";
import GitHubActivity from "@/components/home/GitHubActivity";
import IndexRail from "@/components/home/IndexRail";
import OpenSource from "@/components/home/OpenSource";
import SectionHeading from "@/components/home/SectionHeading";
import SkillChips from "@/components/home/SkillChips";
import Icon from "@/components/Icon";
import Rule from "@/components/layout/Rule";
import profile from "@/data/profile.json";
import projectsData from "@/data/projects.json";
import socialsData from "@/data/socials.json";
import { GITHUB_USER, getMergedStdlibPrCount, getPullRequests } from "@/lib/github";
import { socialSchema } from "@/lib/schemas";
import { FileText, Mail } from "lucide-react";
import Link from "next/link";

const INDEX = [
  { id: "intro", label: "Intro" },
  { id: "github", label: "GitHub" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "open-source", label: "Open source" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

export default async function Home() {
  const projectCount = projectsData.projects.length;
  const socials = socialSchema.parse(socialsData).socials;
  const [stdlib, prs] = await Promise.all([getMergedStdlibPrCount(), getPullRequests()]);
  const mergedEverywhere = prs?.merged.total ?? stdlib.count;
  const age = new Date().getFullYear() - profile.birthYear - 1;

  return (
    <div className="pb-4">
      <IndexRail entries={INDEX} />

      {/* Banner runs rail to rail; the donut rises over its lower edge. */}
      <div className="-mx-[var(--gutter)]">
        <Banner />
      </div>

      <section id="intro" className="relative z-10 scroll-mt-20">
        <div className="-mt-[88px] flex flex-col gap-2 sm:-mt-[104px] sm:flex-row sm:items-end sm:gap-6">
          <div className="-ml-2 shrink-0 sm:-ml-3">
            <AsciiDonut className="text-[7px] sm:text-[8.5px] md:text-[9.5px]" />
          </div>
          <div className="min-w-0 pb-1">
            <h1 className="display text-[2.2rem] leading-none sm:text-[2.5rem]">
              hi, prashant here{" "}
              <span aria-hidden className="inline-block">
                👋
              </span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {age}, {profile.location}. Final year at IIIT Lucknow.
            </p>
          </div>
        </div>

        <p className="mt-8 text-[17px] leading-relaxed">
          Software developer. I like building complex systems, instant coffee,
          and anime.
        </p>
        <ul className="intro-list mt-3 flex flex-col gap-1.5 text-[15px] leading-relaxed text-muted-foreground">
          <li>
            Lately that means voice AI that picks up real phone calls, and the
            Go services that keep it on the line.
          </li>
          <li>
            {mergedEverywhere}+ pull requests merged across open source, most
            of them into{" "}
            <a
              href={profile.openSource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-signal"
            >
              stdlib-js
            </a>
            .
          </li>
          <li>
            Graduating in June 2027. Open to backend, infrastructure, and
            applied-AI roles.
          </li>
        </ul>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={profile.resume}
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <FileText className="size-4" />
            Download resume
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3.5 text-sm font-medium transition-colors hover:border-signal"
          >
            <Mail className="size-4" />
            Send an email
          </Link>
        </div>

        <p className="mt-7 text-sm text-muted-foreground">
          Here are my <span className="text-foreground">socials</span>
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {socials.map((s) => (
            <li key={s.name}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-card px-2.5 text-[13px] transition-colors hover:border-signal"
              >
                <Icon name={s.icon} aria-hidden className="size-3.5" />
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <Rule />

      <section id="github" className="scroll-mt-20">
        <SectionHeading
          title="GitHub"
          href={`https://github.com/${GITHUB_USER}`}
          linkText={`@${GITHUB_USER}`}
          external
        />
        <GitHubActivity />
      </section>

      <Rule />

      <section id="experience" className="scroll-mt-20">
        <SectionHeading title="Experience" href="/experience" linkText="All work and education" />
        <ExperienceLedger />
      </section>

      <Rule />

      <section id="projects" className="scroll-mt-20">
        <SectionHeading
          title="Selected projects"
          href="/projects"
          linkText={`All ${projectCount} projects`}
        />
        <FeaturedProjects />
      </section>

      <Rule />

      <section id="open-source" className="scroll-mt-20 grid gap-12 md:grid-cols-2 md:gap-10">
        <div>
          <SectionHeading title="Open source" />
          <OpenSource />
        </div>
        <div>
          <SectionHeading title="Achievements" />
          <Achievements />
        </div>
      </section>

      <Rule />

      <section id="skills" className="scroll-mt-20">
        <SectionHeading title="Skills and technologies" />
        <SkillChips />
      </section>

      <Rule />

      <section id="contact" className="scroll-mt-20">
        <ContactStrip />
      </section>
    </div>
  );
}
