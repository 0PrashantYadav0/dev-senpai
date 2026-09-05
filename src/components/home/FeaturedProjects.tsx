import data from "@/data/projects.json";
import { projectSchema } from "@/lib/schemas";
import ProjectRow from "../projects/ProjectRow";

/** Four that best show range: consensus, low latency, Kubernetes, applied AI. */
const FEATURED = ["raft-kv", "Limit Order Book", "KubeStore", "Vulnpilot"];

export default function FeaturedProjects() {
  const all = projectSchema.parse(data).projects;
  const featured = FEATURED.map((name) => all.find((p) => p.name === name)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );

  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
      {featured.map((p) => (
        <li key={p.name}>
          <ProjectRow project={p} layout="compact" />
        </li>
      ))}
    </ul>
  );
}
