import Timeline from "@/components/experience/Timeline";
import SectionHeading from "@/components/home/SectionHeading";
import careerData from "@/data/career.json";
import educationData from "@/data/education.json";
import profile from "@/data/profile.json";
import { careerSchema, educationSchema } from "@/lib/schemas";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work",
  description: "Where Prashant has worked, what he built there, and what he studied.",
};

export default function ExperiencePage() {
  const career = careerSchema.parse(careerData).career;
  const education = educationSchema.parse(educationData).education;
  const os = profile.openSource;

  return (
    <div className="flex flex-col gap-16 pb-8 pt-10 sm:pt-16">
      <header>
        <h1 className="display text-4xl sm:text-5xl">Work</h1>
        <p className="measure mt-4 text-muted-foreground sm:text-lg">
          Four internships, steady open-source contributions, and a degree in
          progress. Newest first.
        </p>
      </header>

      <section>
        <SectionHeading title="Internships" />
        <Timeline
          items={career.map((c) => ({
            name: c.name,
            href: c.href,
            title: c.title,
            logo: c.logo,
            meta: c.location,
            start: c.start,
            end: c.end,
            description: c.description,
            tech: c.tech,
          }))}
        />
      </section>

      <section>
        <SectionHeading title="Open source" />
        <Timeline
          items={[
            {
              name: os.name,
              href: os.href,
              title: os.role,
              meta: "Remote",
              start: os.start,
              end: os.end ?? undefined,
              description: os.description,
            },
          ]}
        />
      </section>

      <section>
        <SectionHeading title="Education" />
        <Timeline
          items={education.map((e) => ({
            name: e.name,
            href: e.href,
            title: e.title,
            logo: e.logo,
            start: e.start,
            end: e.end,
            description: e.description,
          }))}
        />
      </section>

      <section>
        <SectionHeading title="Roles at college" />
        <Timeline
          items={profile.roles.map((r) => ({
            name: r.title,
            title: "",
            start: r.start,
            end: r.end ?? undefined,
            description: [r.description],
          }))}
        />
      </section>
    </div>
  );
}
