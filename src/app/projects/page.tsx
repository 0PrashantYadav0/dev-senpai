import ProjectsBrowser from "@/components/projects/ProjectsBrowser";
import data from "@/data/projects.json";
import { projectSchema } from "@/lib/schemas";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Everything Prashant has shipped, from Kubernetes platforms to a Pygame mini-game.",
};

export default function ProjectPage() {
  const projects = projectSchema.parse(data).projects;

  return (
    <div className="flex flex-col gap-10 pb-8 pt-10 sm:pt-16">
      <header>
        <h1 className="display text-4xl sm:text-5xl">Projects</h1>
        <p className="measure mt-4 text-muted-foreground sm:text-lg">
          {projects.length} things built for hackathons, coursework, curiosity,
          and production. Most link to source.
        </p>
      </header>
      <ProjectsBrowser projects={projects} />
    </div>
  );
}
